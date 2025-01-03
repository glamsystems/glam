use anchor_lang::prelude::*;

#[error_code]
pub enum AccessError {
    #[msg("Signer is not authorized")]
    NotAuthorized,
    #[msg("Integration is disabled")]
    IntegrationDisabled,
}

#[error_code]
pub enum ManagerError {
    #[msg("Error closing account: not empty")]
    CloseNotEmptyError,
    #[msg("Invalid fund name: max 50 chars")]
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
pub enum SwapError {
    #[msg("Asset cannot be swapped")]
    InvalidAssetForSwap,
    #[msg("Swap failed")]
    InvalidSwap,
}

#[error_code]
pub enum InvestorError {
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
    #[msg("Fund is disabled for subscription and redemption")]
    SubscribeRedeemDisable,
    #[msg("Policy account is mandatory")]
    InvalidPolicyAccount,
    #[msg("Price is too old")]
    PriceTooOld,
}

#[error_code]
pub enum FundError {
    #[msg("Fund is not active")]
    FundNotActive,
    #[msg("No share class found")]
    NoShareClassInFund,
    #[msg("Fund can't be closed. Close share classes first")]
    CantCloseShareClasses,
    #[msg("Withdraw denied. Only vaults allow withdraws (funds and mints don't).")]
    WithdrawDenied,
}

#[error_code]
pub enum ShareClassError {
    #[msg("Share class mint supply not zero")]
    ShareClassNotEmpty,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
}

#[error_code]
pub enum PolicyError {
    #[msg("Policy violation: transfers disabled")]
    TransfersDisabled,
    #[msg("Policy violation: amount too big")]
    AmountTooBig,
    #[msg("Policy violation: lock-up period")]
    LockUp,
}
