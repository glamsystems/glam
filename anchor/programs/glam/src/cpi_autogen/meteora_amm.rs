use crate::state::{
    acl::{self, *},
    StateAccount,
};
use anchor_lang::prelude::*;
pub use meteora_amm::program::Amm as MeteoraAmm;
use meteora_amm::typedefs::*;
#[derive(Accounts)]
pub struct MeteoraAmmSwap<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, MeteoraAmm>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub pool: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_source_token: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_destination_token: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub a_vault: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub b_vault: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub a_token_vault: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub b_token_vault: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub a_vault_lp_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub b_vault_lp_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub a_vault_lp: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub b_vault_lp: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub protocol_token_fee: AccountInfo<'info>,
    pub user: Signer<'info>,
    /// CHECK: should be validated by target program
    pub vault_program: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MeteoraAmmAddImbalanceLiquidity<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, MeteoraAmm>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub pool: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub lp_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_pool_lp: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub a_vault_lp: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub b_vault_lp: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub a_vault: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub b_vault: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub a_vault_lp_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub b_vault_lp_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub a_token_vault: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub b_token_vault: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_a_token: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_b_token: AccountInfo<'info>,
    pub user: Signer<'info>,
    /// CHECK: should be validated by target program
    pub vault_program: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MeteoraAmmRemoveBalanceLiquidity<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, MeteoraAmm>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub pool: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub lp_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_pool_lp: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub a_vault_lp: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub b_vault_lp: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub a_vault: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub b_vault: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub a_vault_lp_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub b_vault_lp_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub a_token_vault: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub b_token_vault: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_a_token: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_b_token: AccountInfo<'info>,
    pub user: Signer<'info>,
    /// CHECK: should be validated by target program
    pub vault_program: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_program: AccountInfo<'info>,
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::MeteoraSwap
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::MeteoraAmm)
)]
pub fn meteora_amm_swap(
    ctx: Context<MeteoraAmmSwap>,
    in_amount: u64,
    minimum_out_amount: u64,
) -> Result<()> {
    meteora_amm::cpi::swap(
        CpiContext::new(
            ctx.accounts.cpi_program.to_account_info(),
            meteora_amm::cpi::accounts::Swap {
                pool: ctx.accounts.pool.to_account_info(),
                user_source_token: ctx.accounts.user_source_token.to_account_info(),
                user_destination_token: ctx
                    .accounts
                    .user_destination_token
                    .to_account_info(),
                a_vault: ctx.accounts.a_vault.to_account_info(),
                b_vault: ctx.accounts.b_vault.to_account_info(),
                a_token_vault: ctx.accounts.a_token_vault.to_account_info(),
                b_token_vault: ctx.accounts.b_token_vault.to_account_info(),
                a_vault_lp_mint: ctx.accounts.a_vault_lp_mint.to_account_info(),
                b_vault_lp_mint: ctx.accounts.b_vault_lp_mint.to_account_info(),
                a_vault_lp: ctx.accounts.a_vault_lp.to_account_info(),
                b_vault_lp: ctx.accounts.b_vault_lp.to_account_info(),
                protocol_token_fee: ctx.accounts.protocol_token_fee.to_account_info(),
                user: ctx.accounts.user.to_account_info(),
                vault_program: ctx.accounts.vault_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        ),
        in_amount,
        minimum_out_amount,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::MeteoraLiquidity
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::MeteoraAmm)
)]
pub fn meteora_amm_add_imbalance_liquidity(
    ctx: Context<MeteoraAmmAddImbalanceLiquidity>,
    minimum_pool_token_amount: u64,
    token_a_amount: u64,
    token_b_amount: u64,
) -> Result<()> {
    meteora_amm::cpi::add_imbalance_liquidity(
        CpiContext::new(
            ctx.accounts.cpi_program.to_account_info(),
            meteora_amm::cpi::accounts::AddImbalanceLiquidity {
                pool: ctx.accounts.pool.to_account_info(),
                lp_mint: ctx.accounts.lp_mint.to_account_info(),
                user_pool_lp: ctx.accounts.user_pool_lp.to_account_info(),
                a_vault_lp: ctx.accounts.a_vault_lp.to_account_info(),
                b_vault_lp: ctx.accounts.b_vault_lp.to_account_info(),
                a_vault: ctx.accounts.a_vault.to_account_info(),
                b_vault: ctx.accounts.b_vault.to_account_info(),
                a_vault_lp_mint: ctx.accounts.a_vault_lp_mint.to_account_info(),
                b_vault_lp_mint: ctx.accounts.b_vault_lp_mint.to_account_info(),
                a_token_vault: ctx.accounts.a_token_vault.to_account_info(),
                b_token_vault: ctx.accounts.b_token_vault.to_account_info(),
                user_a_token: ctx.accounts.user_a_token.to_account_info(),
                user_b_token: ctx.accounts.user_b_token.to_account_info(),
                user: ctx.accounts.user.to_account_info(),
                vault_program: ctx.accounts.vault_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        ),
        minimum_pool_token_amount,
        token_a_amount,
        token_b_amount,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::MeteoraLiquidity
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::MeteoraAmm)
)]
pub fn meteora_amm_remove_balance_liquidity(
    ctx: Context<MeteoraAmmRemoveBalanceLiquidity>,
    pool_token_amount: u64,
    minimum_a_token_out: u64,
    minimum_b_token_out: u64,
) -> Result<()> {
    meteora_amm::cpi::remove_balance_liquidity(
        CpiContext::new(
            ctx.accounts.cpi_program.to_account_info(),
            meteora_amm::cpi::accounts::RemoveBalanceLiquidity {
                pool: ctx.accounts.pool.to_account_info(),
                lp_mint: ctx.accounts.lp_mint.to_account_info(),
                user_pool_lp: ctx.accounts.user_pool_lp.to_account_info(),
                a_vault_lp: ctx.accounts.a_vault_lp.to_account_info(),
                b_vault_lp: ctx.accounts.b_vault_lp.to_account_info(),
                a_vault: ctx.accounts.a_vault.to_account_info(),
                b_vault: ctx.accounts.b_vault.to_account_info(),
                a_vault_lp_mint: ctx.accounts.a_vault_lp_mint.to_account_info(),
                b_vault_lp_mint: ctx.accounts.b_vault_lp_mint.to_account_info(),
                a_token_vault: ctx.accounts.a_token_vault.to_account_info(),
                b_token_vault: ctx.accounts.b_token_vault.to_account_info(),
                user_a_token: ctx.accounts.user_a_token.to_account_info(),
                user_b_token: ctx.accounts.user_b_token.to_account_info(),
                user: ctx.accounts.user.to_account_info(),
                vault_program: ctx.accounts.vault_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
        ),
        pool_token_amount,
        minimum_a_token_out,
        minimum_b_token_out,
    )
}
