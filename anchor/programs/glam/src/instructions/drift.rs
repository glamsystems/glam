use anchor_lang::prelude::*;

use crate::error::ManagerError;
use crate::state::fund::*;

use drift::program::Drift;
use drift::cpi::{
    initialize_user_stats,
    initialize_user,
    update_user_delegate,
    deposit,
    deposit_into_spot_market_revenue_pool,
    withdraw,
    delete_user,
};
use drift::cpi::accounts::{
    InitializeUserStats,
    InitializeUser,
    UpdateUserDelegate,
    Deposit,
    DepositIntoSpotMarketRevenuePool,
    Withdraw,
    DeleteUser,
};
use drift::{
    UserStats,
    User,
    State,
};

#[derive(Accounts)]
pub struct DriftInitialize<'info> {
    pub fund: Account<'info, Fund>,
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user_stats: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    pub state: Box<Account<'info, State>>,

    #[account(mut)]
    manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

pub fn drift_initialize_handler(ctx: Context<DriftInitialize>) -> Result<()> {
    let treasury = &ctx.accounts.treasury;
    let seeds = &[
        "treasury".as_bytes(),
        treasury.fund.as_ref(),
        &[treasury.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    msg!("initialize_user_stats");
    initialize_user_stats(
        CpiContext::new_with_signer(
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
        ),
    )?;

    msg!("initialize_user");
    let mut name = [0u8; 32];
    let name_glam = b"Glam Trading";
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

    msg!("update_user_delegate");
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
        ctx.accounts.manager.key(),
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftDeposit<'info> {
    pub fund: Account<'info, Fund>,
    #[account(mut)]
    manager: Signer<'info>,
}

pub fn drift_deposit_handler(ctx: Context<DriftDeposit>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct DriftWithdraw<'info> {
    pub fund: Account<'info, Fund>,
    #[account(mut)]
    manager: Signer<'info>,
}

pub fn drift_withdraw_handler(ctx: Context<DriftWithdraw>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct DriftClose<'info> {
    pub fund: Account<'info, Fund>,
    #[account(mut)]
    manager: Signer<'info>,
}

pub fn drift_close_handler(ctx: Context<DriftClose>) -> Result<()> {
    Ok(())
}
