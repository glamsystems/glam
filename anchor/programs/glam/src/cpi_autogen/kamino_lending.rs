use crate::state::{
    acl::{self, *},
    StateAccount,
};
use anchor_lang::prelude::*;
use kamino_lending::program::KaminoLending;
use kamino_lending::typedefs::*;
#[derive(Accounts)]
pub struct KaminoLendingInitUserMetadata<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, KaminoLending>,
    /// CHECK: should be validated by target program
    #[account(address = glam_state.vault)]
    pub owner: AccountInfo<'info>,
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_metadata: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub referrer_user_metadata: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::KaminoInit
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::KaminoLending)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn kamino_lending_init_user_metadata(
    ctx: Context<KaminoLendingInitUserMetadata>,
    user_lookup_table: Pubkey,
) -> Result<()> {
    kamino_lending::cpi::init_user_metadata(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            kamino_lending::cpi::accounts::InitUserMetadata {
                owner: ctx.accounts.owner.to_account_info(),
                fee_payer: ctx.accounts.fee_payer.to_account_info(),
                user_metadata: ctx.accounts.user_metadata.to_account_info(),
                referrer_user_metadata: ctx.accounts.referrer_user_metadata.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        user_lookup_table,
    )
}

#[derive(Accounts)]
pub struct KaminoLendingInitObligation<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, KaminoLending>,
    /// CHECK: should be validated by target program
    #[account(address = glam_state.vault)]
    pub obligation_owner: AccountInfo<'info>,
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub obligation: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub lending_market: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub seed1_account: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub seed2_account: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub owner_user_metadata: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::KaminoInit
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::KaminoLending)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn kamino_lending_init_obligation(
    ctx: Context<KaminoLendingInitObligation>,
    args: InitObligationArgs,
) -> Result<()> {
    kamino_lending::cpi::init_obligation(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            kamino_lending::cpi::accounts::InitObligation {
                obligation_owner: ctx.accounts.obligation_owner.to_account_info(),
                fee_payer: ctx.accounts.fee_payer.to_account_info(),
                obligation: ctx.accounts.obligation.to_account_info(),
                lending_market: ctx.accounts.lending_market.to_account_info(),
                seed1_account: ctx.accounts.seed1_account.to_account_info(),
                seed2_account: ctx.accounts.seed2_account.to_account_info(),
                owner_user_metadata: ctx.accounts.owner_user_metadata.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        args,
    )
}

#[derive(Accounts)]
pub struct KaminoLendingInitObligationFarmsForReserve<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, KaminoLending>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: should be validated by target program
    #[account(address = glam_state.vault)]
    pub owner: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub obligation: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub lending_market_authority: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_farm_state: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub obligation_farm: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub lending_market: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub farms_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct KaminoLendingRefreshObligationFarmsForReserve<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, KaminoLending>,
    /// CHECK: should be validated by target program
    #[account(mut, address = glam_state.vault)]
    pub crank: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub obligation: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub lending_market_authority: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub reserve: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_farm_state: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub obligation_farm_user_state: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub lending_market: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub farms_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct KaminoLendingDepositReserveLiquidityAndObligationCollateral<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, KaminoLending>,
    /// CHECK: should be validated by target program
    #[account(mut, address = glam_state.vault)]
    pub owner: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub obligation: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub lending_market: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub lending_market_authority: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_liquidity_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_liquidity_supply: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_collateral_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_destination_deposit_collateral: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_source_liquidity: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub placeholder_user_destination_collateral: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub collateral_token_program: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub liquidity_token_program: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub instruction_sysvar_account: AccountInfo<'info>,
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::KaminoInit
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::KaminoLending)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn kamino_lending_init_obligation_farms_for_reserve(
    ctx: Context<KaminoLendingInitObligationFarmsForReserve>,
    mode: u8,
) -> Result<()> {
    kamino_lending::cpi::init_obligation_farms_for_reserve(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            kamino_lending::cpi::accounts::InitObligationFarmsForReserve {
                payer: ctx.accounts.payer.to_account_info(),
                owner: ctx.accounts.owner.to_account_info(),
                obligation: ctx.accounts.obligation.to_account_info(),
                lending_market_authority: ctx.accounts.lending_market_authority.to_account_info(),
                reserve: ctx.accounts.reserve.to_account_info(),
                reserve_farm_state: ctx.accounts.reserve_farm_state.to_account_info(),
                obligation_farm: ctx.accounts.obligation_farm.to_account_info(),
                lending_market: ctx.accounts.lending_market.to_account_info(),
                farms_program: ctx.accounts.farms_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        mode,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::KaminoInit
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::KaminoLending)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn kamino_lending_refresh_obligation_farms_for_reserve(
    ctx: Context<KaminoLendingRefreshObligationFarmsForReserve>,
    mode: u8,
) -> Result<()> {
    kamino_lending::cpi::refresh_obligation_farms_for_reserve(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            kamino_lending::cpi::accounts::RefreshObligationFarmsForReserve {
                crank: ctx.accounts.crank.to_account_info(),
                obligation: ctx.accounts.obligation.to_account_info(),
                lending_market_authority: ctx.accounts.lending_market_authority.to_account_info(),
                reserve: ctx.accounts.reserve.to_account_info(),
                reserve_farm_state: ctx.accounts.reserve_farm_state.to_account_info(),
                obligation_farm_user_state: ctx
                    .accounts
                    .obligation_farm_user_state
                    .to_account_info(),
                lending_market: ctx.accounts.lending_market.to_account_info(),
                farms_program: ctx.accounts.farms_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        mode,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::KaminoDeposit
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::KaminoLending)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn kamino_lending_deposit_reserve_liquidity_and_obligation_collateral(
    ctx: Context<KaminoLendingDepositReserveLiquidityAndObligationCollateral>,
    liquidity_amount: u64,
) -> Result<()> {
    kamino_lending::cpi::deposit_reserve_liquidity_and_obligation_collateral(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            kamino_lending::cpi::accounts::DepositReserveLiquidityAndObligationCollateral {
                owner: ctx.accounts.owner.to_account_info(),
                obligation: ctx.accounts.obligation.to_account_info(),
                lending_market: ctx.accounts.lending_market.to_account_info(),
                lending_market_authority: ctx.accounts.lending_market_authority.to_account_info(),
                reserve: ctx.accounts.reserve.to_account_info(),
                reserve_liquidity_mint: ctx.accounts.reserve_liquidity_mint.to_account_info(),
                reserve_liquidity_supply: ctx.accounts.reserve_liquidity_supply.to_account_info(),
                reserve_collateral_mint: ctx.accounts.reserve_collateral_mint.to_account_info(),
                reserve_destination_deposit_collateral: ctx
                    .accounts
                    .reserve_destination_deposit_collateral
                    .to_account_info(),
                user_source_liquidity: ctx.accounts.user_source_liquidity.to_account_info(),
                placeholder_user_destination_collateral: ctx
                    .accounts
                    .placeholder_user_destination_collateral
                    .to_account_info(),
                collateral_token_program: ctx.accounts.collateral_token_program.to_account_info(),
                liquidity_token_program: ctx.accounts.liquidity_token_program.to_account_info(),
                instruction_sysvar_account: ctx
                    .accounts
                    .instruction_sysvar_account
                    .to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        liquidity_amount,
    )
}
