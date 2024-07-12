use crate::{constants::*, state::*};
use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    associated_token::AssociatedToken,
    stake::{deactivate_stake, withdraw, DeactivateStake, Stake, StakeAccount, Withdraw},
    token::{Mint, Token, TokenAccount},
};

use solana_program::program::invoke_signed;
use spl_stake_pool::{
    instruction::{deposit_sol, withdraw_sol, withdraw_stake},
    ID as SPL_STAKE_POOL_PROGRAM_ID,
};

#[derive(Accounts)]
pub struct StakePoolDeposit<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    /// CHECK: use constraint
    #[account(
        constraint = stake_pool_program.key == &SANCTUM_STAKE_POOL_PROGRAM_ID || stake_pool_program.key == &SPL_STAKE_POOL_PROGRAM_ID
    )]
    pub stake_pool_program: AccountInfo<'info>,

    /// CHECK: checked by stake pool program
    #[account(mut)]
    pub stake_pool: AccountInfo<'info>,

    /// CHECK: checked by stake pool program
    #[account()]
    pub withdraw_authority: AccountInfo<'info>,

    /// CHECK: checked by stake pool program
    #[account(mut)]
    pub reserve_stake: AccountInfo<'info>,

    #[account(mut)]
    pub pool_mint: Account<'info, Mint>,

    /// CHECK: checked by stake pool program
    #[account(mut)]
    pub fee_account: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = manager,
        associated_token::mint = pool_mint,
        associated_token::authority = treasury,
    )]
    pub mint_to: Account<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::Stake)
)]
pub fn stake_pool_deposit<'c: 'info, 'info>(
    ctx: Context<StakePoolDeposit>,
    lamports: u64,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    let ix = deposit_sol(
        ctx.accounts.stake_pool_program.key,
        ctx.accounts.stake_pool.key,
        ctx.accounts.withdraw_authority.key,
        ctx.accounts.reserve_stake.key,
        ctx.accounts.treasury.key,
        &ctx.accounts.mint_to.key(),
        ctx.accounts.fee_account.key,
        &ctx.accounts.mint_to.key(),
        ctx.accounts.pool_mint.to_account_info().key,
        ctx.accounts.token_program.key,
        lamports,
    );
    let _ = invoke_signed(
        &ix,
        &[
            ctx.accounts.stake_pool_program.clone(),
            ctx.accounts.stake_pool.clone(),
            ctx.accounts.withdraw_authority.clone(),
            ctx.accounts.reserve_stake.clone(),
            ctx.accounts.treasury.to_account_info(),
            ctx.accounts.fee_account.clone(),
            ctx.accounts.mint_to.to_account_info(),
            ctx.accounts.pool_mint.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
        ],
        signer_seeds,
    );

    Ok(())
}

#[derive(Accounts)]
pub struct StakePoolWithdrawSol<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    /// CHECK: use constraint
    #[account(
        constraint = stake_pool_program.key == &SANCTUM_STAKE_POOL_PROGRAM_ID || stake_pool_program.key == &SPL_STAKE_POOL_PROGRAM_ID
    )]
    pub stake_pool_program: AccountInfo<'info>,

    /// CHECK: checked by stake pool program
    #[account(mut)]
    pub stake_pool: AccountInfo<'info>,

    /// CHECK: checked by stake pool program
    #[account()]
    pub withdraw_authority: AccountInfo<'info>,

    /// CHECK: checked by stake pool program
    #[account(mut)]
    pub reserve_stake: AccountInfo<'info>,

    #[account(mut)]
    pub pool_mint: Account<'info, Mint>,

    /// CHECK: checked by stake pool program
    #[account(mut)]
    pub fee_account: AccountInfo<'info>,

    #[account(mut, constraint = pool_token_ata.mint == pool_mint.key())]
    pub pool_token_ata: Account<'info, TokenAccount>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_history: Sysvar<'info, StakeHistory>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub native_stake_program: Program<'info, Stake>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::LiquidUnstake)
)]
pub fn stake_pool_withdraw_sol<'c: 'info, 'info>(
    ctx: Context<StakePoolWithdrawSol>,
    lamports: u64,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    let ix = withdraw_sol(
        ctx.accounts.stake_pool_program.key,
        ctx.accounts.stake_pool.key,
        ctx.accounts.withdraw_authority.key,
        ctx.accounts.treasury.key,
        &ctx.accounts.pool_token_ata.key(),
        ctx.accounts.reserve_stake.key,
        ctx.accounts.treasury.key,
        ctx.accounts.fee_account.key,
        &ctx.accounts.pool_mint.key(),
        ctx.accounts.token_program.key,
        lamports,
    );

    let _ = invoke_signed(
        &ix,
        &[
            ctx.accounts.stake_pool_program.clone(),
            ctx.accounts.stake_pool.clone(),
            ctx.accounts.withdraw_authority.clone(),
            ctx.accounts.treasury.to_account_info(),
            ctx.accounts.pool_token_ata.to_account_info(),
            ctx.accounts.reserve_stake.clone(),
            ctx.accounts.fee_account.clone(),
            ctx.accounts.pool_mint.to_account_info(),
            ctx.accounts.clock.to_account_info(),
            ctx.accounts.stake_history.to_account_info(),
            ctx.accounts.native_stake_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
        ],
        signer_seeds,
    );

    Ok(())
}

