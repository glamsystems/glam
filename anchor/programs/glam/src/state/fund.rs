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
    pub assets: Vec<Pubkey>,
    pub assets_weights: Vec<u32>,
    pub share_classes: Vec<Pubkey>,
    // pub share_classes_metadata: [ShareClassMetadata; MAX_SHARE_CLASSES],
    pub share_classes_bumps: Vec<u8>,
    pub time_created: i64, // 8
    pub bump_fund: u8,     // 1
    pub bump_treasury: u8, // 1
    pub name: String,      // max MAX_FUND_NAME chars
    pub symbol: String,    // max MAX_FUND_SYMBOL chars
    pub uri: String,       // max MAX_FUND_URI chars
    pub is_active: bool,   // 1
}
impl Fund {
    pub const INIT_SIZE: usize = 1024;

    pub fn init(
        &mut self,
        name: String,
        symbol: String,
        uri: String,
        manager: Pubkey,
        treasury: Pubkey,
        asset_mints: Vec<Pubkey>,
        asset_weights: Vec<u32>,
        bump_fund: u8,
        bump_treasury: u8,
        time_created: i64,
        activate: bool,
    ) {
        self.name = name;
        self.symbol = symbol;
        self.uri = uri;
        self.manager = manager;
        self.treasury = treasury;
        self.assets = asset_mints;
        self.assets_weights = asset_weights;
        self.bump_fund = bump_fund;
        self.bump_treasury = bump_treasury;
        self.time_created = time_created;
        self.is_active = activate;
    }
}

#[account]
pub struct Treasury {
    //
    //  we cannot carry any data with this treasury account, otherwise marinade staking will fail
    //
    //     pub manager: Pubkey,
    //     pub fund: Pubkey,
    //     pub bump: u8,
    // }
    // impl Treasury {
    //     pub const INIT_SIZE: usize = 32 + 32 + 1;
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
