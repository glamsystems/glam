use crate::{
    constants::*, error::GlamError, gen_mint_signer_seeds,
    policy_hook::TRANSFER_HOOK_EXTRA_ACCOUNTS, state::*, ID,
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
use glam_macros::mint_signer_seeds;
use {
    spl_tlv_account_resolution::{
        account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
    },
    spl_transfer_hook_interface::instruction::ExecuteInstruction,
};

#[derive(Accounts)]
pub struct NewMint<'info> {
    #[account(mut, constraint = glam_state.owner == signer.key() @ GlamError::NotAuthorized)]
    pub glam_state: Box<Account<'info, StateAccount>>,

    /// CHECK: Token2022 Mint, we manually create it with dynamic extensions
    #[account(
      mut,
      seeds = [
        SEED_MINT.as_ref(),
        &[glam_state.mints.len() as u8],
        glam_state.key().as_ref()
      ],
      bump
    )]
    pub new_mint: AccountInfo<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: Token2022 Transfer Hook, we manually create it
    #[account(
        init,
        space = ExtraAccountMetaList::size_of(TRANSFER_HOOK_EXTRA_ACCOUNTS).unwrap(),
        seeds = [b"extra-account-metas", new_mint.key().as_ref()],
        bump,
        payer = signer,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    #[account(mut, seeds = [SEED_METADATA.as_bytes(), glam_state.key().as_ref()], bump)]
    pub openfunds_metadata: Option<Box<Account<'info, OpenfundsMetadataAccount>>>,

    pub system_program: Program<'info, System>,
    pub token_2022_program: Program<'info, Token2022>,
}

