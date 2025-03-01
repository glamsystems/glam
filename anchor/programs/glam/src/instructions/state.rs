use std::collections::HashMap;

use crate::{constants::*, error::GlamError, state::*};
use anchor_lang::{prelude::*, solana_program, system_program};
use anchor_spl::{
    token::{close_account as close_token_account, CloseAccount as CloseTokenAccount, Token},
    token_2022::{
        close_account as close_token_2022_account, CloseAccount as CloseToken2022Account, Token2022,
    },
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

#[derive(Accounts)]
#[instruction(state_model: StateModel)]
pub struct InitializeState<'info> {
    #[account(
        init,
        seeds = [
            SEED_STATE.as_bytes(),
            glam_signer.key().as_ref(),
            state_model.created.as_ref().unwrap().key.as_ref()
        ],
        bump,
        payer = glam_signer,
        space = 8 + StateAccount::INIT_SIZE
    )]
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

    #[account(
        init,
        seeds = [SEED_METADATA.as_bytes(), glam_state.key().as_ref()],
        bump,
        payer = glam_signer,
        space = 8 + OpenfundsMetadataAccount::INIT_SIZE
    )]
    pub openfunds_metadata: Option<Box<Account<'info, OpenfundsMetadataAccount>>>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_state_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, InitializeState<'info>>,
    state_model: StateModel,
) -> Result<()> {
    //
    // Initialize state account
    //
    let state = &mut ctx.accounts.glam_state;
    let model = state_model.clone();

    state.account_type = model.account_type.ok_or(GlamError::InvalidAccountType)?;

    if let Some(name) = model.name {
        require!(name.len() <= MAX_SIZE_NAME, GlamError::InvalidName);
        state.name = name;
    }
    if let Some(uri) = model.uri {
        require!(uri.len() < MAX_SIZE_URI, GlamError::InvalidUri);
        state.uri = uri;
    }
    if let Some(created) = model.created {
        state.created = CreatedModel {
            key: created.key,
            created_by: ctx.accounts.glam_signer.key(),
            created_at: Clock::get()?.unix_timestamp,
        };
    }
    if let Some(metadata) = model.metadata {
        require!(metadata.uri.len() < MAX_SIZE_URI, GlamError::InvalidUri);
        state.metadata = Some(Metadata {
            template: metadata.template,
            pubkey: metadata.pubkey,
            uri: metadata.uri,
        });

        if metadata.template == MetadataTemplate::Openfunds {
            if let Some(openfunds_metadata) = &mut ctx.accounts.openfunds_metadata {
                openfunds_metadata.set_inner(OpenfundsMetadataAccount::from(state_model));
                openfunds_metadata.fund_id = state.key();

                // Update metadata pubkey
                state.metadata.as_mut().unwrap().pubkey = openfunds_metadata.key();
            }
        }
    }

    state.vault = ctx.accounts.glam_vault.key();
    state.owner = ctx.accounts.glam_signer.key();
    state.enabled = model.enabled.unwrap_or(true);
    state.assets = model.assets.unwrap_or_default();
    state.integrations = model.integrations.unwrap_or_default();
    state.delegate_acls = model.delegate_acls.unwrap_or_default();
    state.params = vec![vec![]];

    msg!("State account created: {}", ctx.accounts.glam_state.key());
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateState<'info> {
    #[account(mut, constraint = glam_state.owner == glam_signer.key() @ GlamError::NotAuthorized)]
    pub glam_state: Account<'info, StateAccount>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,
}

pub fn update_state_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, UpdateState<'info>>,
    state_model: StateModel,
) -> Result<()> {
    let state = &mut ctx.accounts.glam_state;

    if let Some(name) = state_model.name {
        require!(
            name.as_bytes().len() <= MAX_SIZE_NAME,
            GlamError::InvalidName
        );
        state.name = name;
    }
    if let Some(uri) = state_model.uri {
        require!(uri.as_bytes().len() <= MAX_SIZE_URI, GlamError::InvalidUri);
        state.uri = uri;
    }

    if let Some(manager_model) = state_model.owner {
        if let Some(manager) = manager_model.pubkey {
            state.owner = manager
        }
    }

    if let Some(assets) = state_model.assets {
        state.assets = assets;
    }

    if let Some(integrations) = state_model.integrations {
        state.integrations = integrations;
    }

    // Update or add delegate acls
    // If permissions is empty, delete the entry
    if let Some(delegate_acls) = state_model.delegate_acls {
        let mut existing_pubkeys: HashMap<_, _> = state
            .delegate_acls
            .iter()
            .map(|da| (da.pubkey, da.clone()))
            .collect();

        for da in delegate_acls {
            existing_pubkeys.insert(da.pubkey, da.clone());
        }

        state.delegate_acls = existing_pubkeys
            .into_values()
            .filter(|da| !da.permissions.is_empty())
            .collect();
    }

    if let Some(market_indexes_perp) = state_model.drift_market_indexes_perp {
        if let Some(EngineField { value, .. }) = state.params[0]
            .iter_mut()
            .find(|f| f.name == EngineFieldName::DriftMarketIndexesPerp)
        {
            if let EngineFieldValue::VecU32 { val } = value {
                *val = market_indexes_perp;
            }
        } else {
            state.params[0].push(EngineField {
                name: EngineFieldName::DriftMarketIndexesPerp,
                value: EngineFieldValue::VecU32 {
                    val: market_indexes_perp.clone(),
                },
            });
        };
    }

    if let Some(market_indexes_spot) = state_model.drift_market_indexes_spot {
        if let Some(EngineField { value, .. }) = state.params[0]
            .iter_mut()
            .find(|f| f.name == EngineFieldName::DriftMarketIndexesSpot)
        {
            if let EngineFieldValue::VecU32 { val } = value {
                *val = market_indexes_spot;
            }
        } else {
            state.params[0].push(EngineField {
                name: EngineFieldName::DriftMarketIndexesSpot,
                value: EngineFieldValue::VecU32 {
                    val: market_indexes_spot.clone(),
                },
            });
        };
    }

    if let Some(drift_order_types) = state_model.drift_order_types {
        let idx = state.params[0]
            .iter()
            .position(|f| f.name == EngineFieldName::DriftOrderTypes)
            .unwrap_or_else(|| {
                state.params[0].push(EngineField {
                    name: EngineFieldName::DriftOrderTypes,
                    value: EngineFieldValue::VecU32 { val: Vec::new() },
                });
                state.params[0].len() - 1
            });
        if let EngineFieldValue::VecU32 { val } = &mut state.params[0][idx].value {
            *val = drift_order_types;
        }
    }

    Ok(())
}