#[derive(Accounts)]
pub struct StakePoolWithdrawStake<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    /// CHECK: will be initialized in the instruction
    #[account(mut)]
    pub treasury_stake_account: AccountInfo<'info>,

    #[account(mut)]
    pub pool_mint: Account<'info, Mint>,

    /// CHECK: checked by stake pool program
    #[account(mut)]
    pub fee_account: AccountInfo<'info>,

    /// CHECK: checked by stake pool program
    #[account(mut)]
    pub stake_pool: AccountInfo<'info>,

    /// CHECK: checked by stake pool program
    #[account()]
    pub withdraw_authority: AccountInfo<'info>,

    /// CHECK: checked by stake pool program
    #[account(mut)]
    pub validator_list: AccountInfo<'info>,

    #[account(mut)]
    pub validator_stake_account: Account<'info, StakeAccount>,

    #[account(mut, constraint = pool_token_ata.mint == pool_mint.key())]
    pub pool_token_ata: Account<'info, TokenAccount>,

    /// CHECK: use constraint
    #[account(
        constraint = stake_pool_program.key == &SANCTUM_STAKE_POOL_PROGRAM_ID || stake_pool_program.key == &SPL_STAKE_POOL_PROGRAM_ID
    )]
    pub stake_pool_program: AccountInfo<'info>,

    pub clock: Sysvar<'info, Clock>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub native_stake_program: Program<'info, Stake>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::Unstake)
)]
pub fn stake_pool_withdraw_stake<'c: 'info, 'info>(
    ctx: Context<StakePoolWithdrawStake>,
    pool_token_amount: u64,
    stake_account_bump: u8,
    stake_account_id: String,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();

    // Create stake account and leave it uninitialized
    msg!(
        "Stake account address {}",
        ctx.accounts.treasury_stake_account.key()
    );
    let seeds = &[
        b"stake_account".as_ref(),
        stake_account_id.as_bytes(),
        fund_key.as_ref(),
        &[stake_account_bump],
    ];
    let signer_seeds = &[&seeds[..]];
    system_program::create_account(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::CreateAccount {
                from: ctx.accounts.manager.to_account_info(),
                to: ctx
                    .accounts
                    .treasury_stake_account
                    .to_account_info()
                    .clone(),
            },
            signer_seeds,
        ),
        Rent::get()?.minimum_balance(200),
        std::mem::size_of::<StakeAccount>() as u64, // no +8
        &ctx.accounts.native_stake_program.key(),
    )?;

    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];
    let ix = withdraw_stake(
        ctx.accounts.stake_pool_program.key,
        ctx.accounts.stake_pool.key,
        ctx.accounts.validator_list.key,
        ctx.accounts.withdraw_authority.key,
        &ctx.accounts.validator_stake_account.key(),
        ctx.accounts.treasury_stake_account.key,
        ctx.accounts.treasury.key,
        ctx.accounts.treasury.key,
        &ctx.accounts.pool_token_ata.key(),
        ctx.accounts.fee_account.key,
        &ctx.accounts.pool_mint.key(),
        ctx.accounts.token_program.key,
        pool_token_amount,
    );

    msg!("Withdraw lamports: {}", pool_token_amount);

    let _ = invoke_signed(
        &ix,
        &[
            ctx.accounts.stake_pool_program.clone(),
            ctx.accounts.stake_pool.clone(),
            ctx.accounts.validator_list.clone(),
            ctx.accounts.withdraw_authority.clone(),
            ctx.accounts.validator_stake_account.to_account_info(),
            ctx.accounts.treasury_stake_account.to_account_info(),
            ctx.accounts.treasury.to_account_info(),
            ctx.accounts.treasury.to_account_info(), // pool token authority
            ctx.accounts.pool_token_ata.to_account_info(),
            ctx.accounts.fee_account.clone(),
            ctx.accounts.pool_mint.to_account_info(),
            ctx.accounts.clock.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.native_stake_program.to_account_info(),
        ],
        signer_seeds,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DeactivateStakeAccounts<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub native_stake_program: Program<'info, Stake>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::Unstake)
)]
pub fn deactivate_stake_accounts<'info>(
    ctx: Context<'_, '_, '_, 'info, DeactivateStakeAccounts<'info>>,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        b"treasury".as_ref(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    ctx.remaining_accounts.iter().for_each(|stake_account| {
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.native_stake_program.to_account_info(),
            DeactivateStake {
                stake: stake_account.clone(),
                staker: ctx.accounts.treasury.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
            },
            signer_seeds,
        );
        let _ = deactivate_stake(cpi_ctx);
    });
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawFromStakeAccounts<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_history: Sysvar<'info, StakeHistory>,
    pub native_stake_program: Program<'info, Stake>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::Unstake)
)]
pub fn withdraw_from_stake_accounts<'info>(
    ctx: Context<'_, '_, '_, 'info, WithdrawFromStakeAccounts<'info>>,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        b"treasury".as_ref(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    ctx.remaining_accounts.iter().for_each(|stake_account| {
        let lamports = stake_account.get_lamports();
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.native_stake_program.to_account_info(),
            Withdraw {
                stake: stake_account.clone(),
                withdrawer: ctx.accounts.treasury.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
                stake_history: ctx.accounts.stake_history.to_account_info(),
            },
            signer_seeds,
        );

        let _ = withdraw(cpi_ctx, lamports, None);
    });

    Ok(())
}