pub fn add_mint_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, NewMint<'info>>,
    mint_model: MintModel,
) -> Result<()> {
    //
    // Add mint to state
    //
    let state = &mut ctx.accounts.glam_state;
    let state_key = state.key();
    let mint_idx = state.mints.len() as u8;
    state.mints.push(ctx.accounts.new_mint.key());

    //
    // Compute and add mint params
    //
    let mut mint_params = vec![
        EngineField {
            name: EngineFieldName::Allowlist,
            value: EngineFieldValue::VecPubkey {
                val: mint_model.clone().allowlist.unwrap_or_default(),
            },
        },
        EngineField {
            name: EngineFieldName::Blocklist,
            value: EngineFieldValue::VecPubkey {
                val: mint_model.clone().blocklist.unwrap_or_default(),
            },
        },
    ];
    let mint_model = &mut mint_model.clone();
    let mut raw_openfunds = mint_model.raw_openfunds.clone().unwrap_or_default();

    // Policy: Lock-up
    // Input:
    // - lock_up_period_in_seconds (engine)
    // - lock_up_comment (openfunds)
    // Output:
    // - has_lock_up_for_redemption (openfunds)
    // - lock_up_period_in_days (openfunds)

    let mut transfer_hook_active = false;
    if let Some(lock_up_period_in_seconds) = mint_model.lock_up_period_in_seconds {
        let policy_has_lock_up = lock_up_period_in_seconds > 0;
        transfer_hook_active = policy_has_lock_up;

        if policy_has_lock_up {
            mint_params.push(EngineField {
                name: EngineFieldName::LockUp,
                value: EngineFieldValue::Timestamp {
                    // lock_up_period_in_seconds is i32 so it's easier to use in js,
                    // we can express it as a number instead of requiring BN.
                    // the max lock up is 24k+ days, so it should be good.
                    val: lock_up_period_in_seconds.into(),
                },
            });
            raw_openfunds.lock_up_period_in_days =
                Some((1 + lock_up_period_in_seconds / 24 * 60 * 60).to_string());
        } else {
            raw_openfunds.lock_up_period_in_days = None;
            raw_openfunds.lock_up_comment = None;
        }
        raw_openfunds.has_lock_up_for_redemption = Some(policy_has_lock_up);
    }

    mint_model.raw_openfunds = Some(raw_openfunds);
    state.params.push(mint_params);

    let share_class_fields = Vec::<ShareClassField>::from(&mint_model.clone());

    //
    // Add mint metadata, currently only openfunds metadata is supported
    //
    if let Some(metadata) = state.metadata.clone() {
        if metadata.template == MetadataTemplate::Openfunds {
            if let Some(openfunds_metadata) = &mut ctx.accounts.openfunds_metadata {
                openfunds_metadata
                    .share_classes
                    .push(share_class_fields.clone());
            }
        }
    }

    //
    // Initialize mint, extensions and metadata
    //
    let mint_account_info = &ctx.accounts.new_mint.to_account_info();
    let mint_key = &mint_account_info.key();
    let token_ext_metadata = mint_account_info;
    let mint_self_authority = mint_account_info;
    let mint_permanent_delegate = match mint_model.permanent_delegate {
        Some(system_program::ID) => Some(mint_account_info.key()),
        other => other,
    };

    let default_account_state_frozen = mint_model.default_account_state_frozen.unwrap_or(false);

    let mut extension_types = vec![
        ExtensionType::MetadataPointer,     // always present
        ExtensionType::MintCloseAuthority,  // always present
        ExtensionType::DefaultAccountState, // always present, default AccountState::Initialized
        ExtensionType::TransferHook,        // always present, default transfer_hook_program_id=None
    ];
    if mint_permanent_delegate.is_some() {
        extension_types.push(ExtensionType::PermanentDelegate);
    }
    let space = ExtensionType::try_calculate_account_len::<StateMint>(&extension_types).unwrap();
    let metadata_space = 1024;
    let lamports_required = (Rent::get()?).minimum_balance(space + metadata_space);

    #[cfg(not(feature = "mainnet"))]
    msg!(
        "Create Mint and metadata account size and cost: {} lamports: {}",
        space as u64,
        lamports_required
    );

    let signer_seeds = gen_mint_signer_seeds!(state_key, mint_idx, ctx.bumps.new_mint);

    // Create mint account
    system_program::create_account(
        CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.to_account_info(),
            system_program::CreateAccount {
                from: ctx.accounts.signer.to_account_info(),
                to: mint_account_info.clone(),
            },
            &[signer_seeds],
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
            mint_key,
            Some(mint_self_authority.key()),
            Some(token_ext_metadata.key()),
        )?,
    );
    init_ixs.push(
        // always present
        spl_token_2022::instruction::initialize_mint_close_authority(
            &Token2022::id(),
            mint_key,
            Some(&mint_self_authority.key()),
        )?,
    );
    init_ixs.push(
        // always present
        spl_token_2022::extension::default_account_state::instruction::initialize_default_account_state(
            &Token2022::id(),
            mint_key,
            if default_account_state_frozen { &spl_token_2022::state::AccountState::Frozen } else { &spl_token_2022::state::AccountState::Initialized },
        )?,
    );
    init_ixs.push(
        // always present, transfer_hook_program_id optional
        spl_token_2022::extension::transfer_hook::instruction::initialize(
            &Token2022::id(),
            mint_key,
            Some(mint_self_authority.key()),
            if transfer_hook_active { Some(ID) } else { None },
        )?,
    );
    if let Some(delegate) = mint_permanent_delegate {
        // default not present, optional
        init_ixs.push(spl_token_2022::instruction::initialize_permanent_delegate(
            &Token2022::id(),
            mint_key,
            &delegate,
        )?);
    }

    for ix in init_ixs {
        solana_program::program::invoke(
            &ix,
            &[mint_account_info.clone(), mint_self_authority.clone()],
        )?;
    }

    // Invoke mint2
    token_2022::initialize_mint2(
        CpiContext::new(
            ctx.accounts.token_2022_program.to_account_info(),
            token_2022::InitializeMint2 {
                mint: mint_account_info.clone(),
            },
        ),
        9,
        &mint_self_authority.key(),
        Some(&mint_self_authority.key()),
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
    let share_class_metadata = mint_model.clone();
    let init_token_metadata_ix = spl_token_metadata_interface::instruction::initialize(
        &spl_token_2022::id(),
        &token_ext_metadata.key(),
        &mint_self_authority.key(),
        &mint_account_info.key(),
        &mint_self_authority.key(),
        share_class_metadata.name.unwrap(),
        share_class_metadata.symbol.unwrap(),
        share_class_metadata.uri.unwrap(),
    );
    solana_program::program::invoke_signed(
        &init_token_metadata_ix,
        &[
            token_ext_metadata.clone(),
            mint_self_authority.clone(),
            mint_account_info.clone(),
            mint_self_authority.clone(),
        ],
        &[signer_seeds],
    )?;

    //
    // Add additional metadata fields
    //
    solana_program::program::invoke_signed(
        &spl_token_metadata_interface::instruction::update_field(
            &spl_token_2022::id(),
            &token_ext_metadata.key(),
            &mint_self_authority.key(),
            spl_token_metadata_interface::state::Field::Key("FundId".to_string()),
            state_key.to_string(),
        ),
        &[mint_account_info.clone(), mint_self_authority.clone()],
        &[signer_seeds],
    )?;
    let _ = share_class_fields.iter().take(10).try_for_each(|field| {
        solana_program::program::invoke_signed(
            &spl_token_metadata_interface::instruction::update_field(
                &spl_token_2022::id(),
                &token_ext_metadata.key(),
                &mint_self_authority.key(),
                spl_token_metadata_interface::state::Field::Key(field.name.to_string()),
                field.clone().value,
            ),
            &[mint_account_info.clone(), mint_self_authority.clone()],
            &[signer_seeds],
        )
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction(mint_id: u8)]
pub struct SetTokenAccountsStates<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_MINT.as_ref(), &[mint_id], glam_state.key().as_ref()], bump)]
    pub glam_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_2022_program: Program<'info, Token2022>,
}

