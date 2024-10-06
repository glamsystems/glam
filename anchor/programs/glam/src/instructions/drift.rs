use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token_interface::TokenAccount;
use drift::{MarketType, PositionDirection};

use crate::state::*;

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
    pub fund: Account<'info, FundAccount>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user_stats: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub state: UncheckedAccount<'info>,

    #[account(seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[access_control(acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::DriftInitialize))]
#[access_control(acl::check_integration(&ctx.accounts.fund, IntegrationName::Drift))]
pub fn drift_initialize_handler(ctx: Context<DriftInitialize>) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    initialize_user_stats(CpiContext::new_with_signer(
        ctx.accounts.drift_program.to_account_info(),
        InitializeUserStats {
            user_stats: ctx.accounts.user_stats.to_account_info(),
            state: ctx.accounts.state.to_account_info(),
            authority: ctx.accounts.treasury.to_account_info(),
            payer: ctx.accounts.manager.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        },
        signer_seeds,
    ))?;

    let mut name = [0u8; 32];
    let name_glam = b"GLAM *.+";
    name[..name_glam.len()].copy_from_slice(name_glam);
    initialize_user(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            InitializeUser {
                user: ctx.accounts.user.to_account_info(),
                user_stats: ctx.accounts.user_stats.to_account_info(),
                state: ctx.accounts.state.to_account_info(),
                authority: ctx.accounts.treasury.to_account_info(),
                payer: ctx.accounts.manager.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            signer_seeds,
        ),
        0,
        name,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftUpdate<'info> {
    #[account()]
    pub fund: Account<'info, FundAccount>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,

    #[account(seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(mut)]
    manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
}

#[access_control(acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::DriftUpdateUser))]
#[access_control(acl::check_integration(&ctx.accounts.fund, IntegrationName::Drift))]
pub fn drift_update_user_custom_margin_ratio_handler(
    ctx: Context<DriftUpdate>,
    sub_account_id: u16,
    margin_ratio: u32,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    update_user_custom_margin_ratio(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            UpdateUserCustomMarginRatio {
                user: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.treasury.to_account_info(),
            },
            signer_seeds,
        ),
        sub_account_id,
        margin_ratio,
    )?;

    Ok(())
}

#[access_control(acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::DriftUpdateUser))]
#[access_control(acl::check_integration(&ctx.accounts.fund, IntegrationName::Drift))]
pub fn drift_update_user_margin_trading_enabled_handler(
    ctx: Context<DriftUpdate>,
    sub_account_id: u16,
    margin_trading_enabled: bool,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    update_user_margin_trading_enabled(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            UpdateUserMarginTradingEnabled {
                user: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.treasury.to_account_info(),
            },
            signer_seeds,
        ),
        sub_account_id,
        margin_trading_enabled,
    )?;

    Ok(())
}

#[access_control(acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::DriftUpdateUser))]
#[access_control(acl::check_integration(&ctx.accounts.fund, IntegrationName::Drift))]
pub fn drift_update_user_delegate_handler(
    ctx: Context<DriftUpdate>,
    sub_account_id: u16,
    delegate: Pubkey,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    update_user_delegate(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            UpdateUserDelegate {
                user: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.treasury.to_account_info(),
            },
            signer_seeds,
        ),
        sub_account_id,
        delegate,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftDeposit<'info> {
    #[account()]
    pub fund: Account<'info, FundAccount>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user_stats: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub state: UncheckedAccount<'info>,

    #[account(seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(mut)]
    pub drift_ata: Box<InterfaceAccount<'info, TokenAccount>>, // spot market vault
    #[account(mut)]
    pub treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub token_program: Program<'info, Token>,
}

