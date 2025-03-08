use std::collections::BTreeMap;

use anchor_lang::prelude::*;
use drift::program::Drift;
pub use drift::OrderParams;
use drift::{MarketType, PerpMarket, PerpPosition, SpotBalanceType, SpotMarket, SpotPosition};
use pricing::{PerpPositionExt, SpotPositionExt};

use crate::error::GlamError;
use crate::state::pricing::get_oracle_price;
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
                authority: ctx.accounts.glam_vault.to_account_info(),
            },
            glam_vault_signer_seeds,
        )
        .with_remaining_accounts(ctx.remaining_accounts.to_vec()),
        params,
    )
}

#[derive(Accounts)]
pub struct DriftBalanceValueUsd<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: validated by ix
    pub state: AccountInfo<'info>,
    /// CHECK: validated by ix
    pub user: AccountInfo<'info>,
    /// CHECK: validated by ix
    pub user_stats: AccountInfo<'info>,
}

pub fn drift_balance_value_usd<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, DriftBalanceValueUsd<'info>>,
) -> Result<()> {
    let user_data = ctx.accounts.user.try_borrow_data()?;
    let user_authority =
        Pubkey::try_from(&user_data[8..8 + 32]).map_err(|_| GlamError::NotAuthorized)?;
    msg!("user_authority: {}", user_authority);
    require!(
        user_authority == ctx.accounts.glam_vault.key(),
        GlamError::NotAuthorized
    );

    let user_stats_data = ctx.accounts.user_stats.try_borrow_data()?;
    let user_stats_authory =
        Pubkey::try_from(&user_stats_data[8..8 + 32]).map_err(|_| GlamError::NotAuthorized)?;
    msg!("user_stats_authory: {}", user_stats_authory);
    require!(
        user_stats_authory == ctx.accounts.glam_vault.key(),
        GlamError::NotAuthorized
    );
    let num_sub_accounts =
        u8::try_from_slice(&user_stats_data[184..185]).map_err(|_| GlamError::NotAuthorized)?;
    msg!("num_sub_accounts: {}", num_sub_accounts);

    let n = ctx.remaining_accounts.len();
    require!(n % 2 == 0, GlamError::PricingError);

    // market index -> (market account, oracle price)
    let mut spot_markets_map: BTreeMap<u16, (&AccountInfo<'info>, i64)> = BTreeMap::new();
    let mut perp_markets_map: BTreeMap<u16, (&AccountInfo<'info>, i64)> = BTreeMap::new();
    let clock_slot = Clock::get()?.slot;

    // remaining accounts are oracles and markets, first half are oracles, second half are markets
    for i in 0..n / 2 {
        let oracle = &ctx.remaining_accounts[i];
        let market = &ctx.remaining_accounts[i + n / 2];
        let mut market_data: &[u8] = &market.try_borrow_data().unwrap();
        match market_data[0..8] {
            [0x0a, 0xdf, 0x0c, 0x2c, 0x6b, 0xf5, 0x37, 0xf7] => {
                let perp_market = PerpMarket::try_deserialize(&mut market_data).unwrap();
                let oracle_price_data =
                    get_oracle_price(&perp_market.amm.oracle_source, oracle, clock_slot).unwrap();
                msg!(
                    "perp_market: {:?}, oracle_price_data: {:?}",
                    perp_market.market_index,
                    oracle_price_data
                );
                perp_markets_map
                    .insert(perp_market.market_index, (market, oracle_price_data.price));
            }
            [0x64, 0xb1, 0x08, 0x6b, 0xa8, 0x41, 0x41, 0x27] => {
                let spot_market = SpotMarket::try_deserialize(&mut market_data).unwrap();
                let oracle_price_data =
                    get_oracle_price(&spot_market.oracle_source, oracle, clock_slot).unwrap();
                msg!(
                    "spot_market: {:?}, oracle_price_data: {:?}",
                    spot_market.market_index,
                    oracle_price_data
                );
                spot_markets_map
                    .insert(spot_market.market_index, (market, oracle_price_data.price));
            }
            _ => {
                panic!("Unknown market");
            }
        }
    }

    let mut total_spot_value = 0;
    // from 104th byte of user_data, read 40*8 bytes and split into 40-byte chunks
    user_data[104..104 + 40 * 8].chunks(40).for_each(|chunk| {
        let spot_position = SpotPosition {
            scaled_balance: u64::from_le_bytes(chunk[0..8].try_into().unwrap()),
            open_bids: i64::from_le_bytes(chunk[8..16].try_into().unwrap()),
            open_asks: i64::from_le_bytes(chunk[16..24].try_into().unwrap()),
            cumulative_deposits: i64::from_le_bytes(chunk[24..32].try_into().unwrap()),
            market_index: u16::from_le_bytes(chunk[32..34].try_into().unwrap()),
            balance_type: if chunk[34] == 0 {
                SpotBalanceType::Deposit
            } else {
                SpotBalanceType::Borrow
            },
            open_orders: u8::from_le_bytes(chunk[35..36].try_into().unwrap()),
            padding: [0; 4],
        };

        if spot_position.scaled_balance > 0 {
            spot_markets_map
                .get(&spot_position.market_index)
                .map(|(market, oracle_price)| {
                    let mut market_data: &[u8] = &market.try_borrow_data().unwrap();
                    let spot_market = SpotMarket::try_deserialize(&mut market_data).unwrap();

                    if let Some((value, _)) = spot_position
                        .get_balance_value_and_token_amount(*oracle_price, &spot_market)
                    {
                        match spot_position.balance_type {
                            SpotBalanceType::Deposit => {
                                total_spot_value += value;
                            }
                            SpotBalanceType::Borrow => {
                                total_spot_value -= value;
                            }
                        }
                    }
                });
        }
    });
    msg!("total_spot_value: {}", total_spot_value);

    let mut total_unrealized_perp_pnl = 0;
    // from 424th byte of user_data, read 96*8 bytes and split into 96-byte chunks
    user_data[424..424 + 96 * 8].chunks(96).for_each(|chunk| {
        let perp_position = PerpPosition {
            last_cumulative_funding_rate: i64::from_le_bytes(chunk[0..8].try_into().unwrap()),
            base_asset_amount: i64::from_le_bytes(chunk[8..16].try_into().unwrap()),
            quote_asset_amount: i64::from_le_bytes(chunk[16..24].try_into().unwrap()),
            quote_break_even_amount: i64::from_le_bytes(chunk[24..32].try_into().unwrap()),
            quote_entry_amount: i64::from_le_bytes(chunk[32..40].try_into().unwrap()),
            open_bids: i64::from_le_bytes(chunk[40..48].try_into().unwrap()),
            open_asks: i64::from_le_bytes(chunk[48..56].try_into().unwrap()),
            settled_pnl: i64::from_le_bytes(chunk[56..64].try_into().unwrap()),
            lp_shares: u64::from_le_bytes(chunk[64..72].try_into().unwrap()),
            last_base_asset_amount_per_lp: i64::from_le_bytes(chunk[72..80].try_into().unwrap()),
            last_quote_asset_amount_per_lp: i64::from_le_bytes(chunk[80..88].try_into().unwrap()),
            remainder_base_asset_amount: i32::from_le_bytes(chunk[88..92].try_into().unwrap()),
            market_index: u16::from_le_bytes(chunk[92..94].try_into().unwrap()),
            open_orders: u8::from_le_bytes(chunk[94..95].try_into().unwrap()),
            per_lp_base: i8::from_le_bytes(chunk[95..96].try_into().unwrap()),
        };

        perp_markets_map
            .get(&perp_position.market_index)
            .map(|(_, oracle_price)| {
                let unrealized_pnl = perp_position.get_unrealized_pnl(*oracle_price);
                if let Some(unrealized_pnl) = unrealized_pnl {
                    total_unrealized_perp_pnl += unrealized_pnl;
                }
            });
    });
    msg!("total_unrealized_perp_pnl: {}", total_unrealized_perp_pnl);

    Ok(())
}
