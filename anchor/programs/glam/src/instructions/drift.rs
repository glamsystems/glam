use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token_interface::TokenAccount;
use drift::{MarketType, PositionDirection};
use glam_macros::{glam_vault_signer_seeds, vault_signer_seeds};

use crate::error::GlamError;
use crate::{constants::*, state::*};

use drift::cpi::accounts::{
    CancelOrders, DeleteUser, Deposit, InitializeUser, InitializeUserStats, PlaceOrders,
    UpdateUserCustomMarginRatio, UpdateUserDelegate, UpdateUserMarginTradingEnabled, Withdraw,
};
use drift::cpi::{
    cancel_orders, delete_user, deposit, initialize_user, initialize_user_stats, place_orders,
    update_user_custom_margin_ratio, update_user_delegate, update_user_margin_trading_enabled,
    withdraw,
};
use drift::program::Drift;
pub use drift::OrderParams;

#[derive(Accounts)]
pub struct DriftInitialize<'info> {
    #[account()]
    pub state: Account<'info, StateAccount>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user_stats: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub drift_state: UncheckedAccount<'info>,

    #[account(seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[access_control(acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::DriftInitialize))]
#[access_control(acl::check_integration(&ctx.accounts.state, Integration::Drift))]
#[vault_signer_seeds]
pub fn initialize_handler(ctx: Context<DriftInitialize>) -> Result<()> {
    initialize_user_stats(CpiContext::new_with_signer(
        ctx.accounts.drift_program.to_account_info(),
        InitializeUserStats {
            user_stats: ctx.accounts.user_stats.to_account_info(),
            state: ctx.accounts.drift_state.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
            payer: ctx.accounts.signer.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        },
        vault_signer_seeds,
    ))?;

    initialize_user(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            InitializeUser {
                user: ctx.accounts.user.to_account_info(),
                user_stats: ctx.accounts.user_stats.to_account_info(),
                state: ctx.accounts.drift_state.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
                payer: ctx.accounts.signer.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            vault_signer_seeds,
        ),
        0,
        DEFAULT_DRIFT_USER_NAME,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftUpdate<'info> {
    #[account()]
    pub state: Account<'info, StateAccount>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,

    #[account(seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
}

#[access_control(acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::DriftUpdateUser))]
#[access_control(acl::check_integration(&ctx.accounts.state, Integration::Drift))]
#[vault_signer_seeds]
pub fn update_user_custom_margin_ratio_handler(
    ctx: Context<DriftUpdate>,
    sub_account_id: u16,
    margin_ratio: u32,
) -> Result<()> {
    update_user_custom_margin_ratio(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            UpdateUserCustomMarginRatio {
                user: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            vault_signer_seeds,
        ),
        sub_account_id,
        margin_ratio,
    )?;

    Ok(())
}

#[access_control(acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::DriftUpdateUser))]
#[access_control(acl::check_integration(&ctx.accounts.state, Integration::Drift))]
#[vault_signer_seeds]
pub fn update_user_margin_trading_enabled_handler(
    ctx: Context<DriftUpdate>,
    sub_account_id: u16,
    margin_trading_enabled: bool,
) -> Result<()> {
    update_user_margin_trading_enabled(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            UpdateUserMarginTradingEnabled {
                user: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            vault_signer_seeds,
        ),
        sub_account_id,
        margin_trading_enabled,
    )?;

    Ok(())
}

#[access_control(acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::DriftUpdateUser))]
#[access_control(acl::check_integration(&ctx.accounts.state, Integration::Drift))]
#[vault_signer_seeds]
pub fn update_user_delegate_handler(
    ctx: Context<DriftUpdate>,
    sub_account_id: u16,
    delegate: Pubkey,
) -> Result<()> {
    update_user_delegate(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            UpdateUserDelegate {
                user: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            vault_signer_seeds,
        ),
        sub_account_id,
        delegate,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftDeposit<'info> {
    #[account()]
    pub state: Account<'info, StateAccount>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user_stats: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub drift_state: UncheckedAccount<'info>,

    #[account(seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub drift_ata: Box<InterfaceAccount<'info, TokenAccount>>, // spot market vault
    #[account(mut)]
    pub vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub token_program: Program<'info, Token>,
}

#[access_control(acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::DriftDeposit))]
#[access_control(acl::check_integration(&ctx.accounts.state, Integration::Drift))]
#[vault_signer_seeds]
pub fn deposit_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftDeposit<'info>>,
    market_index: u16,
    amount: u64,
) -> Result<()> {
    deposit(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            Deposit {
                user: ctx.accounts.user.to_account_info(),
                user_stats: ctx.accounts.user_stats.to_account_info(),
                state: ctx.accounts.drift_state.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
                spot_market_vault: ctx.accounts.drift_ata.to_account_info(),
                user_token_account: ctx.accounts.vault_ata.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            vault_signer_seeds,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        market_index,
        amount,
        false,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftWithdraw<'info> {
    #[account()]
    pub state: Account<'info, StateAccount>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user_stats: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub drift_state: UncheckedAccount<'info>,
    /// CHECK: checks are done inside cpi call
    pub drift_signer: UncheckedAccount<'info>,

    #[account(seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub drift_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub token_program: Program<'info, Token>,
}

#[access_control(acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::DriftWithdraw))]
#[access_control(acl::check_integration(&ctx.accounts.state, Integration::Drift))]
#[vault_signer_seeds]
pub fn withdraw_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftWithdraw<'info>>,
    market_index: u16,
    amount: u64,
) -> Result<()> {
    withdraw(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            Withdraw {
                user: ctx.accounts.user.to_account_info(),
                user_stats: ctx.accounts.user_stats.to_account_info(),
                state: ctx.accounts.drift_state.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
                spot_market_vault: ctx.accounts.drift_ata.to_account_info(),
                user_token_account: ctx.accounts.vault_ata.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                drift_signer: ctx.accounts.drift_signer.to_account_info(),
            },
            vault_signer_seeds,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        market_index,
        amount,
        false,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftDeleteUser<'info> {
    pub state: Account<'info, StateAccount>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user_stats: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub drift_state: UncheckedAccount<'info>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub system_program: Program<'info, System>,
}

#[access_control(acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::DriftDeleteUser))]
#[access_control(acl::check_integration(&ctx.accounts.state, Integration::Drift))]
#[vault_signer_seeds]
pub fn delete_user_handler(ctx: Context<DriftDeleteUser>) -> Result<()> {
    delete_user(CpiContext::new_with_signer(
        ctx.accounts.drift_program.to_account_info(),
        DeleteUser {
            user: ctx.accounts.user.to_account_info(),
            user_stats: ctx.accounts.user_stats.to_account_info(),
            state: ctx.accounts.drift_state.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        vault_signer_seeds,
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftPlaceOrders<'info> {
    #[account()]
    pub state: Account<'info, StateAccount>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub drift_state: UncheckedAccount<'info>,

    #[account(seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
}

#[access_control(acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::DriftPlaceOrders))]
#[access_control(acl::check_integration(&ctx.accounts.state, Integration::Drift))]
#[vault_signer_seeds]
pub fn place_orders_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftPlaceOrders<'info>>,
    order_params: Vec<OrderParams>,
) -> Result<()> {
    let state = &ctx.accounts.state;
    for order in &order_params {
        let permission = match order.market_type {
            MarketType::Spot => Permission::DriftSpotMarket,
            MarketType::Perp => Permission::DriftPerpMarket,
        };
        acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, permission)?;

        match order.market_type {
            MarketType::Spot => {
                if let Some(drift_market_indexes_spot) = state.drift_market_indexes_spot() {
                    if drift_market_indexes_spot.len() > 0 {
                        require!(
                            drift_market_indexes_spot.contains(&(order.market_index as u32)),
                            GlamError::NotAuthorized
                        );
                    }
                }
            }
            MarketType::Perp => {
                if let Some(drift_market_indexes_perp) = state.drift_market_indexes_perp() {
                    if drift_market_indexes_perp.len() > 0 {
                        require!(
                            drift_market_indexes_perp.contains(&(order.market_index as u32)),
                            GlamError::NotAuthorized
                        );
                    }
                }
            }
        }
        if let Some(drift_order_types) = state.drift_order_types() {
            if drift_order_types.len() > 0 {
                require!(
                    drift_order_types.contains(&(order.order_type as u32)),
                    GlamError::NotAuthorized
                );
            }
        }
    }

    place_orders(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            PlaceOrders {
                user: ctx.accounts.user.to_account_info(),
                state: ctx.accounts.drift_state.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            vault_signer_seeds,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        order_params,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftCancelOrders<'info> {
    #[account()]
    pub glam_state: Account<'info, StateAccount>,

    #[account(seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

    pub cpi_program: Program<'info, Drift>,

    /// CHECK: should be validated by target program
    pub state: UncheckedAccount<'info>,

    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user: UncheckedAccount<'info>,
}

#[access_control(acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::DriftCancelOrders))]
#[access_control(acl::check_integration(&ctx.accounts.glam_state, Integration::Drift))]
#[glam_vault_signer_seeds]
pub fn cancel_orders_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftCancelOrders<'info>>,
    market_type: Option<MarketType>,
    market_index: Option<u16>,
    direction: Option<PositionDirection>,
) -> Result<()> {
    cancel_orders(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            CancelOrders {
                user: ctx.accounts.user.to_account_info(),
                state: ctx.accounts.state.to_account_info(),
                authority: ctx.accounts.glam_vault.to_account_info(),
            },
            glam_vault_signer_seeds,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        market_type,
        market_index,
        direction,
    )
}

#[access_control(acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::DriftCancelOrders))]
#[access_control(acl::check_integration(&ctx.accounts.glam_state, Integration::Drift))]
#[glam_vault_signer_seeds]
pub fn drift_cancel_orders_by_ids<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftCancelOrders<'info>>,
    order_ids: Vec<u32>,
) -> Result<()> {
    drift::cpi::cancel_orders_by_ids(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            drift::cpi::accounts::CancelOrdersByIds {
                state: ctx.accounts.state.to_account_info(),
                user: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.glam_vault.to_account_info(),
            },
            glam_vault_signer_seeds,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        order_ids,
    )
}
