use anchor_lang::prelude::*;

#[error_code]
pub enum GlamError {
    // Access control errors (42000-)
    #[msg("Signer is not authorized")]
    NotAuthorized = 42000,

    #[msg("Integration is disabled")]
    IntegrationDisabled,

    #[msg("State account is disabled")]
    StateAccountDisabled,

    #[msg("Invalid signer ata")]
    InvalidSignerAccount,

    // State & mint errors (43000-)
    #[msg("Invalid account type")]
    InvalidAccountType = 43000,

    #[msg("Name too long: max 64 chars")]
    InvalidName,

    #[msg("Symbol too long: max 32 chars")]
    InvalidSymbol,

    #[msg("Uri too long: max 128 chars")]
    InvalidUri,

    #[msg("Too many assets: max 100")]
    InvalidAssetsLen,

    #[msg("Error closing state account: not empty")]
    CloseNotEmptyError,

    #[msg("No share class found")]
    NoShareClass,

    #[msg("Glam state account can't be closed. Close share classes first")]
    ShareClassesNotClosed,

    #[msg("Share class not allowed to subscribe")]
    InvalidShareClass,

    #[msg("Asset not allowed to subscribe")]
    InvalidAssetSubscribe,

    #[msg("Invalid oracle for asset price")]
    InvalidPricingOracle,

    #[msg("Invalid accounts: the transaction is malformed")]
    InvalidRemainingAccounts,

    #[msg("Invalid vault ata")]
    InvalidVaultTokenAccount,

    #[msg("Share class mint supply not zero")]
    ShareClassNotEmpty,

    // Vault errors (44000-)
    #[msg("Withdraw denied. Only vaults allow withdraws (funds and mints don't)")]
    WithdrawDenied = 44000,

    #[msg("Asset cannot be swapped")]
    InvalidAssetForSwap,

    #[msg("Swap failed")]
    InvalidSwap,

    #[msg("Invalid token account")]
    InvalidTokenAccount,

    // Subscription & redemption errors (45000-)
    #[msg("Invalid asset price")]
    InvalidAssetPrice = 45000,

    #[msg("Subscription not allowed: invalid stable coin price")]
    InvalidStableCoinPriceForSubscribe,

    #[msg("Fund is disabled for subscription and redemption")]
    SubscribeRedeemDisable,

    #[msg("Policy account is mandatory")]
    InvalidPolicyAccount,

    #[msg("Price is too old")]
    PriceTooOld,

    // Transfer hook errors (46000-)
    #[msg("Policy violation: transfers disabled")]
    TransfersDisabled = 46000,

    #[msg("Policy violation: amount too big")]
    AmountTooBig,

    #[msg("Policy violation: lock-up period")]
    LockUp,
}
