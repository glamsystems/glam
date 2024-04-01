use anchor_lang::{prelude::*, system_program};
use anchor_spl::token_2022;
use anchor_spl::token_interface::{Mint, Token2022};
use spl_token_2022::{extension::ExtensionType, state::Mint as StateMint};

use crate::error::ManagerError;
use crate::state::fund::*;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeFund<'info> {
    #[account(init, seeds = [b"fund".as_ref(), manager.key().as_ref(), name.as_ref()], bump, payer = manager, space = 8 + Fund::INIT_SIZE)]
    pub fund: Account<'info, Fund>,

    #[account(init, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump, payer = manager, space = 8 + Treasury::INIT_SIZE)]
    pub treasury: Account<'info, Treasury>,

    /// CHECK: we'll create the account later on with metadata
    #[account(mut, seeds = [b"share-0".as_ref(), fund.key().as_ref()], bump)]
    pub share: AccountInfo<'info>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize_fund_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, InitializeFund<'info>>,
    fund_name: String,
    fund_symbol: String,
    fund_uri: String,
    asset_weights: Vec<u32>,
    activate: bool,
    share_name: String,
    share_symbol: String,
    share_uri: String,
) -> Result<()> {
    //
    // Validate the input
    //
    require!(
        fund_name.as_bytes().len() <= MAX_FUND_NAME,
        ManagerError::InvalidFundName
    );
    require!(
        fund_symbol.as_bytes().len() <= MAX_FUND_SYMBOL,
        ManagerError::InvalidFundSymbol
    );
    require!(
        fund_uri.as_bytes().len() <= MAX_FUND_URI,
        ManagerError::InvalidFundUri
    );

    let assets_len = ctx.remaining_accounts.len();
    require!(assets_len <= MAX_ASSETS, ManagerError::InvalidAssetsLen);
    require!(
        asset_weights.len() == assets_len,
        ManagerError::InvalidAssetsLen
    );

    //
    // Initialize the fund
    //
    let fund = &mut ctx.accounts.fund;
    let treasury = &mut ctx.accounts.treasury;

    fund.manager = ctx.accounts.manager.key();
    fund.treasury = treasury.key();
    fund.name = fund_name;
    fund.symbol = fund_symbol;
    fund.uri = fund_uri;
    fund.bump_fund = ctx.bumps.fund;
    fund.bump_treasury = ctx.bumps.treasury;
    fund.time_created = Clock::get()?.unix_timestamp;
    fund.share_classes_len = 1;
    fund.share_classes[0] = ctx.accounts.share.key();
    fund.share_classes_bumps[0] = ctx.bumps.share;

    fund.assets_len = assets_len as u8;
    for (i, account) in ctx.remaining_accounts.iter().enumerate() {
        let asset = InterfaceAccount::<Mint>::try_from(account).expect("invalid asset");
        fund.assets[i] = asset.key();
    }
    for (i, &w) in asset_weights.iter().enumerate() {
        fund.assets_weights[i] = w;
    }
    fund.is_active = activate;

    treasury.manager = ctx.accounts.manager.key();
    treasury.fund = fund.key();
    treasury.bump = ctx.bumps.treasury;

    //
    // Initialize share class mint and metadata
    //
    let share_mint = ctx.accounts.share.to_account_info();
    let share_metadata = ctx.accounts.share.to_account_info();
    let share_mint_authority = ctx.accounts.share.to_account_info();
    let share_metadata_authority = ctx.accounts.share.to_account_info();

    let fund_key = ctx.accounts.fund.key();
    let seeds = &["share-0".as_bytes(), fund_key.as_ref(), &[ctx.bumps.share]];
    let signer_seeds = &[&seeds[..]];

    let space =
        ExtensionType::try_calculate_account_len::<StateMint>(&[ExtensionType::MetadataPointer])
            .unwrap();
    let metadata_space = 250; // we may need more space for metadata in the future

    let lamports_required = (Rent::get()?).minimum_balance(space + metadata_space);

    msg!(
        "Create Mint and metadata account size and cost: {} lamports: {}",
        space as u64,
        lamports_required
    );

    system_program::create_account(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            system_program::CreateAccount {
                from: ctx.accounts.manager.to_account_info(),
                to: share_mint.clone(),
            },
            signer_seeds,
        ),
        lamports_required,
        space as u64,
        &ctx.accounts.token_program.key(),
    )?;

    // Initialize the metadata pointer (Need to do this before initializing the mint)
    let init_metadata_pointer_ix =
        spl_token_2022::extension::metadata_pointer::instruction::initialize(
            &Token2022::id(),
            &share_mint.key(),
            Some(share_metadata_authority.key()),
            Some(share_metadata.key()),
        )?;
    solana_program::program::invoke(
        &init_metadata_pointer_ix,
        &[share_mint.clone(), share_metadata_authority.clone()],
    )?;

    // mint2
    let mint_cpi_ix = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token_2022::InitializeMint2 {
            mint: share_mint.clone(),
        },
    );
    token_2022::initialize_mint2(mint_cpi_ix, 0, &share_mint_authority.key(), None).unwrap();

    // Init the metadata account
    let init_token_metadata_ix = spl_token_metadata_interface::instruction::initialize(
        &spl_token_2022::id(),
        &share_metadata.key(),
        &share_metadata_authority.key(),
        &share_mint.key(),
        &share_mint_authority.key(),
        share_name,
        share_symbol,
        share_uri,
    );
    solana_program::program::invoke_signed(
        &init_token_metadata_ix,
        &[
            share_metadata,
            share_metadata_authority,
            share_mint,
            share_mint_authority,
        ],
        signer_seeds,
    )?;

    msg!("Fund created: {}", ctx.accounts.fund.key());
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateFund<'info> {
    #[account(mut, has_one = manager @ ManagerError::NotAuthorizedError)]
    fund: Account<'info, Fund>,
    #[account(mut)]
    manager: Signer<'info>,
}

pub fn update_fund_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, UpdateFund<'info>>,
    name: Option<String>,
    uri: Option<String>,
    asset_weights: Option<Vec<u32>>,
    activate: Option<bool>,
) -> Result<()> {
    let fund = &mut ctx.accounts.fund;

    if let Some(name) = name {
        require!(name.as_bytes().len() <= 50, ManagerError::InvalidFundName);
        fund.name = name;
    }
    if let Some(uri) = uri {
        require!(uri.as_bytes().len() <= 100, ManagerError::InvalidFundName);
        fund.uri = uri;
    }
    if let Some(activate) = activate {
        fund.is_active = activate;
    }
    if let Some(asset_weights) = asset_weights {
        let assets_len = asset_weights.len();
        require!(assets_len <= MAX_ASSETS, ManagerError::InvalidAssetsLen);
        require!(
            assets_len == fund.assets_len as usize,
            ManagerError::InvalidAssetsLen
        );
        for (i, &w) in asset_weights.iter().enumerate() {
            fund.assets_weights[i] = w;
        }
    }

    msg!("Fund updated: {}", ctx.accounts.fund.key());
    Ok(())
}

#[derive(Accounts)]
pub struct CloseFund<'info> {
    #[account(mut, close = manager, has_one = manager @ ManagerError::NotAuthorizedError)]
    fund: Account<'info, Fund>,
    #[account(mut)]
    manager: Signer<'info>,
}

pub fn close_handler(ctx: Context<CloseFund>) -> Result<()> {
    //TODO: check that all share classes have 0 supply
    //TODO: close treasury (checkin that it's empty)
    msg!("Fund closed: {}", ctx.accounts.fund.key());
    Ok(())
}
