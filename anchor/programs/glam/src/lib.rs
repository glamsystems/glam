pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

use crate::instructions::*;
pub use constants::*;
pub use state::model::*;

declare_id!("Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc");

#[program]
pub mod glam {

    use super::*;

    // Manager

    pub fn initialize<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, InitializeFund<'info>>,
        fund: FundModel,
    ) -> Result<()> {
        manager::initialize_fund_handler(ctx, fund)
    }

    pub fn add_share_class<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, AddShareClass<'info>>,
        share_class_metadata: ShareClassModel,
    ) -> Result<()> {
        manager::add_share_class_handler(ctx, share_class_metadata)
    }

    pub fn update<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, UpdateFund<'info>>,
        fund: FundModel,
    ) -> Result<()> {
        manager::update_fund_handler(ctx, fund)
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

    // Marinade
    pub fn marinade_deposit(ctx: Context<MarinadeDeposit>, sol_amount: u64) -> Result<()> {
        marinade::marinade_deposit(ctx, sol_amount)
    }

    pub fn marinade_liquid_unstake(
        ctx: Context<MarinadeLiquidUnstake>,
        sol_amount: u64,
    ) -> Result<()> {
        marinade::marinade_liquid_unstake(ctx, sol_amount)
    }

    pub fn marinade_delayed_unstake(
        ctx: Context<MarinadeDelayedUnstake>,
        amount: u64,
        bump: u8,
        ticket_id: String,
    ) -> Result<()> {
        marinade::marinade_delayed_unstake(ctx, amount, bump, ticket_id)
    }

    pub fn marinade_claim<'info>(
        ctx: Context<'_, '_, '_, 'info, MarinadeClaim<'info>>,
    ) -> Result<()> {
        marinade::marinade_claim(ctx)
    }

    // Stake pool program
    pub fn stake_pool_deposit(ctx: Context<StakePoolDeposit>, lamports: u64) -> Result<()> {
        stakepool::stake_pool_deposit(ctx, lamports)
    }

    pub fn stake_pool_withdraw(ctx: Context<StakePoolWithdraw>, lamports: u64) -> Result<()> {
        stakepool::stake_pool_withdraw(ctx, lamports)
    }

    // Jupiter
    pub fn jupiter_swap<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, JupiterSwap<'info>>,
        amount: u64,
        data: Vec<u8>,
    ) -> Result<()> {
        jupiter::jupiter_swap(ctx, amount, data)
    }

    // wSOL
    pub fn wsol_wrap(ctx: Context<WSolWrap>, amount: u64) -> Result<()> {
        wsol::wsol_wrap(ctx, amount)
    }

    pub fn wsol_unwrap(ctx: Context<WSolUnwrap>) -> Result<()> {
        wsol::wsol_unwrap(ctx)
    }
}
