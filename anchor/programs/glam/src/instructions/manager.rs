use anchor_lang::{prelude::*, system_program};
use anchor_spl::{token_2022, token_interface::Token2022};
use spl_token_2022::{extension::ExtensionType, state::Mint as StateMint};

use crate::error::ManagerError;
use crate::state::*;

#[derive(Accounts)]
#[instruction(fund_model: FundModel)]
pub struct InitializeFund<'info> {
    #[account(init, seeds = [b"fund".as_ref(), manager.key().as_ref(), fund_model.created.as_ref().unwrap().key.as_ref()], bump, payer = manager, space = 8 + FundAccount::INIT_SIZE)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(init, seeds = [b"openfunds".as_ref(), fund.key().as_ref()], bump, payer = manager, space = FundMetadataAccount::INIT_SIZE)]
    pub openfunds: Box<Account<'info, FundMetadataAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_fund_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, InitializeFund<'info>>,
    fund_model: FundModel,
) -> Result<()> {
    //
    // Create the treasury account
    //
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(std::mem::size_of::<Treasury>() + 8);
    let fund_key = ctx.accounts.fund.key();

    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    system_program::create_account(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::CreateAccount {
                from: ctx.accounts.manager.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
            signer_seeds,
        ),
        lamports,
        0, // we cannot carry any data with this treasury account, otherwise marinade staking will fail
        &ctx.accounts.system_program.key(),
    )?;

    //
    // Initialize the fund
    //
    let fund = &mut ctx.accounts.fund;
    let treasury = &mut ctx.accounts.treasury;
    let openfunds = &mut ctx.accounts.openfunds;

    let model = fund_model.clone();
    if let Some(fund_name) = model.name {
        require!(
            fund_name.len() < MAX_FUND_NAME,
            ManagerError::InvalidFundName
        );
        fund.name = fund_name;
    }
    if let Some(fund_uri) = model.uri {
        require!(fund_uri.len() < MAX_FUND_URI, ManagerError::InvalidFundUri);
        fund.uri = fund_uri;
    }
    if let Some(openfunds_uri) = model.openfunds_uri {
        require!(
            openfunds_uri.len() < MAX_FUND_URI,
            ManagerError::InvalidFundUri
        );
        fund.openfunds_uri = openfunds_uri;
    }

    fund.treasury = treasury.key();
    fund.openfunds = openfunds.key();
    fund.manager = ctx.accounts.manager.key();

    //
    // Initialize openfunds
    //
    let openfunds_metadata = FundMetadataAccount::from(fund_model);
    openfunds.fund_pubkey = fund.key();
    openfunds.company = openfunds_metadata.company;
    openfunds.fund = openfunds_metadata.fund;
    openfunds.share_classes = openfunds_metadata.share_classes;
    openfunds.fund_managers = openfunds_metadata.fund_managers;

    msg!("Fund created: {}", ctx.accounts.fund.key());
    Ok(())
}

#[derive(Accounts)]
#[instruction(share_class_metadata: ShareClassMetadata)]
pub struct AddShareClass<'info> {
    /// CHECK: we'll create the account later on with metadata
    #[account(
      mut,
      seeds = [
        b"share".as_ref(),
        share_class_metadata.symbol.as_ref(),
        fund.key().as_ref()
      ],
      bump
    )]
    pub share_class_mint: AccountInfo<'info>,

    #[account(mut, has_one = manager @ ManagerError::NotAuthorizedError)]
    pub fund: Account<'info, FundAccount>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

