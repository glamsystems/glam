use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
    #[msg("Price is currently not available")]
    PriceUnavailable,
    #[msg("Invalid price feed id")]
    InvalidPriceFeedId,
}
