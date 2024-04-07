use anchor_lang::prelude::*;

#[error_code]
pub enum ManagerError {
    #[msg("Error closing account: not empty")]
    CloseNotEmptyError,
    #[msg("Error: not authorized")]
    NotAuthorizedError,
    #[msg("Invalid fund name: max 30 chars")]
    InvalidFundName,
    #[msg("Too many assets: max 50")]
    InvalidFundSymbol,
    #[msg("Too many assets: max 20")]
    InvalidFundUri,
    #[msg("Too many assets: max 100")]
    InvalidAssetsLen,
    #[msg("Number of weights should match number of assets")]
    InvalidAssetsWeights,
}

#[error_code]
pub enum InvestorError {
    #[msg("Fund is not active")]
    FundNotActive,
    #[msg("Share class not allowed to subscribe")]
    InvalidShareClass,
    #[msg("Asset not allowed to subscribe")]
    InvalidAssetSubscribe,
    #[msg("Invalid assets in redeem")]
    InvalidAssetsRedeem,
    #[msg("Invalid treasury account")]
    InvalidTreasuryAccount,
}

#[error_code]
pub enum PolicyError {
    #[msg("Policy violation: transfers disabled")]
    TransfersDisabled,
    #[msg("Policy violation: amount too big")]
    AmountTooBig,
    #[msg("Policy violation: lock out period")]
    LockOut,
}
