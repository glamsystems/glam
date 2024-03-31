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

    // Manager

    pub fn initialize<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, InitializeFund<'info>>,
        fund_name: String,
        fund_uri: String,
        asset_weights: Vec<u32>,
        activate: bool,
        share_name: String,
        share_symbol: String,
        share_uri: String,
    ) -> Result<()> {
        manager::initialize_fund_handler(
            ctx,
            fund_name,
            fund_uri,
            asset_weights,
            activate,
            share_name,
            share_symbol,
            share_uri,
        )
    }
    pub fn update<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, UpdateFund<'info>>,
        name: Option<String>,
        uri: Option<String>,
        asset_weights: Option<Vec<u32>>,
        activate: Option<bool>,
    ) -> Result<()> {
        manager::update_fund_handler(ctx, name, uri, asset_weights, activate)
    }
    pub fn close(ctx: Context<CloseFund>) -> Result<()> {
        manager::close_handler(ctx)
    }

    // Investor

    pub fn subscribe<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, Subscribe<'info>>,
        amount: u64,
        skip_state: bool,
    ) -> Result<()> {
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

    // Drift

    pub fn drift_initialize(ctx: Context<DriftInitialize>, trader: Option<Pubkey>) -> Result<()> {
        drift::drift_initialize_handler(ctx, trader)
    }

    pub fn drift_update_delegated_trader(
        ctx: Context<DriftUpdate>,
        trader: Option<Pubkey>,
    ) -> Result<()> {
        drift::drift_update_delegated_trader_handler(ctx, trader)
    }

    pub fn drift_deposit<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftDeposit<'info>>,
        amount: u64,
    ) -> Result<()> {
        drift::drift_deposit_handler(ctx, amount)
    }

    pub fn drift_withdraw<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftWithdraw<'info>>,
        amount: u64,
    ) -> Result<()> {
        drift::drift_withdraw_handler(ctx, amount)
    }

    pub fn drift_close(ctx: Context<DriftClose>) -> Result<()> {
        drift::drift_close_handler(ctx)
    }
}
