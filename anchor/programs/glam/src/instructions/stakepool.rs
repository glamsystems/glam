use crate::{state::*, constants::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use solana_program::program::invoke_signed;
use spl_stake_pool::{instruction::deposit_sol, ID};

#[derive(Accounts)]
pub struct StakePoolDeposit<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(mut)]
    pub pool_mint: Account<'info, Mint>,

    /// CHECK: skip
    #[account(mut)]
    pub fee_account: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub stake_pool: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub reserve_stake: AccountInfo<'info>,

    /// CHECK: skip
    #[account()]
    pub withdraw_authority: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = manager,
        associated_token::mint = pool_mint,
        associated_token::authority = treasury,
    )]
    pub mint_to: Account<'info, TokenAccount>,

    /// CHECK: use constraint
    #[account(
        constraint = stake_pool_program.key.to_string() == SANCTUM.to_string() || stake_pool_program.key.to_string() == ID.to_string() 
    )]
    pub stake_pool_program: AccountInfo<'info>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::MarinadeStake)
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