pub fn add_share_class_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, AddShareClass<'info>>,
    share_class_metadata: ShareClassMetadata,
) -> Result<()> {
    let fund = &mut ctx.accounts.fund;
    fund.share_classes.push(ctx.accounts.share_class_mint.key());
    // fund.share_classes_bumps.push(ctx.bumps.share_class_mint);
    //
    // Initialize share class mint and metadata
    //
    let share_mint = ctx.accounts.share_class_mint.to_account_info();
    let share_metadata = ctx.accounts.share_class_mint.to_account_info();
    let share_mint_authority = ctx.accounts.share_class_mint.to_account_info();
    let share_metadata_authority = ctx.accounts.share_class_mint.to_account_info();

    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "share".as_bytes(),
        share_class_metadata.symbol.as_ref(),
        fund_key.as_ref(),
        &[ctx.bumps.share_class_mint],
    ];
    let signer_seeds = &[&seeds[..]];

    let space =
        ExtensionType::try_calculate_account_len::<StateMint>(&[ExtensionType::MetadataPointer])
            .unwrap();
    let metadata_space = ShareClassMetadata::INIT_SIZE;
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
    token_2022::initialize_mint2(mint_cpi_ix, 9, &share_mint_authority.key(), None).unwrap();

    // Init the metadata account
    let init_token_metadata_ix = spl_token_metadata_interface::instruction::initialize(
        &spl_token_2022::id(),
        &share_metadata.key(),
        &share_metadata_authority.key(),
        &share_mint.key(),
        &share_mint_authority.key(),
        share_class_metadata.name.clone(),
        share_class_metadata.symbol.clone(),
        share_class_metadata.uri.clone(),
    );
    solana_program::program::invoke_signed(
        &init_token_metadata_ix,
        &[
            share_metadata.clone(),
            share_metadata_authority.clone(),
            share_mint.clone(),
            share_mint_authority.clone(),
        ],
        signer_seeds,
    )?;

    //
    // Add additional metadata fields
    //
    solana_program::program::invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &share_metadata.key(),
            &share_metadata_authority.key(),
            spl_token_metadata_interface::state::Field::Key("fund_id".to_string()),
            fund_key.to_string(),
        ),
        &[share_mint.clone(), share_mint_authority.clone()],
        signer_seeds,
    )?;
    solana_program::program::invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &share_metadata.key(),
            &share_metadata_authority.key(),
            spl_token_metadata_interface::state::Field::Key("share_class_asset".to_string()),
            share_class_metadata.share_class_asset,
        ),
        &[share_mint.clone(), share_mint_authority.clone()],
        signer_seeds,
    )?;
    solana_program::program::invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &share_metadata.key(),
            &share_metadata_authority.key(),
            spl_token_metadata_interface::state::Field::Key("share_class_asset_id".to_string()),
            share_class_metadata.share_class_asset_id.to_string(),
        ),
        &[share_mint.clone(), share_mint_authority.clone()],
        signer_seeds,
    )?;
    solana_program::program::invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &share_metadata.key(),
            &share_metadata_authority.key(),
            spl_token_metadata_interface::state::Field::Key("isin".to_string()),
            share_class_metadata.isin,
        ),
        &[share_mint.clone(), share_mint_authority.clone()],
        signer_seeds,
    )?;
    solana_program::program::invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &share_metadata.key(),
            &share_metadata_authority.key(),
            spl_token_metadata_interface::state::Field::Key("status".to_string()),
            share_class_metadata.status,
        ),
        &[share_mint.clone(), share_mint_authority.clone()],
        signer_seeds,
    )?;
    solana_program::program::invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &share_metadata.key(),
            &share_metadata_authority.key(),
            spl_token_metadata_interface::state::Field::Key("fee_management".to_string()),
            share_class_metadata.fee_management.to_string(),
        ),
        &[share_mint.clone(), share_mint_authority.clone()],
        signer_seeds,
    )?;
    solana_program::program::invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &share_metadata.key(),
            &share_metadata_authority.key(),
            spl_token_metadata_interface::state::Field::Key("fee_performance".to_string()),
            share_class_metadata.fee_performance.to_string(),
        ),
        &[share_mint.clone(), share_mint_authority.clone()],
        signer_seeds,
    )?;
    solana_program::program::invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &share_metadata.key(),
            &share_metadata_authority.key(),
            spl_token_metadata_interface::state::Field::Key("policy_distribution".to_string()),
            share_class_metadata.policy_distribution,
        ),
        &[share_mint.clone(), share_mint_authority.clone()],
        signer_seeds,
    )?;
    solana_program::program::invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &share_metadata.key(),
            &share_metadata_authority.key(),
            spl_token_metadata_interface::state::Field::Key("extension".to_string()),
            share_class_metadata.extension,
        ),
        &[share_mint.clone(), share_mint_authority.clone()],
        signer_seeds,
    )?;
    solana_program::program::invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &share_metadata.key(),
            &share_metadata_authority.key(),
            spl_token_metadata_interface::state::Field::Key("launch_date".to_string()),
            share_class_metadata.launch_date,
        ),
        &[share_mint.clone(), share_mint_authority.clone()],
        signer_seeds,
    )?;
    solana_program::program::invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &share_metadata.key(),
            &share_metadata_authority.key(),
            spl_token_metadata_interface::state::Field::Key("lifecycle".to_string()),
            share_class_metadata.lifecycle,
        ),
        &[share_mint.clone(), share_mint_authority.clone()],
        signer_seeds,
    )?;
    solana_program::program::invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &share_metadata.key(),
            &share_metadata_authority.key(),
            spl_token_metadata_interface::state::Field::Key("image_uri".to_string()),
            share_class_metadata.image_uri,
        ),
        &[share_mint.clone(), share_mint_authority.clone()],
        signer_seeds,
    )?;
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateFund<'info> {
    #[account(mut, has_one = manager @ ManagerError::NotAuthorizedError)]
    fund: Account<'info, FundAccount>,
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
    // if let Some(activate) = activate {
    //     fund.is_active = activate;
    // }
    // if let Some(asset_weights) = asset_weights {
    //     require!(
    //         asset_weights.len() == fund.assets_weights.len(),
    //         ManagerError::InvalidAssetsLen
    //     );
    //     for (i, &w) in asset_weights.iter().enumerate() {
    //         fund.assets_weights[i] = w;
    //     }
    // }

    msg!("Fund updated: {}", ctx.accounts.fund.key());
    Ok(())
}

#[derive(Accounts)]
pub struct CloseFund<'info> {
    #[account(mut, close = manager, has_one = manager @ ManagerError::NotAuthorizedError)]
    fund: Account<'info, FundAccount>,
    #[account(mut)]
    manager: Signer<'info>,
}

pub fn close_handler(ctx: Context<CloseFund>) -> Result<()> {
    //TODO: check that all share classes have 0 supply
    //TODO: close treasury (checkin that it's empty)
    msg!("Fund closed: {}", ctx.accounts.fund.key());
    Ok(())
}