#[derive(Accounts)]
pub struct CloseState<'info> {
    #[account(mut, close = glam_signer, constraint = glam_state.owner == glam_signer.key() @ GlamError::NotAuthorized)]
    pub glam_state: Account<'info, StateAccount>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

    /// CHECK: Manually deserialized
    #[account(mut, seeds = [SEED_METADATA.as_bytes(), glam_state.key().as_ref()], bump)]
    pub metadata: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[glam_macros::glam_vault_signer_seeds]
pub fn close_state_handler(ctx: Context<CloseState>) -> Result<()> {
    require!(
        ctx.accounts.glam_state.mints.len() == 0,
        GlamError::ShareClassesNotClosed
    );

    if ctx.accounts.glam_vault.lamports() > 0 {
        solana_program::program::invoke_signed(
            &solana_program::system_instruction::transfer(
                ctx.accounts.glam_vault.key,
                ctx.accounts.glam_signer.key,
                ctx.accounts.glam_vault.lamports(),
            ),
            &[
                ctx.accounts.glam_vault.to_account_info(),
                ctx.accounts.glam_signer.to_account_info(),
            ],
            glam_vault_signer_seeds,
        )?;
    }

    close_account_info(
        ctx.accounts.metadata.to_account_info(),
        ctx.accounts.glam_signer.to_account_info(),
    )?;

    msg!("State account closed: {}", ctx.accounts.glam_state.key());
    Ok(())
}

#[derive(Accounts)]
pub struct SetSubscribeRedeemEnabled<'info> {
    #[account(mut, constraint = glam_state.owner == glam_signer.key() @ GlamError::NotAuthorized)]
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,
}

pub fn set_subscribe_redeem_enabled_handler(
    ctx: Context<SetSubscribeRedeemEnabled>,
    enabled: bool,
) -> Result<()> {
    let state = &mut ctx.accounts.glam_state;

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
    #[account(mut, constraint = glam_state.owner == glam_signer.key() @ GlamError::NotAuthorized)]
    pub glam_state: Account<'info, StateAccount>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

    pub asset: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = asset,
        associated_token::authority = glam_vault,
        associated_token::token_program = token_program
    )]
    pub vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = asset,
        associated_token::authority = glam_signer,
        associated_token::token_program = token_program
    )]
    pub signer_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
}

#[glam_macros::glam_vault_signer_seeds]
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    //TODO: atm we allow transfers only from vaults (to their owner),
    //      i.e. funds with no share classes.
    //      We may want to enable transfers for funds with external assets.
    require!(
        ctx.accounts.glam_state.mints.len() == 0,
        GlamError::WithdrawDenied
    );

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault_ata.to_account_info(),
                mint: ctx.accounts.asset.to_account_info(),
                to: ctx.accounts.signer_ata.to_account_info(),
                authority: ctx.accounts.glam_vault.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        amount,
        ctx.accounts.asset.decimals,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct CloseTokenAccounts<'info> {
    #[account(mut, constraint = glam_state.owner == glam_signer.key() @ GlamError::NotAuthorized)]
    pub glam_state: Account<'info, StateAccount>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
}

#[glam_macros::glam_vault_signer_seeds]
pub fn close_token_accounts_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, CloseTokenAccounts<'info>>,
) -> Result<()> {
    ctx.remaining_accounts.iter().try_for_each(|account| {
        if account.owner.eq(&ctx.accounts.token_program.key()) {
            close_token_account(CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseTokenAccount {
                    account: account.to_account_info(),
                    destination: ctx.accounts.glam_vault.to_account_info(),
                    authority: ctx.accounts.glam_vault.to_account_info(),
                },
                glam_vault_signer_seeds,
            ))
        } else {
            close_token_2022_account(CpiContext::new_with_signer(
                ctx.accounts.token_2022_program.to_account_info(),
                CloseToken2022Account {
                    account: account.to_account_info(),
                    destination: ctx.accounts.glam_vault.to_account_info(),
                    authority: ctx.accounts.glam_vault.to_account_info(),
                },
                glam_vault_signer_seeds,
            ))
        }
    })?;
    Ok(())
}
