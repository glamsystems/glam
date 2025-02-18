use anchor_lang::prelude::*;
use drift::program::Drift;
use drift::MarketType;
pub use drift::OrderParams;

use crate::error::GlamError;
use crate::state::*;

#[derive(Accounts)]
pub struct DriftPlaceOrders<'info> {
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

pub fn drift_place_orders_pre_checks<'c: 'info, 'info>(
    ctx: &Context<'_, '_, 'c, 'info, DriftPlaceOrders<'info>>,
    params: &Vec<OrderParams>,
) -> Result<()> {
    let state = &ctx.accounts.glam_state;
    for order in params {
        let permission = match order.market_type {
            MarketType::Spot => Permission::DriftSpotMarket,
            MarketType::Perp => Permission::DriftPerpMarket,
        };
        acl::check_access(
            &ctx.accounts.glam_state,
            &ctx.accounts.glam_signer.key,
            permission,
        )?;

        match order.market_type {
            MarketType::Spot => {
                if let Some(drift_market_indexes_spot) = state.drift_market_indexes_spot() {
                    if drift_market_indexes_spot.len() > 0 {
                        require!(
                            drift_market_indexes_spot.contains(&(order.market_index as u32)),
                            GlamError::NotAuthorized
                        );
                    }
                }
            }
            MarketType::Perp => {
                if let Some(drift_market_indexes_perp) = state.drift_market_indexes_perp() {
                    if drift_market_indexes_perp.len() > 0 {
                        require!(
                            drift_market_indexes_perp.contains(&(order.market_index as u32)),
                            GlamError::NotAuthorized
                        );
                    }
                }
            }
        }
        if let Some(drift_order_types) = state.drift_order_types() {
            if drift_order_types.len() > 0 {
                require!(
                    drift_order_types.contains(&(order.order_type as u32)),
                    GlamError::NotAuthorized
                );
            }
        }
    }
    Ok(())
}

#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::DriftPlaceOrders
    )
)]
#[access_control(acl::check_integration(&ctx.accounts.glam_state, Integration::Drift))]
#[glam_macros::glam_vault_signer_seeds]
pub fn drift_place_orders<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftPlaceOrders<'info>>,
    params: Vec<OrderParams>,
) -> Result<()> {
    drift_place_orders_pre_checks(&ctx, &params)?;

    drift::cpi::place_orders(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            drift::cpi::accounts::PlaceOrders {
                state: ctx.accounts.state.to_account_info(),
                user: ctx.accounts.user.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
            glam_vault_signer_seeds,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        params,
    )
}
