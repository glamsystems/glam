use anchor_lang::prelude::*;
use solana_program::pubkey;

#[constant]
pub const SEED_STATE: &str = "fund";
#[constant]
pub const SEED_VAULT: &str = "treasury";
#[constant]
pub const SEED_METADATA: &str = "openfunds";
#[constant]
pub const SEED_MINT: &str = "share";

pub const DEFAULT_DRIFT_USER_NAME: [u8; 32] = [
    b'G', b'L', b'A', b'M', b' ', b'*', b'.', b'+', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
];

pub const MAX_ASSETS: usize = 5;
pub const MAX_SHARE_CLASSES: usize = 3;
pub const MAX_SIZE_NAME: usize = 50;
pub const MAX_SIZE_SYMBOL: usize = 20;
pub const MAX_SIZE_URI: usize = 100;

pub const WSOL: Pubkey = pubkey!("So11111111111111111111111111111111111111112");
pub const MSOL: Pubkey = pubkey!("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");
pub const SANCTUM_SINGLE_VALIDATOR: Pubkey = pubkey!("SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY");
pub const SANCTUM_MULTI_VALIDATOR: Pubkey = pubkey!("SPMBzsVUuoHA4Jm6KunbsotaahvVikZs1JyTW6iJvbn");
pub const POOL_MINT_OFFSET: usize = 162; // Offset of pool_mint in the StakePool struct
