use anchor_lang::prelude::*;
use drift::{OracleSource, PerpPosition, SpotBalanceType, SpotMarket, SpotPosition};

use crate::error::GlamError;

pub const AMM_RESERVE_PRECISION: i128 = 1_000_000_000;

pub const PRICE_PRECISION: i64 = 1_000_000; //expo = -6;

pub trait PerpPositionExt {
    fn get_unrealized_pnl(&self, oracle_price: i64) -> Option<i128>;
}

pub trait SpotPositionExt {
    fn get_token_amount(&self, market: &SpotMarket) -> Option<u128>;
    fn get_balance_value_and_token_amount(
        &self,
        oracle_price: i64,
        market: &SpotMarket,
    ) -> Option<(u128, u128)>;
}

impl PerpPositionExt for PerpPosition {
    // https://github.com/drift-labs/protocol-v2/blob/master/programs/drift/src/math/position.rs#L116
    fn get_unrealized_pnl(&self, oracle_price: i64) -> Option<i128> {
        if self.base_asset_amount == 0 {
            return Some(self.quote_asset_amount as i128);
        }

        let oracle_price = oracle_price.max(0);

        let base_asset_value = (self.base_asset_amount as i128)
            .checked_mul(oracle_price as i128)?
            .checked_div(AMM_RESERVE_PRECISION)?;

        let pnl = base_asset_value.checked_add(self.quote_asset_amount as i128);

        pnl
    }
}

impl SpotPositionExt for SpotPosition {
    fn get_token_amount(&self, market: &SpotMarket) -> Option<u128> {
        let precision_decrease = 10_u128.pow(19_u32.checked_sub(market.decimals)?);
        let cumulative_interest = match self.balance_type {
            SpotBalanceType::Deposit => market.cumulative_deposit_interest,
            SpotBalanceType::Borrow => market.cumulative_borrow_interest,
        };
        let scaled_balance = self.scaled_balance as u128;
        let token_amount = match self.balance_type {
            SpotBalanceType::Deposit => scaled_balance
                .checked_mul(cumulative_interest)?
                .checked_div(precision_decrease)?,
            SpotBalanceType::Borrow => {
                let amount = scaled_balance.checked_mul(cumulative_interest)?;
                let quotient = amount.checked_div(precision_decrease)?;
                let remainder = amount.checked_rem(precision_decrease)?;
                if remainder > 0 {
                    quotient.checked_add(1)?
                } else {
                    quotient
                }
            }
        };
        Some(token_amount)
    }

    // https://github.com/drift-labs/protocol-v2/blob/f497a153d0954018be463cdf2893ea9c623c3b01/programs/drift/src/math/spot_balance.rs#L228-L242
    // SPOT_BALANCE_PRECISION = 1_000_000_000
    fn get_balance_value_and_token_amount(
        &self,
        oracle_price: i64,
        market: &SpotMarket,
    ) -> Option<(u128, u128)> {
        let token_amount = self.get_token_amount(market)?;

        let precision_decrease = 10_u128.pow(market.decimals);
        let value = token_amount
            .checked_mul(oracle_price as u128)?
            .checked_div(precision_decrease)?;

        msg!(
            "spot_market: {}, oracle_price: {}, token_amount: {}, value: {}",
            market.market_index,
            oracle_price,
            token_amount,
            value
        );

        Some((value, token_amount))
    }
}

pub trait OracleSourceExt {
    fn is_pyth_pull_oracle(&self) -> bool;
    fn is_pyth_push_oracle(&self) -> bool;
    fn get_pyth_multiple(&self) -> u128;
}

impl OracleSourceExt for OracleSource {
    fn is_pyth_pull_oracle(&self) -> bool {
        matches!(
            self,
            OracleSource::PythPull
                | OracleSource::Pyth1KPull
                | OracleSource::Pyth1MPull
                | OracleSource::PythStableCoinPull
        )
    }

    fn is_pyth_push_oracle(&self) -> bool {
        matches!(
            self,
            OracleSource::Pyth
                | OracleSource::Pyth1K
                | OracleSource::Pyth1M
                | OracleSource::PythStableCoin
        )
    }

    fn get_pyth_multiple(&self) -> u128 {
        match self {
            OracleSource::Pyth
            | OracleSource::PythPull
            | OracleSource::PythLazer
            | OracleSource::PythStableCoin
            | OracleSource::PythStableCoinPull
            | OracleSource::PythLazerStableCoin => 1,
            OracleSource::Pyth1K | OracleSource::Pyth1KPull | OracleSource::PythLazer1K => 1000,
            OracleSource::Pyth1M | OracleSource::Pyth1MPull | OracleSource::PythLazer1M => 1000000,
            _ => {
                panic!("Calling get_pyth_multiple on non-pyth oracle source");
            }
        }
    }
}

#[derive(Default, Clone, Copy, Debug)]
pub struct OraclePriceData {
    pub price: i64,
    pub confidence: u64,
    pub delay: i64,
}

