use crate::{
    constants::*,
    error::{AccessError, ShareClassError, StateError},
    policy_hook::TRANSFER_HOOK_EXTRA_ACCOUNTS,
    state::*,
    ID,
};
use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    token_2022::{
        self, close_account as close_token_2022_account,
        spl_token_2022::{
            self,
            extension::ExtensionType,
            state::{AccountState, Mint as StateMint},
        },
        CloseAccount as CloseToken2022Account,
    },
    token_2022_extensions::spl_token_metadata_interface,
    token_interface::{
        burn, mint_to, transfer_checked, Burn, Mint, MintTo, Token2022, TokenAccount,
        TransferChecked,
    },
};
use glam_macros::share_class_signer_seeds;
use {
    spl_tlv_account_resolution::{
        account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
    },
    spl_transfer_hook_interface::instruction::ExecuteInstruction,
};

#[derive(Accounts)]
pub struct AddShareClass<'info> {
    /// CHECK: Token2022 Mint, we manually create it with dynamic extensions
    #[account(
      mut,
      seeds = [
        SEED_MINT.as_ref(),
        &[state.mints.len() as u8],
        state.key().as_ref()
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
        payer = signer,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    #[account(mut, constraint = state.owner == signer.key() @ AccessError::NotAuthorized)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut)]
    pub metadata: Box<Account<'info, MetadataAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_2022_program: Program<'info, Token2022>,
}

pub fn add_share_class_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, AddShareClass<'info>>,
    share_class_metadata: ShareClassModel,
) -> Result<()> {
    //
    // Add share class to state
    //
    let state = &mut ctx.accounts.state;
    let state_key = state.key();
    let share_class_idx = state.mints.len() as u8;
    state.mints.push(ctx.accounts.share_class_mint.key());

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
            Some((1 + share_class_metadata.lock_up_period_in_seconds / 24 * 60 * 60).to_string());
    } else {
        raw_openfunds.lock_up_period_in_days = None;
        raw_openfunds.lock_up_comment = None;
    }
    raw_openfunds.has_lock_up_for_redemption = Some(policy_has_lock_up);

    share_class_metadata.raw_openfunds = Some(raw_openfunds);
    state.params.push(share_class_params);

    let share_class_fields = Vec::<ShareClassField>::from(&share_class_metadata.clone());

    //
    // Add share class data to openfunds
    //
    let openfunds = &mut ctx.accounts.metadata;
    openfunds.share_classes.push(share_class_fields.clone());

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
        state_key.as_ref(),
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
                from: ctx.accounts.signer.to_account_info(),
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
        // index 5, state
        ExtraAccountMeta::new_with_pubkey(&state_key, false, false)?,
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
            state_key.to_string(),
        ),
        &[share_mint.clone(), share_self_authority.clone()],
        signer_seeds,
    )?;
    let _ = share_class_fields.iter().take(10).try_for_each(|field| {
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
#[instruction(share_class_id: u8)]
pub struct SetTokenAccountsStates<'info> {
    #[account(mut, seeds = [SEED_MINT.as_ref(), &[share_class_id], state.key().as_ref()], bump)]
    pub share_class_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_2022_program: Program<'info, Token2022>,
}

#[access_control(acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::SetTokenAccountsStates))]
#[access_control(acl::check_integration(&ctx.accounts.state, IntegrationName::Mint))]
#[share_class_signer_seeds]
pub fn set_token_accounts_states_handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, SetTokenAccountsStates<'info>>,
    share_class_id: u8,
    frozen: bool,
) -> Result<()> {
    for account in ctx.remaining_accounts.iter() {
        if !account.owner.eq(&ctx.accounts.token_2022_program.key()) {
            return Err(ShareClassError::InvalidTokenAccount.into());
        }
    }

    // Thaw or freeze the accounts
    // This method is idempotent, so accounts that are already in the desired state will be skipped
    if frozen {
        ctx.remaining_accounts.iter().try_for_each(|account| {
            let ata: InterfaceAccount<'_, TokenAccount> =
                InterfaceAccount::<TokenAccount>::try_from(account)
                    .expect(&format!("Invalid token 2022 account: {}", account.key()));
            if ata.state == AccountState::Frozen {
                Ok(()) // already frozen, skip it
            } else {
                token_2022::freeze_account(CpiContext::new_with_signer(
                    ctx.accounts.token_2022_program.to_account_info(),
                    token_2022::FreezeAccount {
                        account: account.to_account_info(),
                        mint: ctx.accounts.share_class_mint.to_account_info(),
                        authority: ctx.accounts.share_class_mint.to_account_info(),
                    },
                    share_class_signer_seeds,
                ))
            }
        })?;
    } else {
        ctx.remaining_accounts.iter().try_for_each(|account| {
            let ata: InterfaceAccount<'_, TokenAccount> =
                InterfaceAccount::<TokenAccount>::try_from(account)
                    .expect(&format!("Invalid token 2022 account: {}", account.key()));
            if ata.state == AccountState::Initialized {
                Ok(()) // already initialized, skip it
            } else {
                token_2022::thaw_account(CpiContext::new_with_signer(
                    ctx.accounts.token_2022_program.to_account_info(),
                    token_2022::ThawAccount {
                        account: account.to_account_info(),
                        mint: ctx.accounts.share_class_mint.to_account_info(),
                        authority: ctx.accounts.share_class_mint.to_account_info(),
                    },
                    share_class_signer_seeds,
                ))
            }
        })?;
    };

    Ok(())
}