#[access_control(acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.signer.key, Permission::SetTokenAccountState))]
#[access_control(acl::check_state_type(&ctx.accounts.glam_state, AccountType::Mint))]
#[mint_signer_seeds]
pub fn set_token_accounts_states_handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, SetTokenAccountsStates<'info>>,
    mint_id: u8,
    frozen: bool,
) -> Result<()> {
    for account in ctx.remaining_accounts.iter() {
        if !account.owner.eq(&ctx.accounts.token_2022_program.key()) {
            return Err(GlamError::InvalidTokenAccount.into());
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
                        mint: ctx.accounts.glam_mint.to_account_info(),
                        authority: ctx.accounts.glam_mint.to_account_info(),
                    },
                    mint_signer_seeds,
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
                        mint: ctx.accounts.glam_mint.to_account_info(),
                        authority: ctx.accounts.glam_mint.to_account_info(),
                    },
                    mint_signer_seeds,
                ))
            }
        })?;
    };

    Ok(())
}

#[derive(Accounts)]
#[instruction(mint_id: u8)]
pub struct ForceTransferTokens<'info> {
    #[account(mut)]
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        mut,
        seeds = [SEED_MINT.as_ref(), &[mint_id], glam_state.key().as_ref()],
        bump,
        mint::authority = glam_mint,
        mint::token_program = token_2022_program
    )]
    pub glam_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = glam_mint,
        associated_token::authority = from,
        associated_token::token_program = token_2022_program
    )]
    pub from_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = glam_mint,
        associated_token::authority = to,
        associated_token::token_program = token_2022_program
    )]
    pub to_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: any address owned by system program
    pub from: SystemAccount<'info>,

    /// CHECK: any address owned by system program, or the system program
    pub to: AccountInfo<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_2022_program: Program<'info, Token2022>,
}

#[access_control(acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.signer.key, Permission::ForceTransferTokens))]
#[access_control(acl::check_state_type(&ctx.accounts.glam_state, AccountType::Mint))]
#[mint_signer_seeds]
pub fn force_transfer_tokens_handler(
    ctx: Context<ForceTransferTokens>,
    mint_id: u8,
    amount: u64,
) -> Result<()> {
    let decimals = ctx.accounts.glam_mint.decimals;

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
                mint: ctx.accounts.glam_mint.to_account_info(),
                to: ctx.accounts.to_ata.to_account_info(),
                authority: ctx.accounts.glam_mint.to_account_info(), // permenant delegate
            },
            mint_signer_seeds,
        ),
        amount,
        decimals,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(mint_id: u8)]
pub struct BurnTokens<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(
        mut,
        seeds = [SEED_MINT.as_ref(), &[mint_id], glam_state.key().as_ref()],
        bump,
        mint::authority = glam_mint,
        mint::token_program = token_2022_program
    )]
    pub glam_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = glam_mint,
        associated_token::authority = from,
        associated_token::token_program = token_2022_program
    )]
    pub from_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: any address owned by system program
    pub from: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_2022_program: Program<'info, Token2022>,
}

#[access_control(acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.signer.key, Permission::BurnTokens))]
#[access_control(acl::check_state_type(&ctx.accounts.glam_state, AccountType::Mint))]
#[mint_signer_seeds]
pub fn burn_tokens_handler(ctx: Context<BurnTokens>, mint_id: u8, amount: u64) -> Result<()> {
    #[cfg(not(feature = "mainnet"))]
    msg!(
        "Burn {} shares from {} (ata {})",
        amount as f64 / 10u64.pow(ctx.accounts.glam_mint.decimals as u32) as f64,
        ctx.accounts.from.key(),
        ctx.accounts.from_ata.key(),
    );
    burn(
        CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.to_account_info(),
            Burn {
                mint: ctx.accounts.glam_mint.to_account_info(),
                from: ctx.accounts.from_ata.to_account_info(),
                authority: ctx.accounts.glam_mint.to_account_info(),
            },
            mint_signer_seeds,
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(mint_id: u8)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(
        mut,
        seeds = [SEED_MINT.as_ref(), &[mint_id], glam_state.key().as_ref()],
        bump,
        mint::authority = glam_mint,
        mint::token_program = token_2022_program
    )]
    glam_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = glam_mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_2022_program
    )]
    pub mint_to: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: any address owned by system program
    pub recipient: SystemAccount<'info>,

    pub token_2022_program: Program<'info, Token2022>,
}