impl OraclePriceData {
    pub fn default_usd() -> Self {
        OraclePriceData {
            price: PRICE_PRECISION,
            confidence: 1,
            delay: 0,
        }
    }
}

#[account(zero_copy(unsafe))]
#[derive(Default, Eq, PartialEq, Debug)]
#[repr(C)]
pub struct PythLazerOracle {
    pub price: i64,
    pub publish_time: u64,
    pub posted_slot: u64,
    pub exponent: i32,
    pub _padding: [u8; 4],
    pub conf: u64,
}

// https://github.com/drift-labs/protocol-v2/blob/master/programs/drift/src/state/oracle.rs#L191
pub fn get_oracle_price(
    oracle_source: &OracleSource,
    price_oracle: &AccountInfo,
    clock_slot: u64,
) -> Result<OraclePriceData> {
    match oracle_source {
        OracleSource::Pyth => get_pyth_price(price_oracle, clock_slot, oracle_source),
        OracleSource::PythPull => get_pyth_price(price_oracle, clock_slot, oracle_source),
        OracleSource::PythStableCoin => {
            get_pyth_stable_coin_price(price_oracle, clock_slot, oracle_source)
        }
        OracleSource::PythLazer => get_pyth_price(price_oracle, clock_slot, oracle_source),
        OracleSource::PythLazerStableCoin => {
            get_pyth_stable_coin_price(price_oracle, clock_slot, oracle_source)
        }
        _ => Err(GlamError::PricingError.into()),
    }
}

// https://github.com/drift-labs/protocol-v2/blob/master/programs/drift/src/state/oracle.rs#L227
pub fn get_pyth_price(
    price_oracle: &AccountInfo,
    clock_slot: u64,
    oracle_source: &OracleSource,
) -> Result<OraclePriceData> {
    let multiple = oracle_source.get_pyth_multiple();
    let mut pyth_price_data: &[u8] = &price_oracle
        .try_borrow_data()
        .or(Err(GlamError::PricingError))?;

    let oracle_price: i64;
    let oracle_conf: u64;
    let mut oracle_precision: u128;
    let published_slot: u64;

    if oracle_source.is_pyth_pull_oracle() {
        let price_message = pyth_solana_receiver_sdk::price_update::PriceUpdateV2::try_deserialize(
            &mut pyth_price_data,
        )
        .unwrap();
        oracle_price = price_message.price_message.price;
        oracle_conf = price_message.price_message.conf;
        oracle_precision = 10_u128.pow(price_message.price_message.exponent.unsigned_abs());
        published_slot = price_message.posted_slot;
    } else if oracle_source.is_pyth_push_oracle() {
        // We don't support pyth push oracles
        return Err(GlamError::PricingError.into());
    } else {
        let price_data = PythLazerOracle::try_deserialize(&mut pyth_price_data).unwrap();
        oracle_price = price_data.price;
        oracle_conf = price_data.conf;
        oracle_precision = 10_u128.pow(price_data.exponent.unsigned_abs());
        published_slot = price_data.posted_slot;
    }

    if oracle_precision <= multiple {
        msg!("Multiple larger than oracle precision");
        return Err(GlamError::PricingError.into());
    }
    oracle_precision = oracle_precision.checked_div(multiple).unwrap();

    let mut oracle_scale_mult = 1;
    let mut oracle_scale_div = 1;

    if oracle_precision > PRICE_PRECISION as u128 {
        oracle_scale_div = oracle_precision
            .checked_div(PRICE_PRECISION as u128)
            .unwrap();
    } else {
        oracle_scale_mult = (PRICE_PRECISION as i128)
            .checked_div(oracle_precision as i128)
            .unwrap();
    }

    let oracle_price_scaled = (oracle_price)
        .checked_mul(oracle_scale_mult as i64)
        .unwrap()
        .checked_div(oracle_scale_div as i64)
        .unwrap();

    let oracle_conf_scaled = (oracle_conf)
        .checked_mul(oracle_scale_mult as u64)
        .unwrap()
        .checked_div(oracle_scale_div as u64)
        .unwrap();

    let oracle_delay = (clock_slot as i64)
        .checked_sub(published_slot as i64)
        .unwrap();

    Ok(OraclePriceData {
        price: oracle_price_scaled,
        confidence: oracle_conf_scaled,
        delay: oracle_delay,
    })
}

pub fn get_pyth_stable_coin_price(
    price_oracle: &AccountInfo,
    clock_slot: u64,
    oracle_source: &OracleSource,
) -> Result<OraclePriceData> {
    let mut oracle_price_data = get_pyth_price(price_oracle, clock_slot, oracle_source)?;

    let price = oracle_price_data.price;
    let confidence = oracle_price_data.confidence;
    let five_bps = 500_i64;

    if price.checked_sub(PRICE_PRECISION).unwrap().abs() <= five_bps.min(confidence as i64) {
        oracle_price_data.price = PRICE_PRECISION;
    }

    Ok(oracle_price_data)
}