#[derive(Accounts)]
#[instruction(share_class_id: u8)]
pub struct ForceTransferShare<'info> {
    #[account(
        mut,
        associated_token::mint = share_class_mint,
        associated_token::authority = from,
        associated_token::token_program = token_2022_program
    )]
    pub from_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = share_class_mint,
        associated_token::authority = to,
        associated_token::token_program = token_2022_program
    )]
    pub to_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: any address owned by system program
    pub from: SystemAccount<'info>,

    /// CHECK: any address owned by system program, or the system program
    pub to: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [SEED_MINT.as_ref(), &[share_class_id], state.key().as_ref()],
        bump,
        mint::authority = share_class_mint,
        mint::token_program = token_2022_program
    )]
    pub share_class_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_2022_program: Program<'info, Token2022>,
}

#[access_control(acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::ForceTransferShare))]
#[access_control(acl::check_integration(&ctx.accounts.state, IntegrationName::Mint))]
#[share_class_signer_seeds]
pub fn force_transfer_share_handler(
    ctx: Context<ForceTransferShare>,
    share_class_id: u8,
    amount: u64,
) -> Result<()> {
    let decimals = ctx.accounts.share_class_mint.decimals;

    #[cfg(not(feature = "mainnet"))]
    msg!(
        "Transfer {} shares from {} (ata {}) to {} (ata {})",
        amount as f64 / 10u64.pow(decimals as u32) as f64,
        ctx.accounts.from.key(),
        ctx.accounts.from_ata.key(),
        ctx.accounts.to.key(),
        ctx.accounts.to_ata.key()
    );
    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.from_ata.to_account_info(),
                mint: ctx.accounts.share_class_mint.to_account_info(),
                to: ctx.accounts.to_ata.to_account_info(),
                authority: ctx.accounts.share_class_mint.to_account_info(), // permenant delegate
            },
            share_class_signer_seeds,
        ),
        amount,
        decimals,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(share_class_id: u8)]
pub struct BurnShare<'info> {
    #[account(
        mut,
        associated_token::mint = share_class_mint,
        associated_token::authority = from,
        associated_token::token_program = token_2022_program
    )]
    pub from_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: any address owned by system program
    pub from: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [SEED_MINT.as_ref(), &[share_class_id], state.key().as_ref()],
        bump,
        mint::authority = share_class_mint,
        mint::token_program = token_2022_program
    )]
    pub share_class_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_2022_program: Program<'info, Token2022>,
}

#[access_control(acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::BurnShare))]
#[access_control(acl::check_integration(&ctx.accounts.state, IntegrationName::Mint))]
#[share_class_signer_seeds]
pub fn burn_share_handler(ctx: Context<BurnShare>, share_class_id: u8, amount: u64) -> Result<()> {
    #[cfg(not(feature = "mainnet"))]
    msg!(
        "Burn {} shares from {} (ata {})",
        amount as f64 / 10u64.pow(ctx.accounts.share_class_mint.decimals as u32) as f64,
        ctx.accounts.from.key(),
        ctx.accounts.from_ata.key(),
    );
    burn(
        CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.to_account_info(),
            Burn {
                mint: ctx.accounts.share_class_mint.to_account_info(),
                from: ctx.accounts.from_ata.to_account_info(),
                authority: ctx.accounts.share_class_mint.to_account_info(),
            },
            share_class_signer_seeds,
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(share_class_id: u8)]
pub struct MintShare<'info> {
    #[account(
        mut,
        associated_token::mint = share_class_mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_2022_program
    )]
    pub mint_to: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: any address owned by system program
    pub recipient: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [SEED_MINT.as_ref(), &[share_class_id], state.key().as_ref()],
        bump,
        mint::authority = share_class_mint,
        mint::token_program = token_2022_program
    )]
    share_class_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_2022_program: Program<'info, Token2022>,
}

