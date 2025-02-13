pub mod constants;
pub mod error;
pub mod instructions;
pub mod security_txt;
pub mod state;
pub mod utils;

use crate::instructions::{state as glam_state, *};
use anchor_lang::prelude::*;

pub use constants::*;
pub use state::model::*;

use ::drift::{MarketType, OrderParams, PositionDirection};

#[cfg(feature = "mainnet")]
declare_id!("GLAMbTqav9N9witRjswJ8enwp9vv5G8bsSJ2kPJ4rcyc");

#[cfg(not(feature = "mainnet"))]
declare_id!("Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc");

#[program]
pub mod glam {

    use super::*;

    //////////////////////////////////////////////////////////////////////
    /// State
    //////////////////////////////////////////////////////////////////////

    /// Initializes a state account from the provided StateModel instance.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `fund`: An instance of `StateModel` containing the details of the state to be initialized.
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
    /// - `ctx`: The context for the transaction.
    /// - `fund`: An instance of `StateModel` containing the updated details of the state.
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
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
    /// - `amount`: The amount to withdraw.
    ///
    /// # Permission required
    /// - Owner only, delegates not allowed
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        glam_state::withdraw(ctx, amount)
    }

    //////////////////////////////////////////////////////////////////////
    /// Mint
    //////////////////////////////////////////////////////////////////////

    /// Adds a new mint.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
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

    //////////////////////////////////////////////////////////////////////
    /// Investor
    //////////////////////////////////////////////////////////////////////

    /// Subscribes to a specified amount of shares.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
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

    //////////////////////////////////////////////////////////////////////
    /// Drift
    //////////////////////////////////////////////////////////////////////

    /// Initializes a drift account owned by vault and creates a subaccount.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    ///
    /// # Permission required
    /// - Permission::DriftInitialize
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_initialize(ctx: Context<DriftInitialize>) -> Result<()> {
        drift::initialize_handler(ctx)
    }

    /// Updates custom margin ratio.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `sub_account_id`: Sub account.
    /// - `margin_ratio`: Margin ratio.
    ///
    /// # Permission required
    /// - Permission::DriftUpdateUser
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_update_user_custom_margin_ratio(
        ctx: Context<DriftUpdate>,
        sub_account_id: u16,
        margin_ratio: u32,
    ) -> Result<()> {
        drift::update_user_custom_margin_ratio_handler(ctx, sub_account_id, margin_ratio)
    }

    /// Enables/Disables margin trading.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `sub_account_id`: Sub account.
    /// - `margin_trading_enabled`: Whether to enable or disable margin trading.
    ///
    /// # Permission required
    /// - Permission::DriftUpdateUser
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_update_user_margin_trading_enabled(
        ctx: Context<DriftUpdate>,
        sub_account_id: u16,
        margin_trading_enabled: bool,
    ) -> Result<()> {
        drift::update_user_margin_trading_enabled_handler(
            ctx,
            sub_account_id,
            margin_trading_enabled,
        )
    }

    /// Sets a delegate on the specified sub account.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `sub_account_id`: Sub account.
    /// - `delegate`: Delegate's wallet address.
    ///
    /// # Permission required
    /// - Permission::DriftUpdateUser
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_update_user_delegate(
        ctx: Context<DriftUpdate>,
        sub_account_id: u16,
        delegate: Pubkey,
    ) -> Result<()> {
        drift::update_user_delegate_handler(ctx, sub_account_id, delegate)
    }

    /// Deposits to drift.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
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
    ) -> Result<()> {
        drift::deposit_handler(ctx, market_index, amount)
    }

    /// Withdraws from drift.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
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
    ) -> Result<()> {
        drift::withdraw_handler(ctx, market_index, amount)
    }

    /// Deletes a drift user (sub account).
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    ///
    /// # Permission required
    /// - Permission::DriftDeleteUser
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_delete_user(ctx: Context<DriftDeleteUser>) -> Result<()> {
        drift::delete_user_handler(ctx)
    }

    /// Places orders on drift.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `order_params`: A list of orders.
    ///
    /// # Permissions required
    /// - Permission::DriftPlaceOrders
    /// - Additional permission Permission::DriftSpotMarket or Permission::DriftPerpMarket is required depending on market type.
    ///
    /// # Integration required
    /// - Integration::Drift
    pub fn drift_place_orders<'c: 'info, 'info>(
        ctx: Context<'_, '_, 'c, 'info, DriftPlaceOrders<'info>>,
        order_params: Vec<OrderParams>,
    ) -> Result<()> {
        drift::place_orders_handler(ctx, order_params)
    }

    /// Cancels drift orders.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `market_type`:
    /// - `market_index`:
    /// - `direction`:
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
        drift::cancel_orders_handler(ctx, market_type, market_index, direction)
    }

    /// Cancels drift orders by order IDs.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
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
        drift::drift_cancel_orders_by_ids(ctx, order_ids)
    }

    //////////////////////////////////////////////////////////////////////
    /// Marinade
    //////////////////////////////////////////////////////////////////////

    /// Deposits SOL to get mSOL.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `lamports`: The amount of SOL to deposit.
    ///
    /// # Permission required
    /// - Permission::Stake
    ///
    /// # Integration required
    /// - Integration::Marinade
    pub fn marinade_deposit_sol(ctx: Context<MarinadeDepositSol>, lamports: u64) -> Result<()> {
        marinade::marinade_deposit_sol_handler(ctx, lamports)
    }

    /// Deposits a stake account to get mSOL.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `validator_idx`: Validator index.
    ///
    /// # Permission required
    /// - Permission::Stake
    ///
    /// # Integration required
    /// - Integration::Marinade
    pub fn marinade_deposit_stake(
        ctx: Context<MarinadeDepositStake>,
        validator_idx: u32,
    ) -> Result<()> {
        marinade::marinade_deposit_stake_handler(ctx, validator_idx)
    }

    /// Unstakes mSOL to get SOL immediately.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `msol_amount`: Amount of mSOL to unstake.
    ///
    /// # Permission required
    /// - Permission::LiquidUnstake
    ///
    /// # Integration required
    /// - Integration::Marinade
    pub fn marinade_liquid_unstake(
        ctx: Context<MarinadeLiquidUnstake>,
        msol_amount: u64,
    ) -> Result<()> {
        marinade::liquid_unstake_handler(ctx, msol_amount)
    }

    /// Unstakes mSOL to get a ticket that can be claimed at the next epoch.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `msol_amount`: Amount of mSOL to unstake.
    ///
    /// # Permission required
    /// - Permission::Unstake
    ///
    /// # Integration required
    /// - Integration::Marinade
    pub fn marinade_delayed_unstake(
        ctx: Context<MarinadeDelayedUnstake>,
        msol_amount: u64,
    ) -> Result<()> {
        marinade::delayed_unstake_handler(ctx, msol_amount)
    }

    /// Claims tickets that were unstaked in the previous epoch to get SOL.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    ///
    /// # Permission required
    /// - Permission::Unstake
    ///
    /// # Integration required
    /// - Integration::Marinade
    pub fn marinade_claim_tickets<'info>(
        ctx: Context<'_, '_, '_, 'info, MarinadeClaimTickets<'info>>,
    ) -> Result<()> {
        marinade::claim_tickets_handler(ctx)
    }

    //////////////////////////////////////////////////////////////////////
    // Stake pool
    //////////////////////////////////////////////////////////////////////

    /// Deposits SOL to a stake pool to get pool token.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
    /// - `pool_token_amount`: Amount of pool token to unstake.
    /// - `stake_account_id`: Stake account ID.
    /// - `stake_account_bump`: Stake account bump seed.
    ///
    /// # Permission required
    /// - Permission::Unstake
    ///
    /// # Integration required
    /// - Integration::SplStakePool or Integration::SanctumStakePool, depending on the stake pool program used.
    pub fn stake_pool_withdraw_stake(
        ctx: Context<StakePoolWithdrawStake>,
        pool_token_amount: u64,
        stake_account_id: String,
        stake_account_bump: u8,
    ) -> Result<()> {
        stake_pool::withdraw_stake_handler(
            ctx,
            pool_token_amount,
            stake_account_bump,
            stake_account_id,
        )
    }

    //////////////////////////////////////////////////////////////////////
    // Native staking
    //////////////////////////////////////////////////////////////////////

    /// Initializes a stake account and delegates it to a validator.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `lamports`: The amount of SOL to initialize the stake account with.
    /// - `stake_account_id`: The ID of the stake account to initialize.
    /// - `stake_account_bump`: The bump seed for the stake account.
    ///
    /// # Permission required
    /// - Permission::Stake
    ///
    /// # Integration required
    /// - Integration::NativeStaking
    pub fn initialize_and_delegate_stake<'info>(
        ctx: Context<'_, '_, '_, 'info, InitializeAndDelegateStake<'info>>,
        lamports: u64,
        stake_account_id: String,
        stake_account_bump: u8,
    ) -> Result<()> {
        stake::initialize_and_delegate_stake_handler(
            ctx,
            lamports,
            stake_account_id,
            stake_account_bump,
        )
    }

    /// Deactivates stake accounts.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
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
    /// - `ctx`: The context for the transaction.
    /// - `lamports`: The amount of SOL to split.
    /// - `new_stake_account_id`: The ID of the new stake account.
    /// - `new_stake_account_bump`: The bump seed for the new stake account.
    ///
    /// # Permission required
    /// - Permission::Unstake
    ///
    /// # Integration required
    /// - Integration::NativeStaking
    pub fn split_stake_account<'info>(
        ctx: Context<'_, '_, '_, 'info, SplitStakeAccount<'info>>,
        lamports: u64,
        new_stake_account_id: String,
        new_stake_account_bump: u8,
    ) -> Result<()> {
        stake::split_stake_account_handler(
            ctx,
            lamports,
            new_stake_account_id,
            new_stake_account_bump,
        )
    }

    /// Redelegates an existing stake account to a new validator (a new stake account will be created).
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `new_stake_account_id`: The ID of the new stake account.
    /// - `new_stake_account_bump`: The bump seed for the new stake account.
    ///
    /// # Permission required
    /// - Permission::Unstake
    ///
    /// # Integration required
    /// - Integration::NativeStaking
    pub fn redelegate_stake<'info>(
        ctx: Context<'_, '_, '_, 'info, RedelegateStake<'info>>,
        new_stake_account_id: String,
        new_stake_account_bump: u8,
    ) -> Result<()> {
        stake::redelegate_stake_handler(ctx, new_stake_account_id, new_stake_account_bump)
    }

    //////////////////////////////////////////////////////////////////////
    // Jupiter swap
    //////////////////////////////////////////////////////////////////////

    /// Swaps assets using Jupiter.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `amount`: The amount of asset to swap.
    /// - `data`: The data for the swap.
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

    //////////////////////////////////////////////////////////////////////
    // Jupiter vote
    //////////////////////////////////////////////////////////////////////

    /// Initializes a locked voter escrow.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    ///
    /// # Permission required
    /// - Permission::StakeJup
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn init_locked_voter_escrow<'info>(ctx: Context<InitLockedVoterEscrow>) -> Result<()> {
        jupiter::init_locked_voter_escrow_handler(ctx)
    }

    /// Toggles max lock.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `value`: The value to toggle.
    ///
    /// # Permission required
    /// - Permission::UnstakeJup
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn toggle_max_lock<'info>(ctx: Context<ToogleMaxLock>, value: bool) -> Result<()> {
        jupiter::toggle_max_lock_handler(ctx, value)
    }

    /// Increases the locked amount (aka stakes JUP).
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `amount`: The amount of JUP to stake.
    ///
    /// # Permission required
    /// - Permission::StakeJup
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn increase_locked_amount<'info>(
        ctx: Context<IncreaseLockedAmount>,
        amount: u64,
    ) -> Result<()> {
        jupiter::increase_locked_amount_handler(ctx, amount)
    }

    /// Partially unstakes JUP.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `amount`: The amount of JUP to partially unstake.
    /// - `memo`: The memo for the partial unstaking.
    ///
    /// # Permission required
    /// - Permission::UnstakeJup
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn open_partial_unstaking<'info>(
        ctx: Context<PartialUnstaking>,
        amount: u64,
        memo: String,
    ) -> Result<()> {
        jupiter::open_partial_unstaking_handler(ctx, amount, memo)
    }

    /// Merges partial unstaking.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    ///
    /// # Permission required
    /// - Permission::UnstakeJup
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn merge_partial_unstaking<'info>(ctx: Context<PartialUnstaking>) -> Result<()> {
        jupiter::merge_partial_unstaking_handler(ctx)
    }

    /// Withdraws JUP from partial unstaking.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    ///
    /// # Permission required
    /// - Permission::UnstakeJup
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn withdraw_partial_unstaking<'info>(ctx: Context<WithdrawPartialUnstaking>) -> Result<()> {
        jupiter::withdraw_partial_unstaking_handler(ctx)
    }

    /// Withdraws all unstaked JUP.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    ///
    /// # Permission required
    /// - Permission::UnstakeJup
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn withdraw_all_staked_jup<'info>(ctx: Context<WithdrawAllStakedJup>) -> Result<()> {
        jupiter::withdraw_all_staked_jup_handler(ctx)
    }

    /// Creates a new vote.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    ///
    /// # Permission required
    /// - Permission::VoteOnProposal
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn new_vote<'info>(ctx: Context<NewVote>) -> Result<()> {
        jupiter::new_vote_handler(ctx)
    }

    /// Casts a vote.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `side`: The side to vote for.
    ///
    /// # Permission required
    /// - Permission::VoteOnProposal
    ///
    /// # Integration required
    /// - Integration::JupiterVote
    pub fn cast_vote<'info>(ctx: Context<CastVote>, side: u8) -> Result<()> {
        jupiter::cast_vote_handler(ctx, side)
    }

    //////////////////////////////////////////////////////////////////////
    // wSOL
    //////////////////////////////////////////////////////////////////////

    /// Wraps SOL to get wSOL.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
    /// - `lamports`: The amount of SOL to wrap.
    ///
    /// # Permission required
    /// - Permission::WSolWrap
    pub fn wsol_wrap(ctx: Context<WSolWrap>, lamports: u64) -> Result<()> {
        wsol::wrap_handler(ctx, lamports)
    }

    /// Unwraps all wSOL to get SOL.
    ///
    /// # Parameters
    /// - `ctx`: The context for the transaction.
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
