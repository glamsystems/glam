use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    token_2022,
    token_2022::{close_account, CloseAccount},
    token_interface::{Mint, Token2022},
};
use spl_token_2022::{extension::ExtensionType, state::Mint as StateMint};

use crate::{
    constants::*,
    error::{FundError, ManagerError},
    state::*,
};

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
    let share_close_authority = ctx.accounts.share_class_mint.to_account_info();
    let share_metadata_authority = ctx.accounts.share_class_mint.to_account_info();

    let seeds = &[
        "share".as_bytes(),
        &[share_class_idx],
        fund_key.as_ref(),
        &[ctx.bumps.share_class_mint],
    ];
    let signer_seeds = &[&seeds[..]];

    let space = ExtensionType::try_calculate_account_len::<StateMint>(&[
        // ExtensionType::TransferFeeConfig,
        // ExtensionType::TransferFeeAmount,
        ExtensionType::MintCloseAuthority,
        // ExtensionType::DefaultAccountState,
        // ExtensionType::MemoTransfer,
        // ExtensionType::NonTransferable,
        // ExtensionType::PermanentDelegate,
        // ExtensionType::NonTransferableAccount,
        // ExtensionType::TransferHook,
        // ExtensionType::TransferHookAccount,
        ExtensionType::MetadataPointer,
        // ExtensionType::TokenMetadata,
    ])
    .unwrap();
    let metadata_space = 1024;
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

    // Initialize the close authority extension
    let init_close_authority_ix = spl_token_2022::instruction::initialize_mint_close_authority(
        &Token2022::id(),
        &share_mint.key(),
        Some(&share_close_authority.key()),
    )?;
    solana_program::program::invoke(
        &init_close_authority_ix,
        &[share_mint.clone(), share_close_authority.clone()],
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

    fund.params.push(vec![
        EngineField {
            name: EngineFieldName::ShareClassAllowlist,
            value: EngineFieldValue::VecPubkey {
                val: share_class_metadata.allowlist,
            },
        },
        EngineField {
            name: EngineFieldName::ShareClassBlocklist,
            value: EngineFieldValue::VecPubkey {
                val: share_class_metadata.blocklist,
            },
        },
    ]);
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateFund<'info> {
    #[account(mut, constraint = fund.manager == signer.key() @ AccessError::NotAuthorized)]
    fund: Account<'info, FundAccount>,
    #[account(mut)]
    signer: Signer<'info>,
}

pub fn update_fund_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, UpdateFund<'info>>,
    fund_model: FundModel,
) -> Result<()> {
    let fund = &mut ctx.accounts.fund;

    if let Some(name) = fund_model.name {
        require!(name.as_bytes().len() <= 50, ManagerError::InvalidFundName);
        fund.name = name;
    }
    if let Some(uri) = fund_model.uri {
        require!(uri.as_bytes().len() <= 100, ManagerError::InvalidFundName);
        fund.uri = uri;
    }

    if let Some(manager_model) = fund_model.manager {
        if let Some(manager) = manager_model.pubkey {
            fund.manager = manager
        }
    }

    // One of the engine field in `fund.params[0]` stores the existing acls of the fund,
    // and `fund_model.acls` is new acls to be upserted or deleted.
    //
    // For each acl in `fund_model.acls` we check two cases:
    //
    // 1) a fund acl with same pubkey exists
    //   - acl.permissions is empty, delete the fund acl
    //   - acl.permissions is not empty, update permissions
    //
    // 2) a fund acl with same pubkey doesn't exist
    //   - add the acl
    if !fund_model.delegate_acls.is_empty() {
        // Add the acls field if it doesn't exist
        let delegate_acls_field_exists = fund.params[0]
            .iter()
            .any(|field| field.name == EngineFieldName::DelegateAcls);

        if !delegate_acls_field_exists {
            msg!("Adding acls field to fund params");
            fund.params[0].push(EngineField {
                name: EngineFieldName::DelegateAcls,
                value: EngineFieldValue::VecDelegateAcl { val: Vec::new() },
            });
        }

        let to_delete: Vec<Pubkey> = fund_model
            .delegate_acls
            .clone()
            .iter()
            .filter(|acl| acl.permissions.is_empty())
            .map(|acl| acl.pubkey)
            .collect();
        if !to_delete.is_empty() {
            for EngineField { name, value } in &mut fund.params[0] {
                if let (EngineFieldName::DelegateAcls, EngineFieldValue::VecDelegateAcl { val }) =
                    (name, value)
                {
                    val.retain(|acl| !to_delete.contains(&acl.pubkey));
                }
            }
        }
        let to_upsert = fund_model
            .delegate_acls
            .clone()
            .into_iter()
            .filter(|acl| !acl.permissions.is_empty());

        for new_acl in to_upsert {
            for EngineField { name, value } in &mut fund.params[0] {
                if let (EngineFieldName::DelegateAcls, EngineFieldValue::VecDelegateAcl { val }) =
                    (name, value)
                {
                    if let Some(existing_acl) =
                        val.iter_mut().find(|acl| acl.pubkey == new_acl.pubkey)
                    {
                        existing_acl.permissions = new_acl.permissions.clone();
                    } else {
                        val.push(new_acl.clone());
                    }
                }
            }
        }
    }

    // Update integration acls for the fund
    if !fund_model.integration_acls.is_empty() {
        // Check if the integrations field exists
        // Add the integrations field if it doesn't exist
        let integration_acl_field_exists = fund.params[0]
            .iter()
            .any(|field| field.name == EngineFieldName::IntegrationAcls);

        if !integration_acl_field_exists {
            msg!("Adding integrations field to fund params");
            fund.params[0].push(EngineField {
                name: EngineFieldName::IntegrationAcls,
                value: EngineFieldValue::VecIntegrationAcl { val: Vec::new() },
            });
        }

        for EngineField { name, value } in &mut fund.params[0] {
            if let (EngineFieldName::IntegrationAcls, EngineFieldValue::VecIntegrationAcl { val }) =
                (name, value)
            {
                val.clear();
                val.extend(fund_model.integration_acls.clone());
            }
        }
    }

    Ok(())
}

