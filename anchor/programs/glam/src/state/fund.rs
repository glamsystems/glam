use anchor_lang::prelude::*;

pub const MAX_ASSETS: usize = 5;
pub const MAX_SHARE_CLASSES: usize = 3;

#[account]
pub struct Fund {
    pub manager: Pubkey,  // 32
    pub treasury: Pubkey, // 32
    pub assets_len: u8,   // 1
    pub assets: [Pubkey; MAX_ASSETS],
    pub assets_weights: [u32; MAX_ASSETS], // (32 + 4) * MAX_ASSETS
    pub share_classes_len: u8,             // 1
    pub share_classes: [Pubkey; MAX_SHARE_CLASSES],
    pub share_classes_bumps: [u8; MAX_SHARE_CLASSES], // (32 + 1) * MAX_SHARE_CLASSES
    pub time_created: i64,                            // 8
    pub bump_fund: u8,                                // 1
    pub bump_treasury: u8,                            // 1
    pub name: String,                                 // max 30 chars
    pub symbol: String,                               // max 10 chars
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
        + 30
        + 10
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