#[access_control(acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.signer.key, Permission::MintTokens))]
#[access_control(acl::check_state_type(&ctx.accounts.glam_state, AccountType::Mint))]
#[mint_signer_seeds]
pub fn mint_tokens_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, MintTokens<'info>>,
    mint_id: u8,
    amount: u64,
) -> Result<()> {
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.glam_mint.to_account_info(),
                to: ctx.accounts.mint_to.to_account_info(),
                authority: ctx.accounts.glam_mint.to_account_info(),
            },
            mint_signer_seeds,
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(mint_id: u8)]
pub struct UpdateMint<'info> {
    #[account(mut, constraint = glam_state.owner == signer.key() @ GlamError::NotAuthorized)]
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(
        mut,
        seeds = [SEED_MINT.as_ref(), &[mint_id], glam_state.key().as_ref()],
        bump,
        mint::authority = glam_mint,
        mint::token_program = token_2022_program
    )]
    glam_mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_2022_program: Program<'info, Token2022>,
}

pub fn update_mint_handler(
    ctx: Context<UpdateMint>,
    mint_id: u8,
    mint_model: MintModel,
) -> Result<()> {
    let state = &mut ctx.accounts.glam_state;
    if let Some(mint_allowlist) = mint_model.allowlist {
        let allowlist = state.mint_allowlist_mut(mint_id as usize);
        if let Some(_allowlist) = allowlist {
            _allowlist.clear();
            _allowlist.extend(mint_allowlist.clone());
        }
    }
    if let Some(mint_blocklist) = mint_model.blocklist {
        let blocklist = state.mint_blocklist_mut(mint_id as usize);
        if let Some(_blocklist) = blocklist {
            _blocklist.clear();
            _blocklist.extend(mint_blocklist.clone());
        }
    }
    Ok(())
}

#[derive(Accounts)]
#[instruction(mint_id: u8)]
pub struct CloseMint<'info> {
    #[account(mut, constraint = glam_state.owner == signer.key() @ GlamError::NotAuthorized)]
    pub glam_state: Account<'info, StateAccount>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [
          SEED_MINT.as_ref(),
          &[mint_id],
          glam_state.key().as_ref()
        ],
        bump,
        mint::authority = glam_mint,
        mint::token_program = token_2022_program
      )]
    pub glam_mint: InterfaceAccount<'info, Mint>,

    /// CHECK: Token2022 Transfer Hook, we manually close it
    #[account(
        mut,
        seeds = [b"extra-account-metas", glam_mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    /// CHECK: Metadata
    #[account(mut, seeds = [SEED_METADATA.as_bytes(), glam_state.key().as_ref()], bump)]
    pub metadata: AccountInfo<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_2022_program: Program<'info, Token2022>,
}

#[mint_signer_seeds]
pub fn close_mint_handler(ctx: Context<CloseMint>, mint_id: u8) -> Result<()> {
    require!(
        (mint_id as usize) < ctx.accounts.glam_state.mints.len(),
        GlamError::NoShareClass
    );

    // Note: this is redundant because close_account should check that supply == 0
    //       but better safe than sorry
    require!(
        ctx.accounts.glam_mint.supply == 0,
        GlamError::ShareClassNotEmpty
    );

    close_token_2022_account(CpiContext::new_with_signer(
        ctx.accounts.token_2022_program.to_account_info(),
        CloseToken2022Account {
            account: ctx.accounts.glam_mint.to_account_info(),
            destination: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.glam_mint.to_account_info(),
        },
        mint_signer_seeds,
    ))?;

    ctx.accounts.glam_state.mints.remove(mint_id as usize);

    if let Some(metadata) = ctx.accounts.glam_state.metadata.clone() {
        if metadata.template == MetadataTemplate::Openfunds {
            let mut data_slice = ctx.accounts.metadata.data.borrow_mut(); // Borrow the mutable data
            let data: &mut [u8] = &mut *data_slice; // Dereference and convert to `&mut [u8]`
            let mut openfunds = OpenfundsMetadataAccount::try_deserialize(&mut &data[..])?;
            openfunds.share_classes.remove(mint_id as usize);
        }
    }

    close_account_info(
        ctx.accounts.extra_account_meta_list.to_account_info(),
        ctx.accounts.vault.to_account_info(),
    )?;

    msg!("Mint closed: {}", ctx.accounts.glam_mint.key());
    Ok(())
}
