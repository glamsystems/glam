use crate::state::{
    acl::{self, *},
    StateAccount,
};
use anchor_lang::prelude::*;
pub use meteora_dlmm::program::LbClmm as MeteoraDlmm;
use meteora_dlmm::typedefs::*;
#[derive(Accounts)]
pub struct MeteoraDlmmAddLiquidityByStrategy<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        mut,
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, MeteoraDlmm>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub position: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub lb_pair: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub bin_array_bitmap_extension: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_token_x: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_token_y: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_x: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_y: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_x_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_y_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub bin_array_lower: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub bin_array_upper: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_x_program: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_y_program: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub event_authority: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MeteoraDlmmInitializePosition<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        mut,
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, MeteoraDlmm>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub position: Signer<'info>,
    /// CHECK: should be validated by target program
    pub lb_pair: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: should be validated by target program
    pub event_authority: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MeteoraDlmmSwap<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        mut,
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, MeteoraDlmm>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub lb_pair: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub bin_array_bitmap_extension: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_x: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_y: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_token_in: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_token_out: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_x_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_y_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub oracle: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub host_fee_in: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_x_program: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_y_program: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub event_authority: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MeteoraDlmmClaimFee<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        mut,
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, MeteoraDlmm>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub lb_pair: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub position: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub bin_array_lower: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub bin_array_upper: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_x: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_y: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_token_x: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_token_y: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_x_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_y_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_program: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub event_authority: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MeteoraDlmmClosePosition<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        mut,
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, MeteoraDlmm>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub position: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub lb_pair: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub bin_array_lower: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub bin_array_upper: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub event_authority: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MeteoraDlmmRemoveLiquidityByRange<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        mut,
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, MeteoraDlmm>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub position: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub lb_pair: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub bin_array_bitmap_extension: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_token_x: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user_token_y: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_x: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_y: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_x_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_y_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub bin_array_lower: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub bin_array_upper: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_x_program: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_y_program: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub event_authority: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub program: AccountInfo<'info>,
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::MeteoraDlmmLiquidity
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::MeteoraDlmm)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn meteora_dlmm_add_liquidity_by_strategy(
    ctx: Context<MeteoraDlmmAddLiquidityByStrategy>,
    liquidity_parameter: LiquidityParameterByStrategy,
) -> Result<()> {
    meteora_dlmm::cpi::add_liquidity_by_strategy(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            meteora_dlmm::cpi::accounts::AddLiquidityByStrategy {
                position: ctx.accounts.position.to_account_info(),
                lb_pair: ctx.accounts.lb_pair.to_account_info(),
                bin_array_bitmap_extension: ctx
                    .accounts
                    .bin_array_bitmap_extension
                    .to_account_info(),
                user_token_x: ctx.accounts.user_token_x.to_account_info(),
                user_token_y: ctx.accounts.user_token_y.to_account_info(),
                reserve_x: ctx.accounts.reserve_x.to_account_info(),
                reserve_y: ctx.accounts.reserve_y.to_account_info(),
                token_x_mint: ctx.accounts.token_x_mint.to_account_info(),
                token_y_mint: ctx.accounts.token_y_mint.to_account_info(),
                bin_array_lower: ctx.accounts.bin_array_lower.to_account_info(),
                bin_array_upper: ctx.accounts.bin_array_upper.to_account_info(),
                sender: ctx.accounts.glam_vault.to_account_info(),
                token_x_program: ctx.accounts.token_x_program.to_account_info(),
                token_y_program: ctx.accounts.token_y_program.to_account_info(),
                event_authority: ctx.accounts.event_authority.to_account_info(),
                program: ctx.accounts.program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        liquidity_parameter,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::MeteoraDlmmInitPosition
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::MeteoraDlmm)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn meteora_dlmm_initialize_position(
    ctx: Context<MeteoraDlmmInitializePosition>,
    lower_bin_id: i32,
    width: i32,
) -> Result<()> {
    meteora_dlmm::cpi::initialize_position(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            meteora_dlmm::cpi::accounts::InitializePosition {
                payer: ctx.accounts.payer.to_account_info(),
                position: ctx.accounts.position.to_account_info(),
                lb_pair: ctx.accounts.lb_pair.to_account_info(),
                owner: ctx.accounts.glam_vault.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                event_authority: ctx.accounts.event_authority.to_account_info(),
                program: ctx.accounts.program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        lower_bin_id,
        width,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::MeteoraDlmmSwap
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::MeteoraDlmm)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn meteora_dlmm_swap(
    ctx: Context<MeteoraDlmmSwap>,
    amount_in: u64,
    min_amount_out: u64,
) -> Result<()> {
    meteora_dlmm::cpi::swap(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            meteora_dlmm::cpi::accounts::Swap {
                lb_pair: ctx.accounts.lb_pair.to_account_info(),
                bin_array_bitmap_extension: ctx
                    .accounts
                    .bin_array_bitmap_extension
                    .to_account_info(),
                reserve_x: ctx.accounts.reserve_x.to_account_info(),
                reserve_y: ctx.accounts.reserve_y.to_account_info(),
                user_token_in: ctx.accounts.user_token_in.to_account_info(),
                user_token_out: ctx.accounts.user_token_out.to_account_info(),
                token_x_mint: ctx.accounts.token_x_mint.to_account_info(),
                token_y_mint: ctx.accounts.token_y_mint.to_account_info(),
                oracle: ctx.accounts.oracle.to_account_info(),
                host_fee_in: ctx.accounts.host_fee_in.to_account_info(),
                user: ctx.accounts.glam_vault.to_account_info(),
                token_x_program: ctx.accounts.token_x_program.to_account_info(),
                token_y_program: ctx.accounts.token_y_program.to_account_info(),
                event_authority: ctx.accounts.event_authority.to_account_info(),
                program: ctx.accounts.program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        amount_in,
        min_amount_out,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::MeteoraDlmmLiquidity
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::MeteoraDlmm)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn meteora_dlmm_claim_fee(ctx: Context<MeteoraDlmmClaimFee>) -> Result<()> {
    meteora_dlmm::cpi::claim_fee(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            meteora_dlmm::cpi::accounts::ClaimFee {
                lb_pair: ctx.accounts.lb_pair.to_account_info(),
                position: ctx.accounts.position.to_account_info(),
                bin_array_lower: ctx.accounts.bin_array_lower.to_account_info(),
                bin_array_upper: ctx.accounts.bin_array_upper.to_account_info(),
                sender: ctx.accounts.glam_vault.to_account_info(),
                reserve_x: ctx.accounts.reserve_x.to_account_info(),
                reserve_y: ctx.accounts.reserve_y.to_account_info(),
                user_token_x: ctx.accounts.user_token_x.to_account_info(),
                user_token_y: ctx.accounts.user_token_y.to_account_info(),
                token_x_mint: ctx.accounts.token_x_mint.to_account_info(),
                token_y_mint: ctx.accounts.token_y_mint.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                event_authority: ctx.accounts.event_authority.to_account_info(),
                program: ctx.accounts.program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::MeteoraDlmmClosePosition
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::MeteoraDlmm)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn meteora_dlmm_close_position(
    ctx: Context<MeteoraDlmmClosePosition>,
) -> Result<()> {
    meteora_dlmm::cpi::close_position(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            meteora_dlmm::cpi::accounts::ClosePosition {
                position: ctx.accounts.position.to_account_info(),
                lb_pair: ctx.accounts.lb_pair.to_account_info(),
                bin_array_lower: ctx.accounts.bin_array_lower.to_account_info(),
                bin_array_upper: ctx.accounts.bin_array_upper.to_account_info(),
                sender: ctx.accounts.glam_vault.to_account_info(),
                rent_receiver: ctx.accounts.glam_vault.to_account_info(),
                event_authority: ctx.accounts.event_authority.to_account_info(),
                program: ctx.accounts.program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::MeteoraDlmmLiquidity
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::MeteoraDlmm)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn meteora_dlmm_remove_liquidity_by_range(
    ctx: Context<MeteoraDlmmRemoveLiquidityByRange>,
    from_bin_id: i32,
    to_bin_id: i32,
    bps_to_remove: u16,
) -> Result<()> {
    meteora_dlmm::cpi::remove_liquidity_by_range(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            meteora_dlmm::cpi::accounts::RemoveLiquidityByRange {
                position: ctx.accounts.position.to_account_info(),
                lb_pair: ctx.accounts.lb_pair.to_account_info(),
                bin_array_bitmap_extension: ctx
                    .accounts
                    .bin_array_bitmap_extension
                    .to_account_info(),
                user_token_x: ctx.accounts.user_token_x.to_account_info(),
                user_token_y: ctx.accounts.user_token_y.to_account_info(),
                reserve_x: ctx.accounts.reserve_x.to_account_info(),
                reserve_y: ctx.accounts.reserve_y.to_account_info(),
                token_x_mint: ctx.accounts.token_x_mint.to_account_info(),
                token_y_mint: ctx.accounts.token_y_mint.to_account_info(),
                bin_array_lower: ctx.accounts.bin_array_lower.to_account_info(),
                bin_array_upper: ctx.accounts.bin_array_upper.to_account_info(),
                sender: ctx.accounts.glam_vault.to_account_info(),
                token_x_program: ctx.accounts.token_x_program.to_account_info(),
                token_y_program: ctx.accounts.token_y_program.to_account_info(),
                event_authority: ctx.accounts.event_authority.to_account_info(),
                program: ctx.accounts.program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        from_bin_id,
        to_bin_id,
        bps_to_remove,
    )
}
