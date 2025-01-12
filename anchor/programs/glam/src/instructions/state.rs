use crate::{
    constants::*,
    error::{AccessError, StateError},
    state::*,
};
use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    token::{close_account as close_token_account, CloseAccount as CloseTokenAccount, Token},
    token_2022::{
        close_account as close_token_2022_account, CloseAccount as CloseToken2022Account, Token2022,
    },
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};
use glam_macros::vault_signer_seeds;

#[derive(Accounts)]
#[instruction(state_model: StateModel)]
pub struct InitializeState<'info> {
    #[account(
        init,
        seeds = [
            SEED_STATE.as_bytes(),
            signer.key().as_ref(),
            state_model.created.as_ref().unwrap().key.as_ref()
        ],
        bump,
        payer = signer,
        space = 8 + StateAccount::INIT_SIZE
    )]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(init, seeds = [SEED_METADATA.as_bytes(), state.key().as_ref()], bump, payer = signer, space = MetadataAccount::INIT_SIZE)]
    pub metadata: Box<Account<'info, MetadataAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_state_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, InitializeState<'info>>,
    state_model: StateModel,
) -> Result<()> {
    //
    // Initialize state account
    //
    let state = &mut ctx.accounts.state;
    let model = state_model.clone();
    if let Some(name) = model.name {
        require!(name.len() < MAX_SIZE_NAME, StateError::InvalidName);
        state.name = name;
    }
    if let Some(fund_uri) = model.uri {
        require!(fund_uri.len() < MAX_SIZE_URI, StateError::InvalidUri);
        state.uri = fund_uri;
    }
    if let Some(metadata_uri) = model.metadata_uri {
        require!(metadata_uri.len() < MAX_SIZE_URI, StateError::InvalidUri);
        state.metadata_uri = metadata_uri;
    }

    state.vault = ctx.accounts.vault.key();
    state.metadata = ctx.accounts.metadata.key();
    state.owner = ctx.accounts.signer.key();

    //
    // Set state params
    //
    // state.params[0][0]: assets allowlists
    // state.params[0][1]: integration acls
    //
    state.params = vec![vec![
        EngineField {
            name: EngineFieldName::Assets,
            value: EngineFieldValue::VecPubkey { val: model.assets },
        },
        EngineField {
            name: EngineFieldName::IntegrationAcls,
            value: EngineFieldValue::VecIntegrationAcl {
                val: model.integration_acls,
            },
        },
    ]];

    //
    // Initialize metadata account
    //
    let metadata = &mut ctx.accounts.metadata;
    let openfunds_metadata = MetadataAccount::from(state_model);
    metadata.state_pubkey = state.key();
    metadata.company = openfunds_metadata.company;
    metadata.fund = openfunds_metadata.fund;
    metadata.share_classes = openfunds_metadata.share_classes;
    metadata.fund_managers = openfunds_metadata.fund_managers;

    msg!("State account created: {}", ctx.accounts.state.key());
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateState<'info> {
    #[account(mut, constraint = state.owner == signer.key() @ AccessError::NotAuthorized)]
    pub state: Account<'info, StateAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

pub fn update_state_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, UpdateState<'info>>,
    state_model: StateModel,
) -> Result<()> {
    let state = &mut ctx.accounts.state;

    if let Some(name) = state_model.name {
        require!(
            name.as_bytes().len() <= MAX_SIZE_NAME,
            StateError::InvalidName
        );
        state.name = name;
    }
    if let Some(uri) = state_model.uri {
        require!(
            uri.as_bytes().len() <= MAX_SIZE_URI,
            StateError::InvalidName
        );
        state.uri = uri;
    }

    if let Some(manager_model) = state_model.owner {
        if let Some(manager) = manager_model.pubkey {
            state.owner = manager
        }
    }

    if !state_model.assets.is_empty() {
        let assets = state.assets_mut().unwrap();
        assets.clear();
        assets.extend(state_model.assets.clone());
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
    if !state_model.delegate_acls.is_empty() {
        // Add the acls field if it doesn't exist
        let delegate_acls_field_exists = state.params[0]
            .iter()
            .any(|field| field.name == EngineFieldName::DelegateAcls);

        if !delegate_acls_field_exists {
            msg!("Adding acls field to state params");
            state.params[0].push(EngineField {
                name: EngineFieldName::DelegateAcls,
                value: EngineFieldValue::VecDelegateAcl { val: Vec::new() },
            });
        }

        let to_delete: Vec<Pubkey> = state_model
            .delegate_acls
            .clone()
            .iter()
            .filter(|acl| acl.permissions.is_empty())
            .map(|acl| acl.pubkey)
            .collect();
        if !to_delete.is_empty() {
            for EngineField { name, value } in &mut state.params[0] {
                if let (EngineFieldName::DelegateAcls, EngineFieldValue::VecDelegateAcl { val }) =
                    (name, value)
                {
                    val.retain(|acl| !to_delete.contains(&acl.pubkey));
                }
            }
        }
        let to_upsert = state_model
            .delegate_acls
            .clone()
            .into_iter()
            .filter(|acl| !acl.permissions.is_empty());

        for new_acl in to_upsert {
            for EngineField { name, value } in &mut state.params[0] {
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

    // Update integration acls for the state
    if !state_model.integration_acls.is_empty() {
        // Check if the integrations field exists
        // Add the integrations field if it doesn't exist
        let integration_acl_field_exists = state.params[0]
            .iter()
            .any(|field| field.name == EngineFieldName::IntegrationAcls);

        if !integration_acl_field_exists {
            msg!("Adding integrations field to state params");
            state.params[0].push(EngineField {
                name: EngineFieldName::IntegrationAcls,
                value: EngineFieldValue::VecIntegrationAcl { val: Vec::new() },
            });
        }

        for EngineField { name, value } in &mut state.params[0] {
            if let (EngineFieldName::IntegrationAcls, EngineFieldValue::VecIntegrationAcl { val }) =
                (name, value)
            {
                val.clear();
                val.extend(state_model.integration_acls.clone());
            }
        }
    }

    if !state_model.drift_market_indexes_perp.is_empty() {
        let mut found = false;
        for EngineField { name, value } in &mut state.params[0] {
            if let (EngineFieldName::DriftMarketIndexesPerp, EngineFieldValue::VecU32 { val }) =
                (name, value)
            {
                val.clear();
                val.extend(state_model.drift_market_indexes_perp.clone());
                found = true;
            }
        }
        if !found {
            state.params[0].push(EngineField {
                name: EngineFieldName::DriftMarketIndexesPerp,
                value: EngineFieldValue::VecU32 {
                    val: state_model.drift_market_indexes_perp,
                },
            });
        }
    }

    if !state_model.drift_market_indexes_spot.is_empty() {
        let mut found = false;
        for EngineField { name, value } in &mut state.params[0] {
            if let (EngineFieldName::DriftMarketIndexesSpot, EngineFieldValue::VecU32 { val }) =
                (name, value)
            {
                val.clear();
                val.extend(state_model.drift_market_indexes_spot.clone());
                found = true;
            }
        }
        if !found {
            state.params[0].push(EngineField {
                name: EngineFieldName::DriftMarketIndexesSpot,
                value: EngineFieldValue::VecU32 {
                    val: state_model.drift_market_indexes_spot,
                },
            });
        }
    }

    if !state_model.drift_order_types.is_empty() {
        let mut found = false;
        for EngineField { name, value } in &mut state.params[0] {
            if let (EngineFieldName::DriftOrderTypes, EngineFieldValue::VecU32 { val }) =
                (name, value)
            {
                val.clear();
                val.extend(state_model.drift_order_types.clone());
                found = true;
            }
        }
        if !found {
            state.params[0].push(EngineField {
                name: EngineFieldName::DriftOrderTypes,
                value: EngineFieldValue::VecU32 {
                    val: state_model.drift_order_types,
                },
            });
        }
    }

    Ok(())
}

#[derive(Accounts)]
pub struct CloseState<'info> {
    #[account(mut, close = signer, constraint = state.owner == signer.key() @ AccessError::NotAuthorized)]
    pub state: Account<'info, StateAccount>,

    #[account(mut, close = signer)]
    pub metadata: Account<'info, MetadataAccount>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[vault_signer_seeds]
pub fn close_state_handler(ctx: Context<CloseState>) -> Result<()> {
    require!(
        ctx.accounts.state.mints.len() == 0,
        StateError::ShareClassesNotClosed
    );

    if ctx.accounts.vault.lamports() > 0 {
        solana_program::program::invoke_signed(
            &solana_program::system_instruction::transfer(
                ctx.accounts.vault.key,
                ctx.accounts.signer.key,
                ctx.accounts.vault.lamports(),
            ),
            &[
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.signer.to_account_info(),
            ],
            vault_signer_seeds,
        )?;
    }

    msg!("State account closed: {}", ctx.accounts.state.key());
    Ok(())
}

#[derive(Accounts)]
pub struct SetSubscribeRedeemEnabled<'info> {
    #[account(mut, constraint = state.owner == signer.key() @ AccessError::NotAuthorized)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

pub fn set_subscribe_redeem_enabled_handler(
    ctx: Context<SetSubscribeRedeemEnabled>,
    enabled: bool,
) -> Result<()> {
    let state = &mut ctx.accounts.state;

    if enabled {
        state.delete_from_engine_field(EngineFieldName::ExternalVaultAccounts, system_program::ID);
    } else {
        let external_accounts =
            state.get_pubkeys_from_engine_field(EngineFieldName::ExternalVaultAccounts);

        if !external_accounts.contains(&system_program::ID) {
            state.add_to_engine_field(EngineFieldName::ExternalVaultAccounts, system_program::ID);
        }
    }

    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, constraint = state.owner == signer.key() @ AccessError::NotAuthorized)]
    pub state: Account<'info, StateAccount>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    pub asset: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = asset,
        associated_token::authority = vault,
        associated_token::token_program = token_program
    )]
    pub vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = asset,
        associated_token::authority = signer,
        associated_token::token_program = token_program
    )]
    pub signer_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}

