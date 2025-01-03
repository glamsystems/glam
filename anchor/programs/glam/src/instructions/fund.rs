use crate::{
    constants::*,
    error::{AccessError, FundError, ManagerError},
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
#[instruction(fund_model: FundModel)]
pub struct InitializeFund<'info> {
    #[account(
        init,
        seeds = [
            b"fund".as_ref(),
            signer.key().as_ref(),
            fund_model.created.as_ref().unwrap().key.as_ref()
        ],
        bump,
        payer = signer,
        space = 8 + FundAccount::INIT_SIZE
    )]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(init, seeds = [b"openfunds".as_ref(), fund.key().as_ref()], bump, payer = signer, space = FundMetadataAccount::INIT_SIZE)]
    pub openfunds: Box<Account<'info, FundMetadataAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

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

    fund.treasury = ctx.accounts.vault.key();
    fund.openfunds = ctx.accounts.openfunds.key();
    fund.manager = ctx.accounts.signer.key();

    //
    // Set engine params
    //
    fund.params = vec![vec![
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
    // Initialize openfunds
    //
    let openfunds = &mut ctx.accounts.openfunds;
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
pub struct UpdateFund<'info> {
    #[account(mut, constraint = fund.manager == signer.key() @ AccessError::NotAuthorized)]
    pub fund: Account<'info, FundAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,
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

    if !fund_model.assets.is_empty() {
        let assets = fund.assets_mut().unwrap();
        assets.clear();
        assets.extend(fund_model.assets.clone());
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

    if !fund_model.drift_market_indexes_perp.is_empty() {
        let mut found = false;
        for EngineField { name, value } in &mut fund.params[0] {
            if let (EngineFieldName::DriftMarketIndexesPerp, EngineFieldValue::VecU32 { val }) =
                (name, value)
            {
                val.clear();
                val.extend(fund_model.drift_market_indexes_perp.clone());
                found = true;
            }
        }
        if !found {
            fund.params[0].push(EngineField {
                name: EngineFieldName::DriftMarketIndexesPerp,
                value: EngineFieldValue::VecU32 {
                    val: fund_model.drift_market_indexes_perp,
                },
            });
        }
    }

    if !fund_model.drift_market_indexes_spot.is_empty() {
        let mut found = false;
        for EngineField { name, value } in &mut fund.params[0] {
            if let (EngineFieldName::DriftMarketIndexesSpot, EngineFieldValue::VecU32 { val }) =
                (name, value)
            {
                val.clear();
                val.extend(fund_model.drift_market_indexes_spot.clone());
                found = true;
            }
        }
        if !found {
            fund.params[0].push(EngineField {
                name: EngineFieldName::DriftMarketIndexesSpot,
                value: EngineFieldValue::VecU32 {
                    val: fund_model.drift_market_indexes_spot,
                },
            });
        }
    }

    if !fund_model.drift_order_types.is_empty() {
        let mut found = false;
        for EngineField { name, value } in &mut fund.params[0] {
            if let (EngineFieldName::DriftOrderTypes, EngineFieldValue::VecU32 { val }) =
                (name, value)
            {
                val.clear();
                val.extend(fund_model.drift_order_types.clone());
                found = true;
            }
        }
        if !found {
            fund.params[0].push(EngineField {
                name: EngineFieldName::DriftOrderTypes,
                value: EngineFieldValue::VecU32 {
                    val: fund_model.drift_order_types,
                },
            });
        }
    }

    Ok(())
}

#[derive(Accounts)]
pub struct CloseFund<'info> {
    #[account(mut, close = signer, constraint = fund.manager == signer.key() @ AccessError::NotAuthorized)]
    pub fund: Account<'info, FundAccount>,

    #[account(mut, close = signer)]
    pub openfunds: Account<'info, FundMetadataAccount>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[vault_signer_seeds]
pub fn close_fund_handler(ctx: Context<CloseFund>) -> Result<()> {
    require!(
        ctx.accounts.fund.share_classes.len() == 0,
        FundError::CantCloseShareClasses
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

    msg!("Fund closed: {}", ctx.accounts.fund.key());
    Ok(())
}

#[derive(Accounts)]
pub struct SetSubscribeRedeemEnabled<'info> {
    #[account(mut, constraint = fund.manager == signer.key() @ AccessError::NotAuthorized)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

pub fn set_subscribe_redeem_enabled_handler(
    ctx: Context<SetSubscribeRedeemEnabled>,
    enabled: bool,
) -> Result<()> {
    let fund = &mut ctx.accounts.fund;

    if enabled {
        fund.delete_from_engine_field(
            EngineFieldName::ExternalTreasuryAccounts,
            system_program::ID,
        );
    } else {
        let external_treasury_accounts =
            fund.get_pubkeys_from_engine_field(EngineFieldName::ExternalTreasuryAccounts);

        if !external_treasury_accounts.contains(&system_program::ID) {
            fund.add_to_engine_field(
                EngineFieldName::ExternalTreasuryAccounts,
                system_program::ID,
            );
        }
    }

    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, constraint = fund.manager == signer.key() @ AccessError::NotAuthorized)]
    pub fund: Account<'info, FundAccount>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
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
    pub manager_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}

#[vault_signer_seeds]
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    //TODO: atm we allow transfers only from vaults (to their manager),
    //      i.e. funds with no share classes.
    //      We may want to enable transfers for funds with external assets.
    require!(
        ctx.accounts.fund.share_classes.len() == 0,
        FundError::WithdrawDenied
    );

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault_ata.to_account_info(),
                mint: ctx.accounts.asset.to_account_info(),
                to: ctx.accounts.manager_ata.to_account_info(),
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
    #[account(mut, constraint = fund.manager == signer.key() @ AccessError::NotAuthorized)]
    pub fund: Account<'info, FundAccount>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
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