#[access_control(acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::DriftDeposit))]
#[access_control(acl::check_integration(&ctx.accounts.fund, IntegrationName::Drift))]
pub fn drift_deposit_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftDeposit<'info>>,
    market_index: u16,
    amount: u64,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    deposit(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            Deposit {
                user: ctx.accounts.user.to_account_info(),
                user_stats: ctx.accounts.user_stats.to_account_info(),
                state: ctx.accounts.state.to_account_info(),
                authority: ctx.accounts.treasury.to_account_info(),
                spot_market_vault: ctx.accounts.drift_ata.to_account_info(),
                user_token_account: ctx.accounts.treasury_ata.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            signer_seeds,
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
    pub fund: Account<'info, FundAccount>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user_stats: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub state: UncheckedAccount<'info>,
    /// CHECK: checks are done inside cpi call
    pub drift_signer: UncheckedAccount<'info>,

    #[account(seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(mut)]
    pub treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub drift_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub token_program: Program<'info, Token>,
}

#[access_control(acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::DriftWithdraw))]
#[access_control(acl::check_integration(&ctx.accounts.fund, IntegrationName::Drift))]
pub fn drift_withdraw_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftWithdraw<'info>>,
    market_index: u16,
    amount: u64,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    withdraw(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            Withdraw {
                user: ctx.accounts.user.to_account_info(),
                user_stats: ctx.accounts.user_stats.to_account_info(),
                state: ctx.accounts.state.to_account_info(),
                authority: ctx.accounts.treasury.to_account_info(),
                spot_market_vault: ctx.accounts.drift_ata.to_account_info(),
                user_token_account: ctx.accounts.treasury_ata.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                drift_signer: ctx.accounts.drift_signer.to_account_info(),
            },
            signer_seeds,
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
    #[account()]
    pub fund: Account<'info, FundAccount>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user_stats: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub state: UncheckedAccount<'info>,

    #[account(seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub system_program: Program<'info, System>,
}

#[access_control(acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::DriftDeleteUser))]
#[access_control(acl::check_integration(&ctx.accounts.fund, IntegrationName::Drift))]
pub fn drift_delete_user_handler(ctx: Context<DriftDeleteUser>) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    delete_user(CpiContext::new_with_signer(
        ctx.accounts.drift_program.to_account_info(),
        DeleteUser {
            user: ctx.accounts.user.to_account_info(),
            user_stats: ctx.accounts.user_stats.to_account_info(),
            state: ctx.accounts.state.to_account_info(),
            authority: ctx.accounts.treasury.to_account_info(),
        },
        signer_seeds,
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftPlaceOrders<'info> {
    #[account()]
    pub fund: Account<'info, FundAccount>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub state: UncheckedAccount<'info>,

    #[account(seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub token_program: Program<'info, Token>,
}

#[access_control(acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::DriftPlaceOrders))]
#[access_control(acl::check_integration(&ctx.accounts.fund, IntegrationName::Drift))]
pub fn drift_place_orders_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftPlaceOrders<'info>>,
    order_params: Vec<OrderParams>,
) -> Result<()> {
    let fund = &ctx.accounts.fund;
    for order in &order_params {
        let permission = match order.market_type {
            MarketType::Spot => Permission::DriftSpotMarket,
            MarketType::Perp => Permission::DriftPerpMarket,
        };
        acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, permission)?;

        match order.market_type {
            MarketType::Spot => {
                if let Some(drift_market_indexes_spot) = fund.drift_market_indexes_spot() {
                    if drift_market_indexes_spot.len() > 0 {
                        require!(
                            drift_market_indexes_spot.contains(&(order.market_index as u32)),
                            AccessError::NotAuthorized
                        );
                    }
                }
            }
            MarketType::Perp => {
                if let Some(drift_market_indexes_perp) = fund.drift_market_indexes_perp() {
                    if drift_market_indexes_perp.len() > 0 {
                        require!(
                            drift_market_indexes_perp.contains(&(order.market_index as u32)),
                            AccessError::NotAuthorized
                        );
                    }
                }
            }
        }
        if let Some(drift_order_types) = fund.drift_order_types() {
            if drift_order_types.len() > 0 {
                require!(
                    drift_order_types.contains(&(order.order_type as u32)),
                    AccessError::NotAuthorized
                );
            }
        }
    }

    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    place_orders(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            PlaceOrders {
                user: ctx.accounts.user.to_account_info(),
                state: ctx.accounts.state.to_account_info(),
                authority: ctx.accounts.treasury.to_account_info(),
            },
            signer_seeds,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        order_params,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftCancelOrders<'info> {
    #[account()]
    pub fund: Account<'info, FundAccount>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub state: UncheckedAccount<'info>,

    #[account(seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub token_program: Program<'info, Token>,
}

#[access_control(acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::DriftCancelOrders))]
#[access_control(acl::check_integration(&ctx.accounts.fund, IntegrationName::Drift))]
pub fn drift_cancel_orders_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftCancelOrders<'info>>,
    market_type: Option<MarketType>,
    market_index: Option<u16>,
    direction: Option<PositionDirection>,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    cancel_orders(
        CpiContext::new_with_signer(
            ctx.accounts.drift_program.to_account_info(),
            CancelOrders {
                user: ctx.accounts.user.to_account_info(),
                state: ctx.accounts.state.to_account_info(),
                authority: ctx.accounts.treasury.to_account_info(),
            },
            signer_seeds,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        market_type,
        market_index,
        direction,
    )?;

    Ok(())
}
