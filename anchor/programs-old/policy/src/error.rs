use anchor_lang::prelude::*;

#[error_code]
pub enum PolicyError {
    #[msg("Amount too big")]
    AmountTooBig,
}
