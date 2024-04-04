use anchor_lang::prelude::*;

pub const MAX_ASSETS: usize = 5;
pub const MAX_SHARE_CLASSES: usize = 3;
pub const MAX_FUND_NAME: usize = 50;
pub const MAX_FUND_SYMBOL: usize = 20;
pub const MAX_FUND_URI: usize = 100;

#[account]
pub struct Fund {
    pub manager: Pubkey,  // 32
    pub treasury: Pubkey, // 32
    pub assets_len: u8,   // 1
    pub assets: [Pubkey; MAX_ASSETS],
    pub assets_weights: [u32; MAX_ASSETS], // (32 + 4) * MAX_ASSETS
    pub share_classes_len: u8,             // 1
    pub share_classes: [Pubkey; MAX_SHARE_CLASSES],
    pub share_classes_metadata: [ShareClassMetadata; MAX_SHARE_CLASSES],
    pub share_classes_bumps: [u8; MAX_SHARE_CLASSES], // (32 + 1) * MAX_SHARE_CLASSES
    pub time_created: i64,                            // 8
    pub bump_fund: u8,                                // 1
    pub bump_treasury: u8,                            // 1
    pub name: String,                                 // max MAX_FUND_NAME chars
    pub symbol: String,                               // max MAX_FUND_SYMBOL chars
    pub uri: String,                                  // max MAX_FUND_URI chars
    pub is_active: bool,                              // 1
}
impl Fund {
    pub const INIT_SIZE: usize = 32
        + 32
        + 1
        + (32 + 4) * MAX_ASSETS
        + 1
        + (32 + 1) * MAX_SHARE_CLASSES
        + 8
        + 1
        + 1
        + MAX_FUND_NAME
        + MAX_FUND_SYMBOL
        + MAX_FUND_URI
        + 1;
}

#[account]
pub struct Treasury {
    pub manager: Pubkey,
    pub fund: Pubkey,
    pub bump: u8,
}
impl Treasury {
    pub const INIT_SIZE: usize = 32 + 32 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ShareClassMetadata {
    pub name: String,                 // MAX_FUND_NAME
    pub symbol: String,               // MAX_FUND_SYMBOL
    pub uri: String,                  // MAX_FUND_URI
    pub share_class_asset: String,    // 20
    pub share_class_asset_id: Pubkey, // 32
    pub isin: String,                 // 20
    pub status: String,               // 20
    pub fee_management: i32,          // 4, 1_000_000 == 1%
    pub fee_performance: i32,         // 4, 1_000_000 == 1%
    pub policy_distribution: String,  // 20
    pub extension: String,            // 20
    pub launch_date: String,          // 20
    pub lifecycle: String,            // 20
    pub image_uri: String,            // 100
}
impl ShareClassMetadata {
    // use the same max sizes as Fund
    // more space needed for two reasons:
    // 1. we need to support additional metadata
    // 2. for each KV pair in metadata, keys ("name" etc) also take up space
    pub const INIT_SIZE: usize = MAX_FUND_NAME + MAX_FUND_SYMBOL + MAX_FUND_URI + 500;
}
