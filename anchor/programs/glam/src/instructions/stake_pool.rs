use crate::{constants::*, state::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    stake::{Stake, StakeAccount},
    token::{Mint, TokenAccount},
    token_interface::TokenInterface,
};

use solana_program::program::invoke_signed;
use spl_stake_pool::{
    instruction::{deposit_sol, deposit_stake, withdraw_sol, withdraw_stake},
    ID as SPL_STAKE_POOL_PROGRAM_ID,
};

pub struct StakePoolProgramInterface;
impl anchor_lang::Ids for StakePoolProgramInterface {
    fn ids() -> &'static [Pubkey] {
        &[
            SANCTUM_SINGLE_VALIDATOR,
            SANCTUM_MULTI_VALIDATOR,
            SPL_STAKE_POOL_PROGRAM_ID,
        ]
    }
}

#[derive(Accounts)]
pub struct StakePoolDepositSol<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

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
        payer = glam_signer,
        associated_token::mint = pool_mint,
        associated_token::authority = glam_vault,
    )]
    pub mint_to: Account<'info, TokenAccount>,

    pub stake_pool_program: Interface<'info, StakePoolProgramInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[access_control(
    acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::Stake)
)]
#[access_control(acl::check_stake_pool_integration(&ctx.accounts.glam_state, &ctx.accounts.stake_pool_program.key))]
#[glam_macros::glam_vault_signer_seeds]
pub fn deposit_sol_handler<'c: 'info, 'info>(
    ctx: Context<StakePoolDepositSol>,
    lamports: u64,
) -> Result<()> {
    let ix = deposit_sol(
        ctx.accounts.stake_pool_program.key,
        ctx.accounts.stake_pool.key,
        ctx.accounts.withdraw_authority.key,
        ctx.accounts.reserve_stake.key,
        ctx.accounts.glam_vault.key,
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
            ctx.accounts.stake_pool_program.to_account_info(),
            ctx.accounts.stake_pool.clone(),
            ctx.accounts.withdraw_authority.clone(),
            ctx.accounts.reserve_stake.clone(),
            ctx.accounts.glam_vault.to_account_info(),
            ctx.accounts.fee_account.clone(),
            ctx.accounts.mint_to.to_account_info(),
            ctx.accounts.pool_mint.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
        ],
        glam_vault_signer_seeds,
    );

    Ok(())
}

#[derive(Accounts)]
pub struct StakePoolDepositStake<'info> {
    #[account(mut)]
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

    #[account(mut)]
    pub vault_stake_account: Box<Account<'info, StakeAccount>>,

    #[account(
        init_if_needed,
        payer = glam_signer,
        associated_token::mint = pool_mint,
        associated_token::authority = glam_vault,
    )]
    pub mint_to: Account<'info, TokenAccount>,

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
    pub deposit_authority: AccountInfo<'info>,

    /// CHECK: checked by stake pool program
    #[account()]
    pub withdraw_authority: AccountInfo<'info>,

    /// CHECK: checked by stake pool program
    #[account(mut)]
    pub validator_list: AccountInfo<'info>,

    #[account(mut)]
    pub validator_stake_account: Box<Account<'info, StakeAccount>>,

    #[account(mut)]
    pub reserve_stake_account: Box<Account<'info, StakeAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_history: Sysvar<'info, StakeHistory>,

    pub stake_pool_program: Interface<'info, StakePoolProgramInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub stake_program: Program<'info, Stake>,
}

#[access_control(
    acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::Stake)
)]
#[access_control(acl::check_stake_pool_integration(&ctx.accounts.glam_state, &ctx.accounts.stake_pool_program.key))]
#[glam_macros::glam_vault_signer_seeds]
pub fn deposit_stake_handler<'c: 'info, 'info>(ctx: Context<StakePoolDepositStake>) -> Result<()> {
    let vec_ix = deposit_stake(
        ctx.accounts.stake_pool_program.key,
        ctx.accounts.stake_pool.key,
        ctx.accounts.validator_list.key,
        ctx.accounts.withdraw_authority.key, // stake pool withdraw authority
        &ctx.accounts.vault_stake_account.key(),
        ctx.accounts.glam_vault.key, // stake account withdraw authority
        &ctx.accounts.validator_stake_account.key(),
        &ctx.accounts.reserve_stake_account.key(),
        &ctx.accounts.mint_to.key(),
        ctx.accounts.fee_account.key,
        &ctx.accounts.mint_to.key(),
        ctx.accounts.pool_mint.to_account_info().key,
        ctx.accounts.token_program.key,
    );

    let account_infos = [
        ctx.accounts.stake_pool.clone(),
        ctx.accounts.validator_list.clone(),
        ctx.accounts.deposit_authority.clone(),
        ctx.accounts.withdraw_authority.clone(),
        ctx.accounts.vault_stake_account.to_account_info(),
        ctx.accounts.validator_stake_account.to_account_info(),
        ctx.accounts.reserve_stake_account.to_account_info(),
        ctx.accounts.mint_to.to_account_info(),
        ctx.accounts.fee_account.clone(),
        ctx.accounts.mint_to.to_account_info(),
        ctx.accounts.pool_mint.to_account_info(),
        ctx.accounts.clock.to_account_info(),
        ctx.accounts.stake_history.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.stake_pool_program.to_account_info(),
        ctx.accounts.glam_vault.to_account_info(),
    ];

    for ix in vec_ix {
        let _ = invoke_signed(&ix, &account_infos, glam_vault_signer_seeds);
    }

    let fund = &mut ctx.accounts.glam_state;
    fund.delete_from_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.vault_stake_account.key(),
    );

    Ok(())
}

