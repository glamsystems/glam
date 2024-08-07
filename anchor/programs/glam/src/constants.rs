use anchor_lang::prelude::*;
use solana_program::pubkey;

#[constant]
pub const SEED: &str = "anchor";

pub const MAX_ASSETS: usize = 5;
pub const MAX_SHARE_CLASSES: usize = 3;
pub const MAX_FUND_NAME: usize = 50;
pub const MAX_FUND_SYMBOL: usize = 20;
pub const MAX_FUND_URI: usize = 100;

pub const WSOL: Pubkey = pubkey!("So11111111111111111111111111111111111111112");
pub const SANCTUM_SINGLE_VALIDATOR: Pubkey = pubkey!("SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY");
pub const SANCTUM_MULTI_VALIDATOR: Pubkey = pubkey!("SPMBzsVUuoHA4Jm6KunbsotaahvVikZs1JyTW6iJvbn");
