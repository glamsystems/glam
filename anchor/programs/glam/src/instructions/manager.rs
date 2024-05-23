use anchor_lang::{prelude::*, system_program};
use anchor_spl::{token_2022, token_interface::Token2022};
use solana_program::pubkey;
use spl_token_2022::{extension::ExtensionType, state::Mint as StateMint};

use crate::error::ManagerError;
use crate::state::*;
use std::cmp::max;

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
    // Set engine params
    //
    fund.params = vec![vec![
        EngineField {
            name: EngineFieldName::Assets,
            value: EngineFieldValue::VecPubkey { val: model.assets },
        },
        EngineField {
            name: EngineFieldName::AssetsWeights,
            value: EngineFieldValue::VecU32 {
                val: model.assets_weights,
            },
        },
    ]];

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
pub struct AddShareClass<'info> {
    /// CHECK: we'll create the account later on with metadata
    #[account(
      mut,
      seeds = [
        b"share".as_ref(),
        &[fund.share_classes.len() as u8],
        fund.key().as_ref()
      ],
      bump
    )]
    pub share_class_mint: AccountInfo<'info>,

    #[account(mut, has_one = manager @ ManagerError::NotAuthorizedError)]
    pub fund: Account<'info, FundAccount>,

    #[account(mut)]
    pub openfunds: Box<Account<'info, FundMetadataAccount>>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

pub fn add_share_class_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, AddShareClass<'info>>,
    share_class_metadata: ShareClassModel,
) -> Result<()> {
    //
    // Add share class to fund
    //
    let fund = &mut ctx.accounts.fund;
    let fund_key = fund.key();
    let share_class_idx = fund.share_classes.len() as u8;
    fund.share_classes.push(ctx.accounts.share_class_mint.key());

    let openfunds_metadata = Vec::<ShareClassField>::from(&share_class_metadata);
    //
    // Add share class to openfunds
    //
    let openfunds = &mut ctx.accounts.openfunds;
    openfunds.share_classes.push(openfunds_metadata.clone());

    //
    // Initialize share class mint and metadata
    //
    let share_mint = ctx.accounts.share_class_mint.to_account_info();
    let share_metadata = ctx.accounts.share_class_mint.to_account_info();
    let share_mint_authority = ctx.accounts.share_class_mint.to_account_info();
    let share_metadata_authority = ctx.accounts.share_class_mint.to_account_info();

    let seeds = &[
        "share".as_bytes(),
        &[share_class_idx],
        fund_key.as_ref(),
        &[ctx.bumps.share_class_mint],
    ];
    let signer_seeds = &[&seeds[..]];

    let space =
        ExtensionType::try_calculate_account_len::<StateMint>(&[ExtensionType::MetadataPointer])
            .unwrap();
    let metadata_space = 2048;
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
        share_class_metadata.name.unwrap(),
        share_class_metadata.symbol.unwrap(),
        share_class_metadata.uri.unwrap(),
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
            spl_token_metadata_interface::state::Field::Key("FundId".to_string()),
            fund_key.to_string(),
        ),
        &[share_mint.clone(), share_mint_authority.clone()],
        signer_seeds,
    )?;
    let _ = openfunds_metadata.iter().take(10).try_for_each(|field| {
        solana_program::program::invoke_signed(
            &spl_token_metadata_interface::instruction::update_field(
                &spl_token_2022::id(),
                &share_metadata.key(),
                &share_metadata_authority.key(),
                spl_token_metadata_interface::state::Field::Key(field.name.to_string()),
                field.clone().value,
            ),
            &[share_mint.clone(), share_mint_authority.clone()],
            signer_seeds,
        )
    });

    Ok(())
}

#[derive(Accounts)]
pub struct InitShareClassAcls<'info> {
    /// CHECK: must be among fund.share_classes
    #[account()]
    pub share_class_mint: AccountInfo<'info>,

    #[account(mut, has_one = manager @ ManagerError::NotAuthorizedError)]
    pub fund: Account<'info, FundAccount>,

    #[account(
        init,
        seeds = [b"allowlist".as_ref(), share_class_mint.key().as_ref()], bump,
        payer = manager,
        space = PubkeyAcl::INIT_SIZE
    )]
    pub allowlist: Account<'info, PubkeyAcl>,

    #[account(
        init,
        seeds = [b"blocklist".as_ref(), share_class_mint.key().as_ref()], bump,
        payer = manager,
        space = PubkeyAcl::INIT_SIZE
    )]
    pub blocklist: Account<'info, PubkeyAcl>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub system_program: Program<'info, System>,
}
pub fn init_share_class_allowlist_and_blocklist<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, InitShareClassAcls<'info>>,
) -> Result<()> {
    ctx.accounts.allowlist.items = Vec::new();
    ctx.accounts.blocklist.items = Vec::new();

    Ok(())
}
#[derive(Accounts)]
pub struct UpsertShareClassAllowlist<'info> {
    /// CHECK: must be among fund.share_classes
    #[account()]
    pub share_class_mint: AccountInfo<'info>,

    #[account(mut, has_one = manager @ ManagerError::NotAuthorizedError)]
    pub fund: Account<'info, FundAccount>,

    #[account(mut)]
    pub allowlist: Account<'info, PubkeyAcl>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
pub fn upsert_share_class_allowlist<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, UpsertShareClassAllowlist<'info>>,
    pubkeys: Vec<Pubkey>,
) -> Result<()> {
    if let Some(found) = ctx
        .accounts
        .fund
        .share_classes
        .iter()
        .find(|&x| *x == ctx.accounts.share_class_mint.key())
    {
        msg!("Share class found: {}", found);

        let allowlist_account_info = ctx.accounts.allowlist.to_account_info();
        let curr_data_size = allowlist_account_info.data_len();
        if curr_data_size == PubkeyAcl::INIT_SIZE {
            ctx.accounts.allowlist.items = Vec::new();
        }

        let space_left =
            curr_data_size - ctx.accounts.allowlist.items.len() * 32 - PubkeyAcl::INIT_SIZE;

        msg!("current data size: {}", curr_data_size);
        msg!(
            "current length of list: {}",
            ctx.accounts.allowlist.items.len()
        );
        msg!("space left: {}", space_left);

        if space_left < 32 {
            let needed_len = curr_data_size + 64; // max(20, pubkeys.len()) * 32;
            AccountInfo::realloc(&allowlist_account_info, needed_len, true)?;

            // if more lamports are needed, transfer them to the account
            let rent_exempt_lamports = ctx.accounts.rent.minimum_balance(needed_len).max(1);
            let top_up_lamports =
                rent_exempt_lamports.saturating_sub(allowlist_account_info.lamports());

            msg!("top up lamports: {}", top_up_lamports);

            if top_up_lamports > 0 {
                anchor_lang::system_program::transfer(
                    anchor_lang::context::CpiContext::new(
                        ctx.accounts.system_program.to_account_info(),
                        anchor_lang::system_program::Transfer {
                            from: ctx.accounts.manager.to_account_info(),
                            to: ctx.accounts.allowlist.to_account_info(),
                        },
                    ),
                    top_up_lamports,
                )?;
            }
        }

        let curr_data_size = allowlist_account_info.data_len();
        msg!("current data size after realloc: {}", curr_data_size);

        ctx.accounts.allowlist.reload()?;
        msg!("add pubkeys to allowlist: {:?}", pubkeys);
        ctx.accounts.allowlist.items.extend(pubkeys);
    }

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
