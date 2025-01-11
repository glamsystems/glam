use anchor_lang::prelude::*;

#[error_code]
pub enum AccessError {
    #[msg("Signer is not authorized")]
    NotAuthorized,

    #[msg("Integration is disabled")]
    IntegrationDisabled,
}

#[error_code]
pub enum StateError {
    #[msg("Name too long: max 50 chars")]
    InvalidName,

    #[msg("Symbol too long: max 50 chars")]
    InvalidSymbol,

    #[msg("Uri too long: max 20")]
    InvalidUri,

    #[msg("Too many assets: max 100")]
    InvalidAssetsLen,

    #[msg("State account is disabled")]
    Disabled,

    #[msg("No share class found")]
    NoShareClass,

    #[msg("Glam state account can't be closed. Close share classes first")]
    ShareClassesNotClosed,

    #[msg("Error closing state account: not empty")]
    CloseNotEmptyError,

    #[msg("Withdraw denied. Only vaults allow withdraws (funds and mints don't)")]
    WithdrawDenied,
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