#[access_control(acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::MintShare))]
#[access_control(acl::check_integration(&ctx.accounts.state, IntegrationName::Mint))]
#[share_class_signer_seeds]
pub fn mint_share_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, MintShare<'info>>,
    share_class_id: u8,
    amount: u64,
) -> Result<()> {
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.share_class_mint.to_account_info(),
                to: ctx.accounts.mint_to.to_account_info(),
                authority: ctx.accounts.share_class_mint.to_account_info(),
            },
            share_class_signer_seeds,
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(share_class_id: u8)]
pub struct UpdateShareClass<'info> {
    #[account(
        mut,
        seeds = [SEED_MINT.as_ref(), &[share_class_id], state.key().as_ref()],
        bump,
        mint::authority = share_class_mint,
        mint::token_program = token_2022_program
    )]
    share_class_mint: InterfaceAccount<'info, Mint>,

    #[account(mut, constraint = state.owner == signer.key() @ AccessError::NotAuthorized)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_2022_program: Program<'info, Token2022>,
}

pub fn update_share_class_handler(
    ctx: Context<UpdateShareClass>,
    share_class_id: u8,
    share_class_model: ShareClassModel,
) -> Result<()> {
    let state = &mut ctx.accounts.state;
    if !share_class_model.allowlist.is_empty() {
        let allowlist = state.share_class_allowlist_mut(share_class_id as usize);
        if let Some(_allowlist) = allowlist {
            _allowlist.clear();
            _allowlist.extend(share_class_model.allowlist.clone());
        }
    }
    if !share_class_model.blocklist.is_empty() {
        let blocklist = state.share_class_blocklist_mut(share_class_id as usize);
        if let Some(_blocklist) = blocklist {
            _blocklist.clear();
            _blocklist.extend(share_class_model.blocklist.clone());
        }
    }
    Ok(())
}

#[derive(Accounts)]
#[instruction(share_class_id: u8)]
pub struct CloseShareClass<'info> {
    #[account(mut, constraint = state.owner == signer.key() @ AccessError::NotAuthorized)]
    pub state: Account<'info, StateAccount>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [
          SEED_MINT.as_ref(),
          &[share_class_id],
          state.key().as_ref()
        ],
        bump,
        mint::authority = share_class_mint,
        mint::token_program = token_2022_program
      )]
    pub share_class_mint: InterfaceAccount<'info, Mint>,

    /// CHECK: Token2022 Transfer Hook, we manually close it
    #[account(
        mut,
        seeds = [b"extra-account-metas", share_class_mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    #[account(mut)]
    pub metadata: Box<Account<'info, MetadataAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_2022_program: Program<'info, Token2022>,
}

#[share_class_signer_seeds]
pub fn close_share_class_handler(ctx: Context<CloseShareClass>, share_class_id: u8) -> Result<()> {
    require!(
        (share_class_id as usize) < ctx.accounts.state.mints.len(),
        StateError::NoShareClass
    );

    close_token_2022_account(CpiContext::new_with_signer(
        ctx.accounts.token_2022_program.to_account_info(),
        CloseToken2022Account {
            account: ctx.accounts.share_class_mint.to_account_info(),
            destination: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.share_class_mint.to_account_info(),
        },
        share_class_signer_seeds,
    ))?;

    ctx.accounts.state.mints.remove(share_class_id as usize);

    ctx.accounts
        .metadata
        .share_classes
        .remove(share_class_id as usize);

    close_account_info(
        ctx.accounts.extra_account_meta_list.to_account_info(),
        ctx.accounts.vault.to_account_info(),
    )?;

    msg!(
        "Share class closed: {}",
        ctx.accounts.share_class_mint.key()
    );
    Ok(())
}
