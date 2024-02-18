use anchor_lang::prelude::*;

#[error_code]
pub enum ManagerError {
    #[msg("Error closing account: not empty")]
    CloseNotEmptyError,
    #[msg("Error: not authorized")]
    NotAuthorizedError,
    #[msg("Invalid fund name: max 30 chars")]
    InvalidFundName,
}
