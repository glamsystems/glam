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
    #[msg("Asset cannot be swapped")]
    InvalidAssetForSwap,
    #[msg("Swap failed")]
    InvalidSwap,
}

#[error_code]
pub enum InvestorError {
    #[msg("Fund is not active")]
    FundNotActive,
    #[msg("Share class not allowed to subscribe")]
    InvalidShareClass,
    #[msg("Asset not allowed to subscribe")]
    InvalidAssetSubscribe,
    #[msg("Invalid oracle for asset price")]
    InvalidPricingOracle,
    #[msg("Invalid accounts: the transaction is malformed")]
    InvalidRemainingAccounts,
    #[msg("Invalid treasury ata")]
    InvalidTreasuryAccount,
    #[msg("Invalid signer ata")]
    InvalidSignerAccount,
    #[msg("Invalid asset price")]
    InvalidAssetPrice,
    #[msg("Subscription not allowed: invalid stable coin price")]
    InvalidStableCoinPriceForSubscribe,
}

#[error_code]
pub enum FundError {
    #[msg("No share class found")]
    NoShareClassInFund,
    #[msg("Share class not empty")]
    ShareClassNotEmpty,
    #[msg("Fund can't be closed. Close share classes first")]
    CantCloseShareClasses,
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