#[vault_signer_seeds]
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    //TODO: atm we allow transfers only from vaults (to their owner),
    //      i.e. funds with no share classes.
    //      We may want to enable transfers for funds with external assets.
    require!(
        ctx.accounts.state.mints.len() == 0,
        StateError::WithdrawDenied
    );

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault_ata.to_account_info(),
                mint: ctx.accounts.asset.to_account_info(),
                to: ctx.accounts.signer_ata.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            vault_signer_seeds,
        ),
        amount,
        ctx.accounts.asset.decimals,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct CloseTokenAccounts<'info> {
    #[account(mut, constraint = state.owner == signer.key() @ AccessError::NotAuthorized)]
    pub state: Account<'info, StateAccount>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
}

#[vault_signer_seeds]
pub fn close_token_accounts_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, CloseTokenAccounts<'info>>,
) -> Result<()> {
    ctx.remaining_accounts.iter().try_for_each(|account| {
        if account.owner.eq(&ctx.accounts.token_program.key()) {
            close_token_account(CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseTokenAccount {
                    account: account.to_account_info(),
                    destination: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                vault_signer_seeds,
            ))
        } else {
            close_token_2022_account(CpiContext::new_with_signer(
                ctx.accounts.token_2022_program.to_account_info(),
                CloseToken2022Account {
                    account: account.to_account_info(),
                    destination: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                vault_signer_seeds,
            ))
        }
    })?;
    Ok(())
}
