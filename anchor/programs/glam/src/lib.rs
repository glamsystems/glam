pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;

declare_id!("Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc");

#[program]
pub mod glam {
    use super::*;

    pub fn initialize<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, InitializeFund<'info>>,
        name: String,
        asset_weights: Vec<u32>,
        activate: bool,
    ) -> Result<()> {
        manager::initialize_fund_handler(ctx, name, asset_weights, activate)
    }
    pub fn close(ctx: Context<CloseFund>) -> Result<()> {
        manager::close_handler(ctx)
    }

    pub fn subscribe(ctx: Context<Subscribe>, amount: u64, skip_state: bool) -> Result<()> {
        investor::subscribe_handler(ctx, amount, skip_state)
    }
    pub fn redeem<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, Redeem<'info>>,
        amount: u64,
        in_kind: bool,
        skip_state: bool,
    ) -> Result<()> {
        investor::redeem_handler(ctx, amount, in_kind, skip_state)
    }
}