#[derive(Accounts)]
pub struct StakePoolWithdrawSol<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

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

    pub stake_pool_program: Interface<'info, StakePoolProgramInterface>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub stake_program: Program<'info, Stake>,
}

#[access_control(
    acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::LiquidUnstake)
)]
#[access_control(acl::check_stake_pool_integration(&ctx.accounts.glam_state, &ctx.accounts.stake_pool_program.key))]
#[glam_macros::glam_vault_signer_seeds]
pub fn withdraw_sol_handler<'c: 'info, 'info>(
    ctx: Context<StakePoolWithdrawSol>,
    pool_token_amount: u64,
) -> Result<()> {
    let ix = withdraw_sol(
        ctx.accounts.stake_pool_program.key,
        ctx.accounts.stake_pool.key,
        ctx.accounts.withdraw_authority.key,
        ctx.accounts.glam_vault.key,
        &ctx.accounts.pool_token_ata.key(),
        ctx.accounts.reserve_stake.key,
        ctx.accounts.glam_vault.key,
        ctx.accounts.fee_account.key,
        &ctx.accounts.pool_mint.key(),
        ctx.accounts.token_program.key,
        pool_token_amount,
    );

    let _ = invoke_signed(
        &ix,
        &[
            ctx.accounts.stake_pool_program.to_account_info(),
            ctx.accounts.stake_pool.clone(),
            ctx.accounts.withdraw_authority.clone(),
            ctx.accounts.glam_vault.to_account_info(),
            ctx.accounts.pool_token_ata.to_account_info(),
            ctx.accounts.reserve_stake.clone(),
            ctx.accounts.fee_account.clone(),
            ctx.accounts.pool_mint.to_account_info(),
            ctx.accounts.clock.to_account_info(),
            ctx.accounts.stake_history.to_account_info(),
            ctx.accounts.stake_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
        ],
        glam_vault_signer_seeds,
    );

    Ok(())
}

#[derive(Accounts)]
pub struct StakePoolWithdrawStake<'info> {
    #[account(mut)]
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

    /// CHECK: will be initialized in the instruction
    #[account(mut)]
    pub vault_stake_account: AccountInfo<'info>,

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

    pub clock: Sysvar<'info, Clock>,

    pub stake_pool_program: Interface<'info, StakePoolProgramInterface>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub stake_program: Program<'info, Stake>,
}

#[access_control(
    acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::Unstake)
)]
#[access_control(
    acl::check_stake_pool_integration(&ctx.accounts.glam_state, &ctx.accounts.stake_pool_program.key)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn withdraw_stake_handler<'c: 'info, 'info>(
    ctx: Context<StakePoolWithdrawStake>,
    pool_token_amount: u64,
) -> Result<()> {
    let ix = withdraw_stake(
        ctx.accounts.stake_pool_program.key,
        ctx.accounts.stake_pool.key,
        ctx.accounts.validator_list.key,
        ctx.accounts.withdraw_authority.key,
        &ctx.accounts.validator_stake_account.key(),
        ctx.accounts.vault_stake_account.key,
        ctx.accounts.glam_vault.key,
        ctx.accounts.glam_vault.key,
        &ctx.accounts.pool_token_ata.key(),
        ctx.accounts.fee_account.key,
        &ctx.accounts.pool_mint.key(),
        ctx.accounts.token_program.key,
        pool_token_amount,
    );
    let _ = invoke_signed(
        &ix,
        &[
            ctx.accounts.stake_pool_program.to_account_info(),
            ctx.accounts.stake_pool.clone(),
            ctx.accounts.validator_list.clone(),
            ctx.accounts.withdraw_authority.clone(),
            ctx.accounts.validator_stake_account.to_account_info(),
            ctx.accounts.vault_stake_account.to_account_info(),
            ctx.accounts.glam_vault.to_account_info(),
            ctx.accounts.glam_vault.to_account_info(), // pool token authority
            ctx.accounts.pool_token_ata.to_account_info(),
            ctx.accounts.fee_account.clone(),
            ctx.accounts.pool_mint.to_account_info(),
            ctx.accounts.clock.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.stake_program.to_account_info(),
        ],
        glam_vault_signer_seeds,
    )?;

    // Add stake account to the fund params
    let state = &mut ctx.accounts.glam_state;
    state.add_to_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.vault_stake_account.key(),
    );

    Ok(())
}
