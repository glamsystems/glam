use anchor_lang::prelude::*;

#[error_code]
pub enum PricingError {
    #[msg("Price is currently not available")]
    PriceUnavailable,
    #[msg("Invalid price feed id")]
    InvalidPriceFeedId,
}