#[derive(Accounts)]
pub struct CloseFund<'info> {
    #[account(mut, close = manager, has_one = manager @ ManagerError::NotAuthorizedError)]
    fund: Account<'info, FundAccount>,

    #[account(mut, close = manager)]
    openfunds: Account<'info, FundMetadataAccount>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    treasury: SystemAccount<'info>,

    #[account(mut)]
    manager: Signer<'info>,

    system_program: Program<'info, System>,
}

pub fn close_handler(ctx: Context<CloseFund>) -> Result<()> {
    require!(
        ctx.accounts.fund.share_classes.len() == 0,
        FundError::CantCloseShareClasses
    );

    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    if ctx.accounts.treasury.lamports() > 0 {
        solana_program::program::invoke_signed(
            &solana_program::system_instruction::transfer(
                ctx.accounts.treasury.key,
                ctx.accounts.manager.key,
                ctx.accounts.treasury.lamports(),
            ),
            &[
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.manager.to_account_info(),
            ],
            signer_seeds,
        )?;
    }

    msg!("Fund closed: {}", ctx.accounts.fund.key());
    Ok(())
}

#[derive(Accounts)]
#[instruction(share_class_id: u8)]
pub struct CloseShareClass<'info> {
    #[account(mut, has_one = manager @ ManagerError::NotAuthorizedError)]
    fund: Account<'info, FundAccount>,

    #[account(
        mut,
        seeds = [
          b"share".as_ref(),
          &[share_class_id],
          fund.key().as_ref()
        ],
        bump, mint::authority = share_class, mint::token_program = token_2022_program
      )]
    share_class: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    manager: Signer<'info>,

    token_2022_program: Program<'info, Token2022>,
}

pub fn close_share_class_handler(ctx: Context<CloseShareClass>, share_class_id: u8) -> Result<()> {
    require!(
        (share_class_id as usize) < ctx.accounts.fund.share_classes.len(),
        FundError::NoShareClassInFund
    );

    // Note: this is redundant because close_account should check that supply == 0
    //       but better safe than sorry
    require!(
        ctx.accounts.share_class.supply == 0,
        FundError::ShareClassNotEmpty
    );

    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "share".as_bytes(),
        &[share_class_id],
        fund_key.as_ref(),
        &[ctx.bumps.share_class],
    ];
    let signer_seeds = &[&seeds[..]];
    close_account(CpiContext::new_with_signer(
        ctx.accounts.token_2022_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.share_class.to_account_info(),
            destination: ctx.accounts.manager.to_account_info(),
            authority: ctx.accounts.share_class.to_account_info(),
        },
        signer_seeds,
    ))?;

    ctx.accounts
        .fund
        .share_classes
        .remove(share_class_id as usize);

    msg!("Share class closed: {}", ctx.accounts.share_class.key());
    Ok(())
}
