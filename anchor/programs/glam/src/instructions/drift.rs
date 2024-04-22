use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token};
use anchor_spl::token_interface::TokenAccount;

use crate::error::ManagerError;
use crate::state::fund::*;

use drift::cpi::accounts::{
    DeleteUser, Deposit, InitializeUser, InitializeUserStats, UpdateUserDelegate, Withdraw,
};
use drift::cpi::{
    delete_user, deposit, initialize_user, initialize_user_stats, update_user_delegate, withdraw,
};
use drift::program::Drift;
use drift::State;

#[derive(Accounts)]
pub struct DriftInitialize<'info> {
    #[account(has_one = manager @ ManagerError::NotAuthorizedError)]
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

pub fn drift_initialize_handler(
    ctx: Context<DriftInitialize>,
    trader: Option<Pubkey>,
) -> Result<()> {
    let treasury = &ctx.accounts.treasury;
    let seeds = &[
        "treasury".as_bytes(),
        treasury.fund.as_ref(),
        &[treasury.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    msg!("initialize_user_stats");
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
    let trader = trader.unwrap_or(ctx.accounts.manager.key());
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
        trader,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftUpdate<'info> {
    #[account(has_one = manager @ ManagerError::NotAuthorizedError)]
    pub fund: Account<'info, Fund>,
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    /// CHECK: checks are done inside cpi call
    pub user: UncheckedAccount<'info>,

    #[account(mut)]
    manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
}

pub fn drift_update_delegated_trader_handler(
    ctx: Context<DriftUpdate>,
    trader: Option<Pubkey>,
) -> Result<()> {
    let treasury = &ctx.accounts.treasury;
    let seeds = &[
        "treasury".as_bytes(),
        treasury.fund.as_ref(),
        &[treasury.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    msg!("update_user_delegate");
    let trader = trader.unwrap_or(ctx.accounts.manager.key());
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
        trader,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DriftDeposit<'info> {
    #[account(has_one = manager @ ManagerError::NotAuthorizedError)]
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
    pub treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub drift_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub token_program: Program<'info, Token>,
}

pub fn drift_deposit_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftDeposit<'info>>,
    amount: u64,
) -> Result<()> {
    let treasury = &ctx.accounts.treasury;
    let seeds = &[
        "treasury".as_bytes(),
        treasury.fund.as_ref(),
        &[treasury.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    msg!("deposit");
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
    #[account(has_one = manager @ ManagerError::NotAuthorizedError)]
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
    /// CHECK: checks are done inside cpi call
    pub drift_signer: UncheckedAccount<'info>,

    #[account(mut)]
    pub treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub drift_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    manager: Signer<'info>,

    pub drift_program: Program<'info, Drift>,
    pub token_program: Program<'info, Token>,
}

pub fn drift_withdraw_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftWithdraw<'info>>,
    amount: u64,
) -> Result<()> {
    let treasury = &ctx.accounts.treasury;
    let seeds = &[
        "treasury".as_bytes(),
        treasury.fund.as_ref(),
        &[treasury.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    msg!("withdraw");
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
pub struct DriftClose<'info> {
    #[account(has_one = manager @ ManagerError::NotAuthorizedError)]
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
    pub system_program: Program<'info, System>,
}

pub fn drift_close_handler(ctx: Context<DriftClose>) -> Result<()> {
    let treasury = &ctx.accounts.treasury;
    let seeds = &[
        "treasury".as_bytes(),
        treasury.fund.as_ref(),
        &[treasury.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    msg!("close_user");
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
