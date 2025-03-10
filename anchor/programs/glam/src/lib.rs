pub mod constants;
pub mod cpi_autogen;
pub mod error;
pub mod instructions;
pub mod security_txt;
pub mod state;
pub mod utils;

use anchor_lang::prelude::*;
use cpi_autogen::{drift::*, jupiter_gov::*, jupiter_vote::*, kamino_lending::*, meteora_dlmm::*};
use instructions::{state as glam_state, *};

pub use constants::*;
pub use state::model::*;

use ::drift::{MarketType, ModifyOrderParams, OrderParams, PositionDirection};
use ::kamino_lending::InitObligationArgs;
use ::meteora_dlmm::LiquidityParameterByStrategy;

#[cfg(feature = "mainnet")]
declare_id!("GLAMbTqav9N9witRjswJ8enwp9vv5G8bsSJ2kPJ4rcyc");

#[cfg(not(feature = "mainnet"))]
declare_id!("Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc");

#[program]
pub mod glam {

    use super::*;

    /// Initializes a state account from the provided StateModel instance.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `state`: An instance of `StateModel` containing the details of the state to be initialized.
    ///
    /// # Permission required
    /// - Owner only, delegates not allowed
    pub fn initialize_state<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, InitializeState<'info>>,
        state: StateModel,
    ) -> Result<()> {
        glam_state::initialize_state_handler(ctx, state)
    }

    /// Updates an existing state account with new parameters.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `state`: An instance of `StateModel` containing the updated details of the state.
    ///
    /// # Permission required
    /// - Owner only, delegates not allowed
    pub fn update_state<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, UpdateState<'info>>,
        state: StateModel,
    ) -> Result<()> {
        glam_state::update_state_handler(ctx, state)
    }

    /// Closes a state account and releases its resources.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Owner only, delegates not allowed
    pub fn close_state(ctx: Context<CloseState>) -> Result<()> {
        glam_state::close_state_handler(ctx)
    }

    /// Enables or disables the subscribe and redeem functionality.
    ///
    /// This allows the owner to pause/unpause subscription and redemption of a fund.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `enabled`: A boolean indicating whether to enable or disable the subscribe and redeem functionality.
    ///
    /// # Permission required
    /// - Owner only, delegates not allowed
    pub fn set_subscribe_redeem_enabled(
        ctx: Context<SetSubscribeRedeemEnabled>,
        enabled: bool,
    ) -> Result<()> {
        glam_state::set_subscribe_redeem_enabled_handler(ctx, enabled)
    }

    /// Closes token accounts owned by the vault.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Owner only, delegates not allowed
    pub fn close_token_accounts<'info>(
        ctx: Context<'_, '_, '_, 'info, CloseTokenAccounts<'info>>,
    ) -> Result<()> {
        glam_state::close_token_accounts_handler(ctx)
    }

    /// Withdraw asset from vault into owner's wallet.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `amount`: The amount to withdraw.
    ///
    /// # Permission required
    /// - Owner only, delegates not allowed
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        glam_state::withdraw(ctx, amount)
    }

    /// Adds a new mint.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `mint_model`: An instance of `MintModel` containing the metadata for the new mint.
    ///
    /// # Permission required
    /// - Owner only, delegates not allowed
    pub fn add_mint<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, NewMint<'info>>,
        mint_model: MintModel,
    ) -> Result<()> {
        mint::add_mint_handler(ctx, mint_model)
    }

    /// Updates an existing mint with new metadata.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `mint_id`: The id of the mint to be updated.
    /// - `mint_model`: An instance of `MintModel` containing the updated metadata for the new mint.
    ///
    /// # Permission required
    /// - Owner only, delegates not allowed
    pub fn update_mint(ctx: Context<UpdateMint>, mint_id: u8, mint_model: MintModel) -> Result<()> {
        mint::update_mint_handler(ctx, mint_id, mint_model)
    }

    /// Closes a mint and releases its resources.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `mint_id`: The id of the mint to be closed.
    ///
    /// # Permission required
    /// - Owner only, delegates not allowed
    pub fn close_mint(ctx: Context<CloseMint>, mint_id: u8) -> Result<()> {
        mint::close_mint_handler(ctx, mint_id)
    }

    /// Mints a specified amount of tokens for the given mint.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `mint_id`: The id of the mint to mint tokens for.
    /// - `amount`: The amount of tokens to mint.
    ///
    /// # Permission required
    /// - Permission::MintTokens
    ///
    /// # Integration required
    /// - Integration::Mint
    pub fn mint_tokens<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, MintTokens<'info>>,
        mint_id: u8,
        amount: u64,
    ) -> Result<()> {
        mint::mint_tokens_handler(ctx, mint_id, amount)
    }

    /// Forcefully transfers a specified amount of tokens from one account to another.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `mint_id`: The id of the mint to transfer tokens for.
    /// - `amount`: The amount of tokens to transfer.
    ///
    /// # Permission required
    /// - Permission::ForceTransferTokens
    ///
    /// # Integration required
    /// - Integration::Mint
    pub fn force_transfer_tokens(
        ctx: Context<ForceTransferTokens>,
        mint_id: u8,
        amount: u64,
    ) -> Result<()> {
        mint::force_transfer_tokens_handler(ctx, mint_id, amount)
    }

    /// Burns a specified amount of tokens for the given mint.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `mint_id`: The id of the mint to burn tokens for.
    /// - `amount`: The amount of tokens to burn.
    ///
    /// # Permission required
    /// - Permission::BurnTokens
    ///
    /// # Integration required
    /// - Integration::Mint
    pub fn burn_tokens(ctx: Context<BurnTokens>, mint_id: u8, amount: u64) -> Result<()> {
        mint::burn_tokens_handler(ctx, mint_id, amount)
    }

    /// Sets the frozen state of the token accounts for the specified mint.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `mint_id`: The id of the mint to set the frozen state for.
    /// - `frozen`: The new frozen state.
    ///
    /// # Permission required
    /// - Permission::SetTokenAccountState
    ///
    /// # Integration required
    /// - Integration::Mint
    pub fn set_token_accounts_states<'info>(
        ctx: Context<'_, '_, 'info, 'info, SetTokenAccountsStates<'info>>,
        mint_id: u8,
        frozen: bool,
    ) -> Result<()> {
        mint::set_token_accounts_states_handler(ctx, mint_id, frozen)
    }

    /// Subscribes to a specified amount of shares.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `amount`: The amount of shares to subscribe.
    /// - `skip_state`: Should always be true (state check to be implemented).
    pub fn subscribe<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, Subscribe<'info>>,
        mint_id: u8,
        amount: u64,
        skip_state: bool,
    ) -> Result<()> {
        investor::subscribe_handler(ctx, mint_id, amount, skip_state)
    }

    /// Redeems a specified amount of shares.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `amount`: The amount of shares to redeem.
    /// - `in_kind`: Whether to redeem in kind.
    /// - `skip_state`: Should always be true (state check to be implemented).
    pub fn redeem<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, Redeem<'info>>,
        amount: u64,
        in_kind: bool,
        skip_state: bool,
    ) -> Result<()> {
        investor::redeem_handler(ctx, amount, in_kind, skip_state)
    }

    /// Initializes a drift account owned by vault and creates a subaccount.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Permission::DriftInitialize
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_initialize_user_stats(ctx: Context<DriftInitializeUserStats>) -> Result<()> {
        cpi_autogen::drift::drift_initialize_user_stats(ctx)
    }

    pub fn drift_initialize_user<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftInitializeUser<'info>>,
        sub_account_id: u16,
        name: [u8; 32],
    ) -> Result<()> {
        cpi_autogen::drift::drift_initialize_user(ctx, sub_account_id, name)
    }

    /// Updates custom margin ratio.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `sub_account_id`: Sub account.
    /// - `margin_ratio`: Margin ratio.
    ///
    /// # Permission required
    /// - Permission::DriftUpdateUser
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_update_user_custom_margin_ratio(
        ctx: Context<DriftUpdateUser>,
        sub_account_id: u16,
        margin_ratio: u32,
    ) -> Result<()> {
        cpi_autogen::drift::drift_update_user_custom_margin_ratio(ctx, sub_account_id, margin_ratio)
    }

    /// Enables/Disables margin trading.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `sub_account_id`: Sub account.
    /// - `margin_trading_enabled`: Whether to enable or disable margin trading.
    ///
    /// # Permission required
    /// - Permission::DriftUpdateUser
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_update_user_margin_trading_enabled(
        ctx: Context<DriftUpdateUser>,
        sub_account_id: u16,
        margin_trading_enabled: bool,
    ) -> Result<()> {
        cpi_autogen::drift::drift_update_user_margin_trading_enabled(
            ctx,
            sub_account_id,
            margin_trading_enabled,
        )
    }

    /// Sets a delegate on the specified sub account.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `sub_account_id`: Sub account.
    /// - `delegate`: Delegate's wallet address.
    ///
    /// # Permission required
    /// - Permission::DriftUpdateUser
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_update_user_delegate(
        ctx: Context<DriftUpdateUser>,
        sub_account_id: u16,
        delegate: Pubkey,
    ) -> Result<()> {
        cpi_autogen::drift::drift_update_user_delegate(ctx, sub_account_id, delegate)
    }

    /// Deposits to drift.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `market_index`: Index of the drift spot market.
    /// - `amount`: Amount of asset to deposit.
    ///
    /// # Permission required
    /// - Permission::DriftDeposit
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_deposit<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftDeposit<'info>>,
        market_index: u16,
        amount: u64,
        reduce_only: bool,
    ) -> Result<()> {
        cpi_autogen::drift::drift_deposit(ctx, market_index, amount, reduce_only)
    }

    /// Withdraws from drift.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `market_index`: Index of the drift spot market.
    /// - `amount`: Amount to withdraw.
    ///
    /// # Permission required
    /// - Permission::DriftWithdraw
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_withdraw<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftWithdraw<'info>>,
        market_index: u16,
        amount: u64,
        reduce_only: bool,
    ) -> Result<()> {
        cpi_autogen::drift::drift_withdraw(ctx, market_index, amount, reduce_only)
    }

    /// Deletes a drift user (sub account).
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Permission::DriftDeleteUser
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_delete_user(ctx: Context<DriftDeleteUser>) -> Result<()> {
        cpi_autogen::drift::drift_delete_user(ctx)
    }

    /// Places orders on drift.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `params`: A list of orders.
    ///
    /// # Permissions required
    /// - Permission::DriftPlaceOrders
    /// - Additional permission Permission::DriftSpotMarket or Permission::DriftPerpMarket is required depending on market type.
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_place_orders<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftPlaceOrders<'info>>,
        params: Vec<OrderParams>,
    ) -> Result<()> {
        drift::drift_place_orders(ctx, params)
    }

    /// Modifies an existing drift order.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `order_id`: The ID of the order to modify.
    /// - `modify_order_params`: The parameters to modify the order with.
    ///
    /// # Permission required
    /// - Permission::DriftModifyOrder
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_modify_order<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftModifyOrder<'info>>,
        order_id: Option<u32>,
        modify_order_params: ModifyOrderParams,
    ) -> Result<()> {
        cpi_autogen::drift::drift_modify_order(ctx, order_id, modify_order_params)
    }

    /// Cancels drift orders.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `market_type`: The type of market (spot or perp) to cancel orders for.
    /// - `market_index`: The index of the market to cancel orders for.
    /// - `direction`: The direction of orders to cancel (long or short).
    ///
    /// # Permission required
    /// - Permission::DriftCancelOrders
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_cancel_orders<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftCancelOrders<'info>>,
        market_type: Option<MarketType>,
        market_index: Option<u16>,
        direction: Option<PositionDirection>,
    ) -> Result<()> {
        cpi_autogen::drift::drift_cancel_orders(ctx, market_type, market_index, direction)
    }

    /// Cancels drift orders by order IDs.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `order_ids`: A list of order IDs.
    ///
    /// # Permission required
    /// - Permission::DriftCancelOrders
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_cancel_orders_by_ids<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftCancelOrders<'info>>,
        order_ids: Vec<u32>,
    ) -> Result<()> {
        cpi_autogen::drift::drift_cancel_orders_by_ids(ctx, order_ids)
    }

    /// Deposits SOL to get mSOL.
    ///
    /// # Parameters
    /// - `ctx`: The context containing the required accounts.
    /// - `lamports`: The amount of SOL (in lamports) to deposit.
    ///
    /// # Permission required
    /// - Permission::Stake
    ///
    /// # Integration required
    /// - Integration::Marinade
    pub fn marinade_deposit(ctx: Context<MarinadeDeposit>, lamports: u64) -> Result<()> {
        marinade::marinade_deposit(ctx, lamports)
    }

    /// Deposits a stake account to get mSOL.
    ///
    /// # Parameters
    /// - `ctx`: The context containing the required accounts.
    /// - `validator_idx`: Validator index in Marinade's validator list.
    ///
    /// # Permission required
    /// - Permission::Stake
    ///
    /// # Integration required
    /// - Integration::Marinade
    pub fn marinade_deposit_stake_account(
        ctx: Context<MarinadeDepositStakeAccount>,
        validator_idx: u32,
    ) -> Result<()> {
        marinade::marinade_deposit_stake_account(ctx, validator_idx)
    }

    /// Unstakes mSOL to get SOL immediately with a small fee.
    ///
    /// # Parameters
    /// - `ctx`: The context containing the required accounts.
    /// - `msol_amount`: Amount of mSOL to unstake.
    ///
    /// # Permission required
    /// - Permission::Unstake
    ///
    /// # Integration required
    /// - Integration::Marinade
    pub fn marinade_liquid_unstake(
        ctx: Context<MarinadeLiquidUnstake>,
        msol_amount: u64,
    ) -> Result<()> {
        marinade::marinade_liquid_unstake(ctx, msol_amount)
    }

    /// Unstakes mSOL to get a ticket that can be claimed at the next epoch.
    ///
    /// # Parameters
    /// - `ctx`: The context containing the required accounts.
    /// - `msol_amount`: Amount of mSOL to unstake.
    ///
    /// # Permission required
    /// - Permission::Unstake
    ///
    /// # Integration required
    /// - Integration::Marinade
    pub fn marinade_order_unstake(
        ctx: Context<MarinadeOrderUnstake>,
        msol_amount: u64,
    ) -> Result<()> {
        marinade::marinade_order_unstake(ctx, msol_amount)
    }

    /// Claims tickets that were unstaked in the previous epoch to get SOL.
    ///
    /// # Parameters
    /// - `ctx`: The context containing the required accounts.
    ///
    /// # Permission required
    /// - Permission::Unstake
    ///
    /// # Integration required
    /// - Integration::Marinade
    pub fn marinade_claim<'info>(
        ctx: Context<'_, '_, '_, 'info, MarinadeClaim<'info>>,
    ) -> Result<()> {
        marinade::marinade_claim(ctx)
    }

    /// Deposits SOL to a stake pool to get pool token.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `lamports`: The amount of SOL to deposit.
    ///
    /// # Permission required
    /// - Permission::Stake
    ///
    /// # Integration required
    /// - Integration::SplStakePool or Integration::SanctumStakePool, depending on the stake pool program used.
    pub fn stake_pool_deposit_sol(ctx: Context<StakePoolDepositSol>, lamports: u64) -> Result<()> {
        stake_pool::deposit_sol_handler(ctx, lamports)
    }

    /// Deposits a stake account to a stake pool to get pool token.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Permission::Stake
    ///
    /// # Integration required
    /// - Integration::SplStakePool or Integration::SanctumStakePool, depending on the stake pool program used.
    pub fn stake_pool_deposit_stake(ctx: Context<StakePoolDepositStake>) -> Result<()> {
        stake_pool::deposit_stake_handler(ctx)
    }

    /// Unstakes from pool token to get SOL immediately.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `pool_token_amount`: Amount of pool token to unstake.
    ///
    /// # Permission required
    /// - Permission::LiquidUnstake
    ///
    /// # Integration required
    /// - Integration::SplStakePool or Integration::SanctumStakePool, depending on the stake pool program used.
    pub fn stake_pool_withdraw_sol(
        ctx: Context<StakePoolWithdrawSol>,
        pool_token_amount: u64,
    ) -> Result<()> {
        stake_pool::withdraw_sol_handler(ctx, pool_token_amount)
    }

    /// Unstakes from pool token into a stake account.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `pool_token_amount`: Amount of pool token to unstake.
    ///
    /// # Permission required
    /// - Permission::Unstake
    ///
    /// # Integration required
    /// - Integration::SplStakePool or Integration::SanctumStakePool, depending on the stake pool program used.
    pub fn stake_pool_withdraw_stake(
        ctx: Context<StakePoolWithdrawStake>,
        pool_token_amount: u64,
    ) -> Result<()> {
        stake_pool::withdraw_stake_handler(ctx, pool_token_amount)
    }

    /// Initializes a stake account and delegates it to a validator.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `lamports`: The amount of SOL to initialize the stake account with.
    ///
    /// # Permission required
    /// - Permission::Stake
    ///
    /// # Integration required
    /// - Integration::NativeStaking
    pub fn initialize_and_delegate_stake<'info>(
        ctx: Context<'_, '_, '_, 'info, InitializeAndDelegateStake<'info>>,
        lamports: u64,
    ) -> Result<()> {
        stake::initialize_and_delegate_stake_handler(ctx, lamports)
    }

    /// Deactivates stake accounts.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Permission::Unstake
    ///
    /// # Integration required
    /// - Integration::NativeStaking
    pub fn deactivate_stake_accounts<'info>(
        ctx: Context<'_, '_, '_, 'info, DeactivateStakeAccounts<'info>>,
    ) -> Result<()> {
        stake::deactivate_stake_accounts_handler(ctx)
    }

    /// Withdraws SOL from stake accounts.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Permission::Unstake
    ///
    /// # Integration required
    /// - Integration::NativeStaking
    pub fn withdraw_from_stake_accounts<'info>(
        ctx: Context<'_, '_, '_, 'info, WithdrawFromStakeAccounts<'info>>,
    ) -> Result<()> {
        stake::withdraw_from_stake_accounts_handler(ctx)
    }

    /// Merges two stake accounts.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Permission::Stake
    ///
    /// # Integration required
    /// - Integration::NativeStaking
    pub fn merge_stake_accounts<'info>(
        ctx: Context<'_, '_, '_, 'info, MergeStakeAccounts<'info>>,
    ) -> Result<()> {
        stake::merge_stake_accounts_handler(ctx)
    }

    /// Splits from an existing stake account to get a new stake account.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `lamports`: The amount of SOL to split.
    ///
    /// # Permission required
    /// - Permission::Unstake
    ///
    /// # Integration required
    /// - Integration::NativeStaking
    pub fn split_stake_account<'info>(
        ctx: Context<'_, '_, '_, 'info, SplitStakeAccount<'info>>,
        lamports: u64,
    ) -> Result<()> {
        stake::split_stake_account_handler(ctx, lamports)
    }

    /// Redelegates an existing stake account to a new validator (a new stake account will be created).
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Permission::Unstake
    ///
    /// # Integration required
    /// - Integration::NativeStaking
    pub fn redelegate_stake<'info>(
        ctx: Context<'_, '_, '_, 'info, RedelegateStake<'info>>,
    ) -> Result<()> {
        stake::redelegate_stake_handler(ctx)
    }

    /// Swaps assets using Jupiter.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `amount`: The amount of input asset to swap.
    /// - `data`: The serialized Jupiter route data containing swap instructions and parameters.
    ///
    /// # Permission required
    /// - Any of
    ///   - Permission::JupiterSwapAny: no restrictions.
    ///   - Permission::JupiterSwapAllowlisted: input and output are in the assets allowlist.
    ///   - Permission::JupiterSwapLst: input and output assets are both LST.
    ///
    /// # Integration required
    /// - Integration::JupiterSwap
    pub fn jupiter_swap<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, JupiterSwap<'info>>,
        amount: u64,
        data: Vec<u8>,
    ) -> Result<()> {
        jupiter::swap_handler(ctx, amount, data)
    }

    /// Sets the max swap slippage.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `slippage`: The maximum allowed slippage in basis points.
    ///
    /// # Permission required
    /// - Owner only, delegates not allowed
    pub fn jupiter_set_max_swap_slippage(
        ctx: Context<JupiterSetMaxSwapSlippage>,
        slippage: u64,
    ) -> Result<()> {
        jupiter::set_max_swap_slippage_handler(ctx, slippage)
    }

    /// Initializes a locked voter escrow.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Permission::StakeJup
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn jupiter_vote_new_escrow<'info>(ctx: Context<JupiterVoteNewEscrow>) -> Result<()> {
        cpi_autogen::jupiter_vote::jupiter_vote_new_escrow(ctx)
    }

    /// Toggles max lock.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `is_max_lock`: true to allow staking, false to initiate full unstaking.
    ///
    /// # Permission required
    /// - Permission::StakeJup (if is_max_lock == true)
    /// - Permission::UnstakeJup (if is_max_lock == false)
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn jupiter_vote_toggle_max_lock<'info>(
        ctx: Context<JupiterVoteToggleMaxLock>,
        is_max_lock: bool,
    ) -> Result<()> {
        jupiter_vote::jupiter_vote_toggle_max_lock(ctx, is_max_lock)
    }

    /// Increases the locked amount (aka stakes JUP).
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `amount`: The amount of JUP to stake.
    ///
    /// # Permission required
    /// - Permission::StakeJup
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn jupiter_vote_increase_locked_amount<'info>(
        ctx: Context<JupiterVoteIncreaseLockedAmount>,
        amount: u64,
    ) -> Result<()> {
        cpi_autogen::jupiter_vote::jupiter_vote_increase_locked_amount(ctx, amount)
    }

    /// Partially unstakes JUP.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `amount`: The amount of JUP to partially unstake.
    /// - `memo`: The memo for the partial unstaking.
    ///
    /// # Permission required
    /// - Permission::UnstakeJup
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn jupiter_vote_open_partial_unstaking<'info>(
        ctx: Context<JupiterVoteOpenPartialUnstaking>,
        amount: u64,
        memo: String,
    ) -> Result<()> {
        cpi_autogen::jupiter_vote::jupiter_vote_open_partial_unstaking(ctx, amount, memo)
    }

    /// Merges partial unstaking.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Permission::UnstakeJup
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn jupiter_vote_merge_partial_unstaking<'info>(
        ctx: Context<JupiterVoteMergePartialUnstaking>,
    ) -> Result<()> {
        cpi_autogen::jupiter_vote::jupiter_vote_merge_partial_unstaking(ctx)
    }

    /// Withdraws JUP from partial unstaking.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Permission::UnstakeJup
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn jupiter_vote_withdraw_partial_unstaking<'info>(
        ctx: Context<JupiterVoteWithdrawPartialUnstaking>,
    ) -> Result<()> {
        cpi_autogen::jupiter_vote::jupiter_vote_withdraw_partial_unstaking(ctx)
    }

    /// Withdraws all unstaked JUP.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Permission::UnstakeJup
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn jupiter_vote_withdraw<'info>(ctx: Context<JupiterVoteWithdraw>) -> Result<()> {
        cpi_autogen::jupiter_vote::jupiter_vote_withdraw(ctx)
    }

    /// Creates a new vote.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Permission::VoteOnProposal
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn jupiter_gov_new_vote<'info>(
        ctx: Context<JupiterGovNewVote>,
        voter: Pubkey,
    ) -> Result<()> {
        cpi_autogen::jupiter_gov::jupiter_gov_new_vote(ctx, voter)
    }

    /// Casts a vote.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `side`: The side to vote for.
    ///
    /// # Permission required
    /// - Permission::VoteOnProposal
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn jupiter_vote_cast_vote<'info>(
        ctx: Context<JupiterVoteCastVote>,
        side: u8,
    ) -> Result<()> {
        cpi_autogen::jupiter_vote::jupiter_vote_cast_vote(ctx, side)
    }

    /// Casts a vote, only if expected_side is already recorded.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `side`: The side to vote for.
    /// - `expected_side`: The expected side to check in the Vote account.
    ///
    /// # Permission required
    /// - Permission::VoteOnProposal
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn jupiter_vote_cast_vote_checked<'info>(
        ctx: Context<JupiterVoteCastVote>,
        side: u8,
        expected_side: u8,
    ) -> Result<()> {
        jupiter_vote::jupiter_vote_cast_vote_checked(ctx, side, expected_side)
    }

    pub fn kamino_lending_init_user_metadata<'info>(
        ctx: Context<KaminoLendingInitUserMetadata>,
        user_lookup_table: Pubkey,
    ) -> Result<()> {
        cpi_autogen::kamino_lending::kamino_lending_init_user_metadata(ctx, user_lookup_table)
    }

    pub fn kamino_lending_init_obligation<'info>(
        ctx: Context<KaminoLendingInitObligation>,
        args: InitObligationArgs,
    ) -> Result<()> {
        cpi_autogen::kamino_lending::kamino_lending_init_obligation(ctx, args)
    }

    pub fn kamino_lending_init_obligation_farms_for_reserve<'info>(
        ctx: Context<KaminoLendingInitObligationFarmsForReserve>,
        mode: u8,
    ) -> Result<()> {
        cpi_autogen::kamino_lending::kamino_lending_init_obligation_farms_for_reserve(ctx, mode)
    }

    pub fn kamino_lending_deposit_reserve_liquidity_and_obligation_collateral<'info>(
        ctx: Context<KaminoLendingDepositReserveLiquidityAndObligationCollateral>,
        liquidity_amount: u64,
    ) -> Result<()> {
        cpi_autogen::kamino_lending::kamino_lending_deposit_reserve_liquidity_and_obligation_collateral(ctx, liquidity_amount)
    }

    pub fn meteora_dlmm_initialize_position<'info>(
        ctx: Context<MeteoraDlmmInitializePosition>,
        lower_bin_id: i32,
        width: i32,
    ) -> Result<()> {
        cpi_autogen::meteora_dlmm::meteora_dlmm_initialize_position(ctx, lower_bin_id, width)
    }

    pub fn meteora_dlmm_close_position<'info>(
        ctx: Context<MeteoraDlmmClosePosition>,
    ) -> Result<()> {
        cpi_autogen::meteora_dlmm::meteora_dlmm_close_position(ctx)
    }

    pub fn meteora_dlmm_claim_fee<'info>(ctx: Context<MeteoraDlmmClaimFee>) -> Result<()> {
        cpi_autogen::meteora_dlmm::meteora_dlmm_claim_fee(ctx)
    }

    pub fn meteora_dlmm_add_liquidity_by_strategy<'info>(
        ctx: Context<MeteoraDlmmAddLiquidityByStrategy>,
        params: LiquidityParameterByStrategy,
    ) -> Result<()> {
        cpi_autogen::meteora_dlmm::meteora_dlmm_add_liquidity_by_strategy(ctx, params)
    }

    pub fn meteora_dlmm_remove_liquidity_by_range<'info>(
        ctx: Context<MeteoraDlmmRemoveLiquidityByRange>,
        from_bin_id: i32,
        to_bin_id: i32,
        bps_to_remove: u16,
    ) -> Result<()> {
        cpi_autogen::meteora_dlmm::meteora_dlmm_remove_liquidity_by_range(
            ctx,
            from_bin_id,
            to_bin_id,
            bps_to_remove,
        )
    }

    pub fn meteora_dlmm_swap<'info>(
        ctx: Context<MeteoraDlmmSwap>,
        amount_in: u64,
        min_amount_out: u64,
    ) -> Result<()> {
        cpi_autogen::meteora_dlmm::meteora_dlmm_swap(ctx, amount_in, min_amount_out)
    }

    /// Wraps SOL to get wSOL.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `lamports`: The amount of SOL to wrap.
    ///
    /// # Permission required
    /// - Permission::WSolWrap
    pub fn wsol_wrap(ctx: Context<WSolWrap>, lamports: u64) -> Result<()> {
        wsol::wrap_handler(ctx, lamports)
    }

    /// Transfer vault SOL to wSOL token account.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    /// - `lamports`: The amount of SOL to transfer.
    ///
    /// # Permission required
    /// - Permission::WSolWrap
    pub fn transfer_sol_to_wsol(ctx: Context<SolToWSol>, lamports: u64) -> Result<()> {
        wsol::sol_to_wsol_handler(ctx, lamports)
    }

    /// Unwraps all wSOL to get SOL.
    ///
    /// # Parameters
    /// - `ctx`: The context for the instruction.
    ///
    /// # Permission required
    /// - Permission::WSolUnwrap
    pub fn wsol_unwrap(ctx: Context<WSolUnwrap>) -> Result<()> {
        wsol::unwrap_handler(ctx)
    }

    //
    // Policy Transfer Hook
    //
    #[interface(spl_transfer_hook_interface::execute)]
    pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        policy_hook::execute(ctx, amount)
    }
}
