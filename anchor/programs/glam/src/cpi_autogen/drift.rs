use crate::state::{
    acl::{self, *},
    StateAccount,
};
use anchor_lang::prelude::*;
use drift::program::Drift;
use drift::typedefs::*;
#[derive(Accounts)]
pub struct DriftCancelOrders<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, Drift>,
    /// CHECK: should be validated by target program
    pub state: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(address = glam_state.vault)]
    pub authority: AccountInfo<'info>,
}
pub type DriftCancelOrdersByIds<'info> = DriftCancelOrders<'info>;
#[derive(Accounts)]
pub struct DriftModifyOrder<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, Drift>,
    /// CHECK: should be validated by target program
    pub state: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub user: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(address = glam_state.vault)]
    pub authority: AccountInfo<'info>,
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::DriftCancelOrders
    )
)]
#[access_control(acl::check_integration(&ctx.accounts.glam_state, Integration::Drift))]
#[glam_macros::glam_vault_signer_seeds]
pub fn drift_cancel_orders<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftCancelOrders<'info>>,
    market_type: Option<MarketType>,
    market_index: Option<u16>,
    direction: Option<PositionDirection>,
) -> Result<()> {
    drift::cpi::cancel_orders(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            drift::cpi::accounts::CancelOrders {
                state: ctx.accounts.state.to_account_info(),
                user: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
            glam_vault_signer_seeds,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        market_type,
        market_index,
        direction,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::DriftCancelOrders
    )
)]
#[access_control(acl::check_integration(&ctx.accounts.glam_state, Integration::Drift))]
#[glam_macros::glam_vault_signer_seeds]
pub fn drift_cancel_orders_by_ids<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftCancelOrdersByIds<'info>>,
    order_ids: Vec<u32>,
) -> Result<()> {
    drift::cpi::cancel_orders_by_ids(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            drift::cpi::accounts::CancelOrdersByIds {
                state: ctx.accounts.state.to_account_info(),
                user: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
            glam_vault_signer_seeds,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        order_ids,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::DriftModifyOrders
    )
)]
#[access_control(acl::check_integration(&ctx.accounts.glam_state, Integration::Drift))]
#[glam_macros::glam_vault_signer_seeds]
pub fn drift_modify_order(
    ctx: Context<DriftModifyOrder>,
    order_id: Option<u32>,
    modify_order_params: ModifyOrderParams,
) -> Result<()> {
    drift::cpi::modify_order(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            drift::cpi::accounts::ModifyOrder {
                state: ctx.accounts.state.to_account_info(),
                user: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        order_id,
        modify_order_params,
    )
}
