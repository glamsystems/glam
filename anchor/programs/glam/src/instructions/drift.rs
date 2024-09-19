use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token_interface::TokenAccount;

use crate::error::ManagerError;
use crate::state::*;

use drift::cpi::accounts::{
    DeleteUser, Deposit, InitializeUser, InitializeUserStats, PlaceOrders,
    UpdateUserCustomMarginRatio, UpdateUserDelegate, UpdateUserMarginTradingEnabled, Withdraw,
};
use drift::cpi::{
    delete_user, deposit, initialize_user, initialize_user_stats, place_orders,
    update_user_custom_margin_ratio, update_user_delegate, update_user_margin_trading_enabled,
    withdraw,
};
use drift::program::Drift;
pub use drift::OrderParams;

#[derive(Accounts)]
pub struct DriftInitialize<'info> {
    #[account(
        has_one = manager @ ManagerError::NotAuthorizedError,
        has_one = treasury @ ManagerError::NotAuthorizedError
    )]
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
    manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

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
    #[account(
        has_one = manager @ ManagerError::NotAuthorizedError,
        has_one = treasury @ ManagerError::NotAuthorizedError,
    )]
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

pub fn drift_update_user_custom_margin_ratio_handler(
    ctx: Context<DriftUpdate>,
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
        0,
        margin_ratio,
    )?;

    Ok(())
}

pub fn drift_update_user_margin_trading_enabled_handler(
    ctx: Context<DriftUpdate>,
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
        0,
        margin_trading_enabled,
    )?;

    Ok(())
}

pub fn drift_update_user_delegate_handler(
    ctx: Context<DriftUpdate>,
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
        0,
        delegate,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftDeposit<'info> {
    #[account(
        has_one = manager @ ManagerError::NotAuthorizedError,
        has_one = treasury @ ManagerError::NotAuthorizedError
    )]
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
    pub drift_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub token_program: Program<'info, Token>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::DriftDeposit)
)]
pub fn drift_deposit_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftDeposit<'info>>,
    amount: u64,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    let market_index = 0u16;
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
    #[account(
        has_one = manager @ ManagerError::NotAuthorizedError,
        has_one = treasury @ ManagerError::NotAuthorizedError
    )]
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
    pub treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub drift_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: checks are done inside cpi call
    pub drift_signer: UncheckedAccount<'info>,

    #[account(mut)]
    manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub token_program: Program<'info, Token>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::DriftWithdraw)
)]
pub fn drift_withdraw_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftWithdraw<'info>>,
    amount: u64,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    let market_index = 0u16;
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
    #[account(
        has_one = manager @ ManagerError::NotAuthorizedError,
        has_one = treasury @ ManagerError::NotAuthorizedError
    )]
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
    manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub system_program: Program<'info, System>,
}

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
    #[account(
        has_one = manager @ ManagerError::NotAuthorizedError,
        has_one = treasury @ ManagerError::NotAuthorizedError
    )]
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
    pub treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub drift_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: checks are done inside cpi call
    pub drift_signer: UncheckedAccount<'info>,

    #[account(mut)]
    manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub token_program: Program<'info, Token>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::DriftPlaceOrders)
)]
pub fn drift_place_orders_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftPlaceOrders<'info>>,
    order_params: Vec<OrderParams>,
) -> Result<()> {
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
