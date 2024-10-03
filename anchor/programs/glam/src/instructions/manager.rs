use crate::{
    constants::*,
    error::{FundError, ManagerError},
    policy_hook::TRANSFER_HOOK_EXTRA_ACCOUNTS,
    state::*,
    ID,
};
use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    token_2022::{
        self,
        spl_token_2022::{self, extension::ExtensionType, state::Mint as StateMint},
    },
    token_2022_extensions::spl_token_metadata_interface,
    token_interface::{Mint, Token2022},
};
use {
    spl_tlv_account_resolution::{
        account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
    },
    spl_transfer_hook_interface::instruction::ExecuteInstruction,
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
    /// CHECK: Token2022 Mint, we manually create it with dynamic extensions
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

    /// CHECK: Token2022 Transfer Hook, we manually create it
    #[account(
        init,
        space = ExtraAccountMetaList::size_of(TRANSFER_HOOK_EXTRA_ACCOUNTS).unwrap(),
        seeds = [b"extra-account-metas", share_class_mint.key().as_ref()],
        bump,
        payer = manager,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    #[account(mut, has_one = manager @ ManagerError::NotAuthorizedError)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut)]
    pub openfunds: Box<Account<'info, FundMetadataAccount>>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_2022_program: Program<'info, Token2022>,
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

    //
    // Compute and add share class params
    //
    let mut share_class_params = vec![
        EngineField {
            name: EngineFieldName::ShareClassAllowlist,
            value: EngineFieldValue::VecPubkey {
                val: share_class_metadata.allowlist.clone(),
            },
        },
        EngineField {
            name: EngineFieldName::ShareClassBlocklist,
            value: EngineFieldValue::VecPubkey {
                val: share_class_metadata.blocklist.clone(),
            },
        },
    ];
    let share_class_metadata = &mut share_class_metadata.clone();
    let mut raw_openfunds = share_class_metadata
        .raw_openfunds
        .clone()
        .unwrap_or_default();

    // Policy: Lock-up
    // Input:
    // - lock_up_period_in_seconds (engine)
    // - lock_up_comment (openfunds)
    // Output:
    // - has_lock_up_for_redemption (openfunds)
    // - lock_up_period_in_days (openfunds)
    let policy_has_lock_up = share_class_metadata.lock_up_period_in_seconds > 0;
    if policy_has_lock_up {
        share_class_params.push(EngineField {
            name: EngineFieldName::LockUp,
            value: EngineFieldValue::Timestamp {
                // lock_up_period_in_seconds is i32 so it's easier to use in js,
                // we can express it as a number instead of requiring BN.
                // the max lock up is 24k+ days, so it should be good.
                val: share_class_metadata.lock_up_period_in_seconds.into(),
            },
        });
        raw_openfunds.lock_up_period_in_days =
            Some((1 + share_class_metadata.lock_up_period_in_seconds / 24 * 60 * 60).to_string())
    } else {
        raw_openfunds.lock_up_period_in_days = None;
        raw_openfunds.lock_up_comment = None;
    }
    raw_openfunds.has_lock_up_for_redemption = Some(policy_has_lock_up);

    share_class_metadata.raw_openfunds = Some(raw_openfunds);
    fund.params.push(share_class_params);

    let openfunds_metadata = Vec::<ShareClassField>::from(&share_class_metadata.clone());
    //
    // Add share class to openfunds
    //
    let openfunds = &mut ctx.accounts.openfunds;
    openfunds.share_classes.push(openfunds_metadata.clone());

    //
    // Initialize share class mint, extensions and metadata
    //
    let share_mint = &ctx.accounts.share_class_mint.to_account_info();
    let share_mint_key = &share_mint.key();
    let share_metadata = share_mint;
    let share_self_authority = share_mint;
    let share_permanent_delegate = match share_class_metadata.permanent_delegate {
        Some(system_program::ID) => Some(share_mint.key()),
        other => other,
    };
    let default_account_state_frozen = share_class_metadata.default_account_state_frozen;

    let seeds = &[
        "share".as_bytes(),
        &[share_class_idx],
        fund_key.as_ref(),
        &[ctx.bumps.share_class_mint],
    ];
    let signer_seeds = &[&seeds[..]];

    let transfer_hook_active = policy_has_lock_up;
    let mut extension_types = vec![
        ExtensionType::MetadataPointer,     // always present
        ExtensionType::MintCloseAuthority,  // always present
        ExtensionType::DefaultAccountState, // always present, default AccountState::Initialized
        ExtensionType::TransferHook,        // always present, default transfer_hook_program_id=None
    ];
    if share_permanent_delegate.is_some() {
        extension_types.push(ExtensionType::PermanentDelegate);
    }
    let space = ExtensionType::try_calculate_account_len::<StateMint>(&extension_types).unwrap();
    let metadata_space = 1024;
    let lamports_required = (Rent::get()?).minimum_balance(space + metadata_space);

    msg!(
        "Create Mint and metadata account size and cost: {} lamports: {}",
        space as u64,
        lamports_required
    );

    // Create mint account
    system_program::create_account(
        CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.to_account_info(),
            system_program::CreateAccount {
                from: ctx.accounts.manager.to_account_info(),
                to: share_mint.clone(),
            },
            signer_seeds,
        ),
        lamports_required,
        space as u64,
        &ctx.accounts.token_2022_program.key(),
    )?;

    // Initialize all the extensions before calling mint2
    let mut init_ixs = Vec::new();
    init_ixs.push(
        // always present
        spl_token_2022::extension::metadata_pointer::instruction::initialize(
            &Token2022::id(),
            share_mint_key,
            Some(share_self_authority.key()),
            Some(share_metadata.key()),
        )?,
    );
    init_ixs.push(
        // always present
        spl_token_2022::instruction::initialize_mint_close_authority(
            &Token2022::id(),
            share_mint_key,
            Some(&share_self_authority.key()),
        )?,
    );
    init_ixs.push(
        // always present
        spl_token_2022::extension::default_account_state::instruction::initialize_default_account_state(
            &Token2022::id(),
            share_mint_key,
            if default_account_state_frozen { &spl_token_2022::state::AccountState::Frozen } else { &spl_token_2022::state::AccountState::Initialized },
        )?,
    );
    init_ixs.push(
        // always present, transfer_hook_program_id optional
        spl_token_2022::extension::transfer_hook::instruction::initialize(
            &Token2022::id(),
            share_mint_key,
            Some(share_self_authority.key()),
            if transfer_hook_active { Some(ID) } else { None },
        )?,
    );
    if let Some(delegate) = share_permanent_delegate {
        // default not present, optional
        init_ixs.push(spl_token_2022::instruction::initialize_permanent_delegate(
            &Token2022::id(),
            share_mint_key,
            &delegate,
        )?);
    }

    for ix in init_ixs {
        solana_program::program::invoke(&ix, &[share_mint.clone(), share_self_authority.clone()])?;
    }

    // Invoke mint2
    token_2022::initialize_mint2(
        CpiContext::new(
            ctx.accounts.token_2022_program.to_account_info(),
            token_2022::InitializeMint2 {
                mint: share_mint.clone(),
            },
        ),
        9,
        &share_self_authority.key(),
        Some(&share_self_authority.key()),
    )
    .unwrap();

    // Init transfer hook ExtraAccountMetaList
    let account_metas = vec![
        // index 5, fund
        ExtraAccountMeta::new_with_pubkey(&fund_key, false, false)?,
        // index 6, src_account_policy
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: "account-policy".as_bytes().to_vec(),
                },
                Seed::AccountKey { index: 0 },
            ],
            false, // is_signer
            false, // is_writable
        )?,
        // index 7, dst_account_policy
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal {
                    bytes: "account-policy".as_bytes().to_vec(),
                },
                Seed::AccountKey { index: 2 },
            ],
            false, // is_signer
            false, // is_writable
        )?,
    ];
    let extra_account_meta_list = &ctx.accounts.extra_account_meta_list;
    let mut data = extra_account_meta_list.try_borrow_mut_data()?;
    ExtraAccountMetaList::init::<ExecuteInstruction>(&mut data, &account_metas)?;

    // Init the metadata account
    let share_class_metadata = share_class_metadata.clone();
    let init_token_metadata_ix = spl_token_metadata_interface::instruction::initialize(
        &spl_token_2022::id(),
        &share_metadata.key(),
        &share_self_authority.key(),
        &share_mint.key(),
        &share_self_authority.key(),
        share_class_metadata.name.unwrap(),
        share_class_metadata.symbol.unwrap(),
        share_class_metadata.uri.unwrap(),
    );
    solana_program::program::invoke_signed(
        &init_token_metadata_ix,
        &[
            share_metadata.clone(),
            share_self_authority.clone(),
            share_mint.clone(),
            share_self_authority.clone(),
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
            &share_self_authority.key(),
            spl_token_metadata_interface::state::Field::Key("FundId".to_string()),
            fund_key.to_string(),
        ),
        &[share_mint.clone(), share_self_authority.clone()],
        signer_seeds,
    )?;
    let _ = openfunds_metadata.iter().take(10).try_for_each(|field| {
        solana_program::program::invoke_signed(
            &spl_token_metadata_interface::instruction::update_field(
                &spl_token_2022::id(),
                &share_metadata.key(),
                &share_self_authority.key(),
                spl_token_metadata_interface::state::Field::Key(field.name.to_string()),
                field.clone().value,
            ),
            &[share_mint.clone(), share_self_authority.clone()],
            signer_seeds,
        )
    });

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
        bump, mint::authority = share_class_mint, mint::token_program = token_2022_program
      )]
    share_class_mint: InterfaceAccount<'info, Mint>,

    /// CHECK: Token2022 Transfer Hook, we manually close it
    #[account(
        mut,
        seeds = [b"extra-account-metas", share_class_mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    #[account(mut)]
    pub openfunds: Box<Account<'info, FundMetadataAccount>>,

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
        ctx.accounts.share_class_mint.supply == 0,
        FundError::ShareClassNotEmpty
    );

    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "share".as_bytes(),
        &[share_class_id],
        fund_key.as_ref(),
        &[ctx.bumps.share_class_mint],
    ];
    let signer_seeds = &[&seeds[..]];
    token_2022::close_account(CpiContext::new_with_signer(
        ctx.accounts.token_2022_program.to_account_info(),
        token_2022::CloseAccount {
            account: ctx.accounts.share_class_mint.to_account_info(),
            destination: ctx.accounts.manager.to_account_info(),
            authority: ctx.accounts.share_class_mint.to_account_info(),
        },
        signer_seeds,
    ))?;

    ctx.accounts
        .fund
        .share_classes
        .remove(share_class_id as usize);

    ctx.accounts
        .openfunds
        .share_classes
        .remove(share_class_id as usize);

    close_account_info(
        ctx.accounts.extra_account_meta_list.to_account_info(),
        ctx.accounts.manager.to_account_info(),
    )?;

    msg!(
        "Share class closed: {}",
        ctx.accounts.share_class_mint.key()
    );
    Ok(())
}
