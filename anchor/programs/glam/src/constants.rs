use anchor_lang::prelude::*;
use solana_program::pubkey;

#[constant]
pub const SEED_STATE: &str = "state";
#[constant]
pub const SEED_VAULT: &str = "vault";
#[constant]
pub const SEED_METADATA: &str = "metadata";
#[constant]
pub const SEED_MINT: &str = "mint";

pub const DEFAULT_DRIFT_USER_NAME: [u8; 32] = [
    b'G', b'L', b'A', b'M', b' ', b'*', b'.', b'+', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
];

pub const MAX_ASSETS: usize = 100;
pub const MAX_MINTS: usize = 1;
pub const MAX_SIZE_SYMBOL: usize = 32;
pub const MAX_SIZE_NAME: usize = 64;
pub const MAX_SIZE_URI: usize = 128;

pub const WSOL: Pubkey = pubkey!("So11111111111111111111111111111111111111112");
pub const MSOL: Pubkey = pubkey!("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");
pub const SANCTUM_SINGLE_VALIDATOR: Pubkey = pubkey!("SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY");
pub const SANCTUM_MULTI_VALIDATOR: Pubkey = pubkey!("SPMBzsVUuoHA4Jm6KunbsotaahvVikZs1JyTW6iJvbn");
pub const POOL_MINT_OFFSET: usize = 162; // Offset of pool_mint in the StakePool struct
