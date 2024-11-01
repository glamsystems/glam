pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

use crate::instructions::*;
pub use constants::*;
pub use state::model::*;

use ::drift::{MarketType, OrderParams, PositionDirection};

#[cfg(feature = "mainnet")]
declare_id!("GLAMpLuXu78TA4ao3DPZvT1zQ7woxoQ8ahdYbhnqY9mP");

#[cfg(not(feature = "mainnet"))]
declare_id!("Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc");

#[program]
pub mod glam {

    // use ::drift::{MarketType, OrderParams, PositionDirection};

    use super::*;

    //
    // Manager
    //

    pub fn initialize_fund<'c: 'info, 'info>(
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

    pub fn update_share_class(
        ctx: Context<UpdateShareClass>,
        share_class_id: u8,
        share_class_metadata: ShareClassModel,
    ) -> Result<()> {
        manager::update_share_class_handler(ctx, share_class_id, share_class_metadata)
    }

    pub fn update_fund<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, UpdateFund<'info>>,
        fund: FundModel,
    ) -> Result<()> {
        manager::update_fund_handler(ctx, fund)
    }

    pub fn close_fund(ctx: Context<CloseFund>) -> Result<()> {
        manager::close_handler(ctx)
    }

    pub fn close_share_class(ctx: Context<CloseShareClass>, share_class_id: u8) -> Result<()> {
        manager::close_share_class_handler(ctx, share_class_id)
    }

    //
    // Investor
    //

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

    //
    // Drift
    //

    pub fn drift_initialize(ctx: Context<DriftInitialize>) -> Result<()> {
        drift::drift_initialize_handler(ctx)
    }

    pub fn drift_update_user_custom_margin_ratio(
        ctx: Context<DriftUpdate>,
        sub_account_id: u16,
        margin_ratio: u32,
    ) -> Result<()> {
        drift::drift_update_user_custom_margin_ratio_handler(ctx, sub_account_id, margin_ratio)
    }

    pub fn drift_update_user_margin_trading_enabled(
        ctx: Context<DriftUpdate>,
        sub_account_id: u16,
        margin_trading_enabled: bool,
    ) -> Result<()> {
        drift::drift_update_user_margin_trading_enabled_handler(
            ctx,
            sub_account_id,
            margin_trading_enabled,
        )
    }

    pub fn drift_update_user_delegate(
        ctx: Context<DriftUpdate>,
        sub_account_id: u16,
        delegate: Pubkey,
    ) -> Result<()> {
        drift::drift_update_user_delegate_handler(ctx, sub_account_id, delegate)
    }

    pub fn drift_deposit<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftDeposit<'info>>,
        market_index: u16,
        amount: u64,
    ) -> Result<()> {
        drift::drift_deposit_handler(ctx, market_index, amount)
    }

    pub fn drift_withdraw<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftWithdraw<'info>>,
        market_index: u16,
        amount: u64,
    ) -> Result<()> {
        drift::drift_withdraw_handler(ctx, market_index, amount)
    }

    pub fn drift_delete_user(ctx: Context<DriftDeleteUser>, _sub_account_id: u16) -> Result<()> {
        drift::drift_delete_user_handler(ctx)
    }

    pub fn drift_place_orders<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftPlaceOrders<'info>>,
        order_params: Vec<OrderParams>,
    ) -> Result<()> {
        drift::drift_place_orders_handler(ctx, order_params)
    }

    pub fn drift_cancel_orders<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftCancelOrders<'info>>,
        market_type: Option<MarketType>,
        market_index: Option<u16>,
        direction: Option<PositionDirection>,
    ) -> Result<()> {
        drift::drift_cancel_orders_handler(ctx, market_type, market_index, direction)
    }

    //
    // Marinade
    //

    pub fn marinade_deposit_sol(ctx: Context<MarinadeDepositSol>, lamports: u64) -> Result<()> {
        marinade::marinade_deposit_sol(ctx, lamports)
    }

    pub fn marinade_deposit_stake(
        ctx: Context<MarinadeDepositStake>,
        validator_idx: u32,
    ) -> Result<()> {
        marinade::marinade_deposit_stake(ctx, validator_idx)
    }

    pub fn marinade_liquid_unstake(
        ctx: Context<MarinadeLiquidUnstake>,
        msol_amount: u64,
    ) -> Result<()> {
        marinade::marinade_liquid_unstake(ctx, msol_amount)
    }

    pub fn marinade_delayed_unstake(
        ctx: Context<MarinadeDelayedUnstake>,
        msol_amount: u64,
        ticket_id: String,
        bump: u8,
    ) -> Result<()> {
        marinade::marinade_delayed_unstake(ctx, msol_amount, ticket_id, bump)
    }

    pub fn marinade_claim_tickets<'info>(
        ctx: Context<'_, '_, '_, 'info, MarinadeClaimTickets<'info>>,
    ) -> Result<()> {
        marinade::marinade_claim_tickets(ctx)
    }

    //
    // Stake pool
    //

    pub fn stake_pool_deposit_sol(ctx: Context<StakePoolDepositSol>, lamports: u64) -> Result<()> {
        stake_pool::stake_pool_deposit_sol(ctx, lamports)
    }

    #[doc = "Deposit a stake account into the stake pool and receive pool token"]
    pub fn stake_pool_deposit_stake(ctx: Context<StakePoolDepositStake>) -> Result<()> {
        stake_pool::stake_pool_deposit_stake(ctx)
    }

    pub fn stake_pool_withdraw_sol(
        ctx: Context<StakePoolWithdrawSol>,
        pool_token_amount: u64,
    ) -> Result<()> {
        stake_pool::stake_pool_withdraw_sol(ctx, pool_token_amount)
    }

    pub fn stake_pool_withdraw_stake(
        ctx: Context<StakePoolWithdrawStake>,
        pool_token_amount: u64,
        stake_account_id: String,
        stake_account_bump: u8,
    ) -> Result<()> {
        stake_pool::stake_pool_withdraw_stake(
            ctx,
            pool_token_amount,
            stake_account_bump,
            stake_account_id,
        )
    }

    //
    // Native staking
    //

    pub fn initialize_and_delegate_stake<'info>(
        ctx: Context<'_, '_, '_, 'info, InitializeAndDelegateStake<'info>>,
        lamports: u64,
        stake_account_id: String,
        stake_account_bump: u8,
    ) -> Result<()> {
        stake::initialize_and_delegate_stake(ctx, lamports, stake_account_id, stake_account_bump)
    }

    pub fn deactivate_stake_accounts<'info>(
        ctx: Context<'_, '_, '_, 'info, DeactivateStakeAccounts<'info>>,
    ) -> Result<()> {
        stake::deactivate_stake_accounts(ctx)
    }

    pub fn withdraw_from_stake_accounts<'info>(
        ctx: Context<'_, '_, '_, 'info, WithdrawFromStakeAccounts<'info>>,
    ) -> Result<()> {
        stake::withdraw_from_stake_accounts(ctx)
    }

    pub fn merge_stake_accounts<'info>(
        ctx: Context<'_, '_, '_, 'info, MergeStakeAccounts<'info>>,
    ) -> Result<()> {
        stake::merge_stake_accounts(ctx)
    }

    pub fn split_stake_account<'info>(
        ctx: Context<'_, '_, '_, 'info, SplitStakeAccount<'info>>,
        lamports: u64,
        new_stake_account_id: String,
        new_stake_account_bump: u8,
    ) -> Result<()> {
        stake::split_stake_account(ctx, lamports, new_stake_account_id, new_stake_account_bump)
    }

    pub fn redelegate_stake<'info>(
        ctx: Context<'_, '_, '_, 'info, RedelegateStake<'info>>,
        new_stake_account_id: String,
        new_stake_account_bump: u8,
    ) -> Result<()> {
        stake::redelegate_stake(ctx, new_stake_account_id, new_stake_account_bump)
    }

    //
    // Jupiter
    //

    pub fn jupiter_swap<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, JupiterSwap<'info>>,
        amount: u64,
        data: Vec<u8>,
    ) -> Result<()> {
        jupiter::jupiter_swap(ctx, amount, data)
    }

    //
    // wSOL
    //

    pub fn wsol_wrap(ctx: Context<WSolWrap>, lamports: u64) -> Result<()> {
        wsol::wsol_wrap(ctx, lamports)
    }

    pub fn wsol_unwrap(ctx: Context<WSolUnwrap>) -> Result<()> {
        wsol::wsol_unwrap(ctx)
    }

    //
    // Policy Transfer Hook
    //
    #[interface(spl_transfer_hook_interface::execute)]
    pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        policy_hook::execute(ctx, amount)
    }
}
