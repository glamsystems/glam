use anchor_lang::prelude::*;

pub const MAX_ASSETS: usize = 5;
pub const MAX_SHARE_CLASSES: usize = 3;

#[account]
pub struct Fund {
    pub manager: Pubkey,
    pub treasury: Pubkey,
    pub assets_len: u8,
    pub assets: [Pubkey; MAX_ASSETS],
    pub assets_weights: [u32; MAX_ASSETS],
    pub share_classes_len: u8,
    pub share_classes: [Pubkey; 3],
    pub share_classes_bumps: [u8; 3],
    pub time_created: i64,
    pub bump_fund: u8,
    pub bump_treasury: u8,
    pub name: String, // max 30 chars
    pub is_active: bool,
}
impl Fund {
    pub const INIT_SIZE: usize =
        32 + 32 + 1 + (32 + 4) * MAX_ASSETS + 1 + (32 + 1) * MAX_SHARE_CLASSES + 8 + 2 + 30 + 1;
}
