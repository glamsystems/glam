use anchor_lang::declare_id;
declare_id!("SLendK7ySfcEzyaFqy93gDnD3RtrpXJcnRwb6zFHJSh");
use anchor_lang::prelude::*;
pub mod typedefs {
    #![doc = r" User-defined types."]
    use super::*;
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Copy)]
    pub enum UpdateConfigMode {
        UpdateLoanToValuePct,
        UpdateMaxLiquidationBonusBps,
        UpdateLiquidationThresholdPct,
        UpdateProtocolLiquidationFee,
        UpdateProtocolTakeRate,
        UpdateFeesBorrowFee,
        UpdateFeesFlashLoanFee,
        UpdateFeesReferralFeeBps,
        UpdateDepositLimit,
        UpdateBorrowLimit,
        UpdateTokenInfoLowerHeuristic,
        UpdateTokenInfoUpperHeuristic,
        UpdateTokenInfoExpHeuristic,
        UpdateTokenInfoTwapDivergence,
        UpdateTokenInfoScopeTwap,
        UpdateTokenInfoScopeChain,
        UpdateTokenInfoName,
        UpdateTokenInfoPriceMaxAge,
        UpdateTokenInfoTwapMaxAge,
        UpdateScopePriceFeed,
        UpdatePythPrice,
        UpdateSwitchboardFeed,
        UpdateSwitchboardTwapFeed,
        UpdateBorrowRateCurve,
        UpdateEntireReserveConfig,
        UpdateDebtWithdrawalCap,
        UpdateDepositWithdrawalCap,
        UpdateDebtWithdrawalCapCurrentTotal,
        UpdateDepositWithdrawalCapCurrentTotal,
        UpdateBadDebtLiquidationBonusBps,
        UpdateMinLiquidationBonusBps,
        DeleveragingMarginCallPeriod,
        UpdateBorrowFactor,
        UpdateAssetTier,
        UpdateElevationGroup,
        DeleveragingThresholdSlotsPerBps,
        DeprecatedUpdateMultiplierSideBoost,
        DeprecatedUpdateMultiplierTagBoost,
        UpdateReserveStatus,
        UpdateFarmCollateral,
        UpdateFarmDebt,
        UpdateDisableUsageAsCollateralOutsideEmode,
        UpdateBlockBorrowingAboveUtilizationPct,
        UpdateBlockPriceUsage,
        UpdateBorrowLimitOutsideElevationGroup,
        UpdateBorrowLimitsInElevationGroupAgainstThisReserve,
        UpdateHostFixedInterestRateBps,
    }
    impl Default for UpdateConfigMode {
        fn default() -> Self {
            Self::UpdateLoanToValuePct
        }
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Copy)]
    pub enum UpdateLendingMarketConfigValue {
        Bool,
        U8,
        U8Array,
        U16,
        U64,
        U128,
        Pubkey,
        ElevationGroup,
        Name,
    }
    impl Default for UpdateLendingMarketConfigValue {
        fn default() -> Self {
            Self::Bool
        }
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Copy)]
    pub enum UpdateLendingMarketMode {
        UpdateOwner,
        UpdateEmergencyMode,
        UpdateLiquidationCloseFactor,
        UpdateLiquidationMaxValue,
        DeprecatedUpdateGlobalUnhealthyBorrow,
        UpdateGlobalAllowedBorrow,
        UpdateRiskCouncil,
        UpdateMinFullLiquidationThreshold,
        UpdateInsolvencyRiskLtv,
        UpdateElevationGroup,
        UpdateReferralFeeBps,
        DeprecatedUpdateMultiplierPoints,
        UpdatePriceRefreshTriggerToMaxAgePct,
        UpdateAutodeleverageEnabled,
        UpdateBorrowingDisabled,
        UpdateMinNetValueObligationPostAction,
        UpdateMinValueLtvSkipPriorityLiqCheck,
        UpdateMinValueBfSkipPriorityLiqCheck,
        UpdatePaddingFields,
        UpdateName,
    }
    impl Default for UpdateLendingMarketMode {
        fn default() -> Self {
            Self::UpdateOwner
        }
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct LastUpdate {
        pub slot: u64,
        pub stale: u8,
        pub price_status: u8,
        pub placeholder: [u8; 6],
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct ElevationGroup {
        pub max_liquidation_bonus_bps: u16,
        pub id: u8,
        pub ltv_pct: u8,
        pub liquidation_threshold_pct: u8,
        pub allow_new_loans: u8,
        pub max_reserves_as_collateral: u8,
        pub padding0: u8,
        pub debt_reserve: Pubkey,
        pub padding1: [u64; 4],
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct InitObligationArgs {
        pub tag: u8,
        pub id: u8,
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct ObligationCollateral {
        pub deposit_reserve: Pubkey,
        pub deposited_amount: u64,
        pub market_value_sf: u128,
        pub borrowed_amount_against_this_collateral_in_elevation_group: u64,
        pub padding: [u64; 9],
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct ObligationLiquidity {
        pub borrow_reserve: Pubkey,
        pub cumulative_borrow_rate_bsf: BigFractionBytes,
        pub padding: u64,
        pub borrowed_amount_sf: u128,
        pub market_value_sf: u128,
        pub borrow_factor_adjusted_market_value_sf: u128,
        pub borrowed_amount_outside_elevation_groups: u64,
        pub padding2: [u64; 7],
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Copy)]
    pub enum AssetTier {
        Regular,
        IsolatedCollateral,
        IsolatedDebt,
    }
    impl Default for AssetTier {
        fn default() -> Self {
            Self::Regular
        }
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct BigFractionBytes {
        pub value: [u64; 4],
        pub padding: [u64; 2],
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Copy)]
    pub enum FeeCalculation {
        Exclusive,
        Inclusive,
    }
    impl Default for FeeCalculation {
        fn default() -> Self {
            Self::Exclusive
        }
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct ReserveCollateral {
        pub mint_pubkey: Pubkey,
        pub mint_total_supply: u64,
        pub supply_vault: Pubkey,
        pub padding1: [u128; 32],
        pub padding2: [u128; 32],
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct ReserveConfig {
        pub status: u8,
        pub asset_tier: u8,
        pub host_fixed_interest_rate_bps: u16,
        pub reserved2: [u8; 2],
        pub reserved3: [u8; 8],
        pub protocol_take_rate_pct: u8,
        pub protocol_liquidation_fee_pct: u8,
        pub loan_to_value_pct: u8,
        pub liquidation_threshold_pct: u8,
        pub min_liquidation_bonus_bps: u16,
        pub max_liquidation_bonus_bps: u16,
        pub bad_debt_liquidation_bonus_bps: u16,
        pub deleveraging_margin_call_period_secs: u64,
        pub deleveraging_threshold_slots_per_bps: u64,
        pub fees: ReserveFees,
        pub borrow_rate_curve: BorrowRateCurve,
        pub borrow_factor_pct: u64,
        pub deposit_limit: u64,
        pub borrow_limit: u64,
        pub token_info: TokenInfo,
        pub deposit_withdrawal_cap: WithdrawalCaps,
        pub debt_withdrawal_cap: WithdrawalCaps,
        pub elevation_groups: [u8; 20],
        pub disable_usage_as_coll_outside_emode: u8,
        pub utilization_limit_block_borrowing_above_pct: u8,
        pub reserved1: [u8; 2],
        pub borrow_limit_outside_elevation_group: u64,
        pub borrow_limit_against_this_collateral_in_elevation_group: [u64; 32],
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Copy)]
    pub enum ReserveFarmKind {
        Collateral,
        Debt,
    }
    impl Default for ReserveFarmKind {
        fn default() -> Self {
            Self::Collateral
        }
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct ReserveFees {
        pub borrow_fee_sf: u64,
        pub flash_loan_fee_sf: u64,
        pub padding: [u8; 8],
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
    pub struct ReserveLiquidity {
        pub mint_pubkey: Pubkey,
        pub supply_vault: Pubkey,
        pub fee_vault: Pubkey,
        pub available_amount: u64,
        pub borrowed_amount_sf: u128,
        pub market_price_sf: u128,
        pub market_price_last_updated_ts: u64,
        pub mint_decimals: u64,
        pub deposit_limit_crossed_slot: u64,
        pub borrow_limit_crossed_slot: u64,
        pub cumulative_borrow_rate_bsf: BigFractionBytes,
        pub accumulated_protocol_fees_sf: u128,
        pub accumulated_referrer_fees_sf: u128,
        pub pending_referrer_fees_sf: u128,
        pub absolute_referral_rate_sf: u128,
        pub token_program: Pubkey,
        pub padding2: [u64; 51],
        pub padding3: [u128; 32],
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Copy)]
    pub enum ReserveStatus {
        Active,
        Obsolete,
        Hidden,
    }
    impl Default for ReserveStatus {
        fn default() -> Self {
            Self::Active
        }
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct WithdrawalCaps {
        pub config_capacity: i64,
        pub current_total: i64,
        pub last_interval_start_timestamp: u64,
        pub config_interval_length_seconds: u64,
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct PriceHeuristic {
        pub lower: u64,
        pub upper: u64,
        pub exp: u64,
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct PythConfiguration {
        pub price: Pubkey,
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct ScopeConfiguration {
        pub price_feed: Pubkey,
        pub price_chain: [u16; 4],
        pub twap_chain: [u16; 4],
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct SwitchboardConfiguration {
        pub price_aggregator: Pubkey,
        pub twap_aggregator: Pubkey,
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct TokenInfo {
        pub name: [u8; 32],
        pub heuristic: PriceHeuristic,
        pub max_twap_divergence_bps: u64,
        pub max_age_price_seconds: u64,
        pub max_age_twap_seconds: u64,
        pub scope_configuration: ScopeConfiguration,
        pub switchboard_configuration: SwitchboardConfiguration,
        pub pyth_configuration: PythConfiguration,
        pub block_price_usage: u8,
        pub reserved: [u8; 7],
        pub padding: [u64; 19],
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct BorrowRateCurve {
        pub points: [CurvePoint; 11],
    }
    #[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default)]
    pub struct CurvePoint {
        pub utilization_rate_bps: u32,
        pub borrow_rate_bps: u32,
    }
}
pub mod state {
    #![doc = r" Structs of accounts which hold state."]
    use super::*;
    #[account]
    #[doc = " Account: UserState"]
    #[derive(Copy)]
    pub struct UserState {
        pub user_id: u64,
        pub farm_state: Pubkey,
        pub owner: Pubkey,
        pub is_farm_delegated: u8,
        pub padding0: [u8; 7],
        pub rewards_tally_scaled: [u128; 10],
        pub rewards_issued_unclaimed: [u64; 10],
        pub last_claim_ts: [u64; 10],
        pub active_stake_scaled: u128,
        pub pending_deposit_stake_scaled: u128,
        pub pending_deposit_stake_ts: u64,
        pub pending_withdrawal_unstake_scaled: u128,
        pub pending_withdrawal_unstake_ts: u64,
        pub bump: u64,
        pub delegatee: Pubkey,
        pub last_stake_ts: u64,
        pub padding1: [u64; 50],
    }
    #[account]
    #[doc = " Account: LendingMarket"]
    #[derive(Copy)]
    pub struct LendingMarket {
        pub version: u64,
        pub bump_seed: u64,
        pub lending_market_owner: Pubkey,
        pub lending_market_owner_cached: Pubkey,
        pub quote_currency: [u8; 32],
        pub referral_fee_bps: u16,
        pub emergency_mode: u8,
        pub autodeleverage_enabled: u8,
        pub borrow_disabled: u8,
        pub price_refresh_trigger_to_max_age_pct: u8,
        pub liquidation_max_debt_close_factor_pct: u8,
        pub insolvency_risk_unhealthy_ltv_pct: u8,
        pub min_full_liquidation_value_threshold: u64,
        pub max_liquidatable_debt_market_value_at_once: u64,
        pub reserved0: [u8; 8],
        pub global_allowed_borrow_value: u64,
        pub risk_council: Pubkey,
        pub reserved1: [u8; 8],
        pub elevation_groups: [ElevationGroup; 32],
        pub elevation_group_padding: [u64; 90],
        pub min_net_value_in_obligation_sf: u128,
        pub min_value_skip_liquidation_ltv_checks: u64,
        pub name: [u8; 32],
        pub min_value_skip_liquidation_bf_checks: u64,
        pub padding1: [u64; 172],
    }
    #[account]
    #[doc = " Account: Obligation"]
    #[derive(Copy)]
    pub struct Obligation {
        pub tag: u64,
        pub last_update: LastUpdate,
        pub lending_market: Pubkey,
        pub owner: Pubkey,
        pub deposits: [ObligationCollateral; 8],
        pub lowest_reserve_deposit_liquidation_ltv: u64,
        pub deposited_value_sf: u128,
        pub borrows: [ObligationLiquidity; 5],
        pub borrow_factor_adjusted_debt_value_sf: u128,
        pub borrowed_assets_market_value_sf: u128,
        pub allowed_borrow_value_sf: u128,
        pub unhealthy_borrow_value_sf: u128,
        pub deposits_asset_tiers: [u8; 8],
        pub borrows_asset_tiers: [u8; 5],
        pub elevation_group: u8,
        pub num_of_obsolete_reserves: u8,
        pub has_debt: u8,
        pub referrer: Pubkey,
        pub borrowing_disabled: u8,
        pub reserved: [u8; 7],
        pub highest_borrow_factor_pct: u64,
        pub padding3: [u64; 126],
    }
    #[account]
    #[doc = " Account: ReferrerState"]
    #[derive(Copy, Default)]
    pub struct ReferrerState {
        pub short_url: Pubkey,
        pub owner: Pubkey,
    }
    #[account]
    #[doc = " Account: ReferrerTokenState"]
    #[derive(Copy, Default)]
    pub struct ReferrerTokenState {
        pub referrer: Pubkey,
        pub mint: Pubkey,
        pub amount_unclaimed_sf: u128,
        pub amount_cumulative_sf: u128,
        pub bump: u64,
        pub padding: [u64; 31],
    }
    #[account]
    #[doc = " Account: ShortUrl"]
    #[derive(Default)]
    pub struct ShortUrl {
        pub referrer: Pubkey,
        pub short_url: String,
    }
    #[account]
    #[doc = " Account: UserMetadata"]
    #[derive(Copy)]
    pub struct UserMetadata {
        pub referrer: Pubkey,
        pub bump: u64,
        pub user_lookup_table: Pubkey,
        pub owner: Pubkey,
        pub padding1: [u64; 51],
        pub padding2: [u64; 64],
    }
    #[account]
    #[doc = " Account: Reserve"]
    #[derive(Copy)]
    pub struct Reserve {
        pub version: u64,
        pub last_update: LastUpdate,
        pub lending_market: Pubkey,
        pub farm_collateral: Pubkey,
        pub farm_debt: Pubkey,
        pub liquidity: ReserveLiquidity,
        pub reserve_liquidity_padding: [u64; 150],
        pub collateral: ReserveCollateral,
        pub reserve_collateral_padding: [u64; 150],
        pub config: ReserveConfig,
        pub config_padding: [u64; 117],
        pub borrowed_amount_outside_elevation_group: u64,
        pub borrowed_amounts_against_this_reserve_in_elevation_groups: [u64; 32],
        pub padding: [u64; 207],
    }
}
pub mod ix_accounts {
    #![doc = r" Accounts used in instructions."]
    use super::*;
    #[derive(Accounts)]
    pub struct InitLendingMarket<'info> {
        #[account(mut)]
        pub lending_market_owner: Signer<'info>,
        #[account(mut)]
        pub lending_market: AccountInfo<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        pub system_program: AccountInfo<'info>,
        pub rent: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct UpdateLendingMarket<'info> {
        pub lending_market_owner: Signer<'info>,
        #[account(mut)]
        pub lending_market: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct UpdateLendingMarketOwner<'info> {
        pub lending_market_owner_cached: Signer<'info>,
        #[account(mut)]
        pub lending_market: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct InitReserve<'info> {
        #[account(mut)]
        pub lending_market_owner: Signer<'info>,
        pub lending_market: AccountInfo<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
        pub reserve_liquidity_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_supply: AccountInfo<'info>,
        #[account(mut)]
        pub fee_receiver: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_collateral_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_collateral_supply: AccountInfo<'info>,
        pub rent: AccountInfo<'info>,
        pub liquidity_token_program: AccountInfo<'info>,
        pub collateral_token_program: AccountInfo<'info>,
        pub system_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct InitFarmsForReserve<'info> {
        #[account(mut)]
        pub lending_market_owner: Signer<'info>,
        pub lending_market: AccountInfo<'info>,
        #[account(mut)]
        pub lending_market_authority: AccountInfo<'info>,
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
        pub farms_program: AccountInfo<'info>,
        pub farms_global_config: AccountInfo<'info>,
        #[account(mut)]
        pub farm_state: AccountInfo<'info>,
        pub farms_vault_authority: AccountInfo<'info>,
        pub rent: AccountInfo<'info>,
        pub system_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct UpdateReserveConfig<'info> {
        pub lending_market_owner: Signer<'info>,
        pub lending_market: AccountInfo<'info>,
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct RedeemFees<'info> {
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_fee_receiver: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_supply_liquidity: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        pub token_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct SocializeLoss<'info> {
        pub risk_council: Signer<'info>,
        #[account(mut)]
        pub obligation: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
        pub instruction_sysvar_account: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct WithdrawProtocolFee<'info> {
        pub lending_market_owner: Signer<'info>,
        pub lending_market: AccountInfo<'info>,
        pub reserve: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_mint: AccountInfo<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        #[account(mut)]
        pub fee_vault: AccountInfo<'info>,
        #[account(mut)]
        pub lending_market_owner_ata: AccountInfo<'info>,
        pub token_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct RefreshReserve<'info> {
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        pub pyth_oracle: AccountInfo<'info>,
        pub switchboard_price_oracle: AccountInfo<'info>,
        pub switchboard_twap_oracle: AccountInfo<'info>,
        pub scope_prices: AccountInfo<'info>,
    }
    // #[derive(Accounts)]
    // pub struct RefreshReservesBatch<'info> {}
    #[derive(Accounts)]
    pub struct DepositReserveLiquidity<'info> {
        pub owner: Signer<'info>,
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_supply: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_collateral_mint: AccountInfo<'info>,
        #[account(mut)]
        pub user_source_liquidity: AccountInfo<'info>,
        #[account(mut)]
        pub user_destination_collateral: AccountInfo<'info>,
        pub collateral_token_program: AccountInfo<'info>,
        pub liquidity_token_program: AccountInfo<'info>,
        pub instruction_sysvar_account: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct RedeemReserveCollateral<'info> {
        pub owner: Signer<'info>,
        pub lending_market: AccountInfo<'info>,
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_collateral_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_supply: AccountInfo<'info>,
        #[account(mut)]
        pub user_source_collateral: AccountInfo<'info>,
        #[account(mut)]
        pub user_destination_liquidity: AccountInfo<'info>,
        pub collateral_token_program: AccountInfo<'info>,
        pub liquidity_token_program: AccountInfo<'info>,
        pub instruction_sysvar_account: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct InitObligation<'info> {
        pub obligation_owner: Signer<'info>,
        #[account(mut)]
        pub fee_payer: Signer<'info>,
        #[account(mut)]
        pub obligation: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        pub seed1_account: AccountInfo<'info>,
        pub seed2_account: AccountInfo<'info>,
        pub owner_user_metadata: AccountInfo<'info>,
        pub rent: AccountInfo<'info>,
        pub system_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct InitObligationFarmsForReserve<'info> {
        #[account(mut)]
        pub payer: Signer<'info>,
        pub owner: AccountInfo<'info>,
        #[account(mut)]
        pub obligation: AccountInfo<'info>,
        #[account(mut)]
        pub lending_market_authority: AccountInfo<'info>,
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_farm_state: AccountInfo<'info>,
        #[account(mut)]
        pub obligation_farm: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        pub farms_program: AccountInfo<'info>,
        pub rent: AccountInfo<'info>,
        pub system_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct RefreshObligationFarmsForReserve<'info> {
        #[account(mut)]
        pub crank: Signer<'info>,
        pub obligation: AccountInfo<'info>,
        #[account(mut)]
        pub lending_market_authority: AccountInfo<'info>,
        pub reserve: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_farm_state: AccountInfo<'info>,
        #[account(mut)]
        pub obligation_farm_user_state: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        pub farms_program: AccountInfo<'info>,
        pub rent: AccountInfo<'info>,
        pub system_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct RefreshObligation<'info> {
        pub lending_market: AccountInfo<'info>,
        #[account(mut)]
        pub obligation: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct DepositObligationCollateral<'info> {
        pub owner: Signer<'info>,
        #[account(mut)]
        pub obligation: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        #[account(mut)]
        pub deposit_reserve: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_destination_collateral: AccountInfo<'info>,
        #[account(mut)]
        pub user_source_collateral: AccountInfo<'info>,
        pub token_program: AccountInfo<'info>,
        pub instruction_sysvar_account: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct WithdrawObligationCollateral<'info> {
        pub owner: Signer<'info>,
        #[account(mut)]
        pub obligation: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        #[account(mut)]
        pub withdraw_reserve: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_source_collateral: AccountInfo<'info>,
        #[account(mut)]
        pub user_destination_collateral: AccountInfo<'info>,
        pub token_program: AccountInfo<'info>,
        pub instruction_sysvar_account: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct BorrowObligationLiquidity<'info> {
        pub owner: Signer<'info>,
        #[account(mut)]
        pub obligation: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        #[account(mut)]
        pub borrow_reserve: AccountInfo<'info>,
        #[account(mut)]
        pub borrow_reserve_liquidity_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_source_liquidity: AccountInfo<'info>,
        #[account(mut)]
        pub borrow_reserve_liquidity_fee_receiver: AccountInfo<'info>,
        #[account(mut)]
        pub user_destination_liquidity: AccountInfo<'info>,
        #[account(mut)]
        pub referrer_token_state: AccountInfo<'info>,
        pub token_program: AccountInfo<'info>,
        pub instruction_sysvar_account: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct RepayObligationLiquidity<'info> {
        pub owner: Signer<'info>,
        #[account(mut)]
        pub obligation: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        #[account(mut)]
        pub repay_reserve: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_destination_liquidity: AccountInfo<'info>,
        #[account(mut)]
        pub user_source_liquidity: AccountInfo<'info>,
        pub token_program: AccountInfo<'info>,
        pub instruction_sysvar_account: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct DepositReserveLiquidityAndObligationCollateral<'info> {
        #[account(mut)]
        pub owner: Signer<'info>,
        #[account(mut)]
        pub obligation: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_supply: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_collateral_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_destination_deposit_collateral: AccountInfo<'info>,
        #[account(mut)]
        pub user_source_liquidity: AccountInfo<'info>,
        pub placeholder_user_destination_collateral: AccountInfo<'info>,
        pub collateral_token_program: AccountInfo<'info>,
        pub liquidity_token_program: AccountInfo<'info>,
        pub instruction_sysvar_account: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct WithdrawObligationCollateralAndRedeemReserveCollateral<'info> {
        #[account(mut)]
        pub owner: Signer<'info>,
        #[account(mut)]
        pub obligation: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        #[account(mut)]
        pub withdraw_reserve: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_source_collateral: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_collateral_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_supply: AccountInfo<'info>,
        #[account(mut)]
        pub user_destination_liquidity: AccountInfo<'info>,
        pub placeholder_user_destination_collateral: AccountInfo<'info>,
        pub collateral_token_program: AccountInfo<'info>,
        pub liquidity_token_program: AccountInfo<'info>,
        pub instruction_sysvar_account: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct LiquidateObligationAndRedeemReserveCollateral<'info> {
        pub liquidator: Signer<'info>,
        #[account(mut)]
        pub obligation: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        #[account(mut)]
        pub repay_reserve: AccountInfo<'info>,
        #[account(mut)]
        pub repay_reserve_liquidity_mint: AccountInfo<'info>,
        #[account(mut)]
        pub repay_reserve_liquidity_supply: AccountInfo<'info>,
        #[account(mut)]
        pub withdraw_reserve: AccountInfo<'info>,
        #[account(mut)]
        pub withdraw_reserve_liquidity_mint: AccountInfo<'info>,
        #[account(mut)]
        pub withdraw_reserve_collateral_mint: AccountInfo<'info>,
        #[account(mut)]
        pub withdraw_reserve_collateral_supply: AccountInfo<'info>,
        #[account(mut)]
        pub withdraw_reserve_liquidity_supply: AccountInfo<'info>,
        #[account(mut)]
        pub withdraw_reserve_liquidity_fee_receiver: AccountInfo<'info>,
        #[account(mut)]
        pub user_source_liquidity: AccountInfo<'info>,
        #[account(mut)]
        pub user_destination_collateral: AccountInfo<'info>,
        #[account(mut)]
        pub user_destination_liquidity: AccountInfo<'info>,
        pub collateral_token_program: AccountInfo<'info>,
        pub repay_liquidity_token_program: AccountInfo<'info>,
        pub withdraw_liquidity_token_program: AccountInfo<'info>,
        pub instruction_sysvar_account: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct FlashRepayReserveLiquidity<'info> {
        pub user_transfer_authority: Signer<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
        pub reserve_liquidity_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_destination_liquidity: AccountInfo<'info>,
        #[account(mut)]
        pub user_source_liquidity: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_fee_receiver: AccountInfo<'info>,
        #[account(mut)]
        pub referrer_token_state: AccountInfo<'info>,
        #[account(mut)]
        pub referrer_account: AccountInfo<'info>,
        pub sysvar_info: AccountInfo<'info>,
        pub token_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct FlashBorrowReserveLiquidity<'info> {
        pub user_transfer_authority: Signer<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
        pub reserve_liquidity_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_source_liquidity: AccountInfo<'info>,
        #[account(mut)]
        pub user_destination_liquidity: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_fee_receiver: AccountInfo<'info>,
        #[account(mut)]
        pub referrer_token_state: AccountInfo<'info>,
        #[account(mut)]
        pub referrer_account: AccountInfo<'info>,
        pub sysvar_info: AccountInfo<'info>,
        pub token_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct RequestElevationGroup<'info> {
        pub owner: Signer<'info>,
        #[account(mut)]
        pub obligation: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct InitReferrerTokenState<'info> {
        #[account(mut)]
        pub payer: Signer<'info>,
        pub lending_market: AccountInfo<'info>,
        pub reserve: AccountInfo<'info>,
        pub referrer: AccountInfo<'info>,
        #[account(mut)]
        pub referrer_token_state: AccountInfo<'info>,
        pub rent: AccountInfo<'info>,
        pub system_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct InitUserMetadata<'info> {
        pub owner: Signer<'info>,
        #[account(mut)]
        pub fee_payer: Signer<'info>,
        #[account(mut)]
        pub user_metadata: AccountInfo<'info>,
        pub referrer_user_metadata: AccountInfo<'info>,
        pub rent: AccountInfo<'info>,
        pub system_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct WithdrawReferrerFees<'info> {
        #[account(mut)]
        pub referrer: Signer<'info>,
        #[account(mut)]
        pub referrer_token_state: AccountInfo<'info>,
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_liquidity_mint: AccountInfo<'info>,
        #[account(mut)]
        pub reserve_supply_liquidity: AccountInfo<'info>,
        #[account(mut)]
        pub referrer_token_account: AccountInfo<'info>,
        pub lending_market: AccountInfo<'info>,
        pub lending_market_authority: AccountInfo<'info>,
        pub token_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct InitReferrerStateAndShortUrl<'info> {
        #[account(mut)]
        pub referrer: Signer<'info>,
        #[account(mut)]
        pub referrer_state: AccountInfo<'info>,
        #[account(mut)]
        pub referrer_short_url: AccountInfo<'info>,
        pub referrer_user_metadata: AccountInfo<'info>,
        pub rent: AccountInfo<'info>,
        pub system_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct DeleteReferrerStateAndShortUrl<'info> {
        #[account(mut)]
        pub referrer: Signer<'info>,
        #[account(mut)]
        pub referrer_state: AccountInfo<'info>,
        #[account(mut)]
        pub short_url: AccountInfo<'info>,
        pub rent: AccountInfo<'info>,
        pub system_program: AccountInfo<'info>,
    }
    #[derive(Accounts)]
    pub struct IdlMissingTypes<'info> {
        pub lending_market_owner: Signer<'info>,
        pub lending_market: AccountInfo<'info>,
        #[account(mut)]
        pub reserve: AccountInfo<'info>,
    }
}
use ix_accounts::*;
pub use state::*;
pub use typedefs::*;
#[program]
pub mod kamino_lending {
    #![doc = " Anchor CPI crate generated from kamino_lending v0.1.0 using [anchor-gen](https://crates.io/crates/anchor-gen) v0.3.1."]
    use super::*;
    pub fn init_lending_market(
        _ctx: Context<InitLendingMarket>,
        _quote_currency: [u8; 32],
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn update_lending_market(
        _ctx: Context<UpdateLendingMarket>,
        _mode: u64,
        _value: [u8; 72],
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn update_lending_market_owner(_ctx: Context<UpdateLendingMarketOwner>) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn init_reserve(_ctx: Context<InitReserve>) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn init_farms_for_reserve(_ctx: Context<InitFarmsForReserve>, _mode: u8) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn update_reserve_config(
        _ctx: Context<UpdateReserveConfig>,
        _mode: u64,
        _value: Vec<u8>,
        _skip_validation: bool,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn redeem_fees(_ctx: Context<RedeemFees>) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn socialize_loss(_ctx: Context<SocializeLoss>, _liquidity_amount: u64) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn withdraw_protocol_fee(_ctx: Context<WithdrawProtocolFee>, _amount: u64) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn refresh_reserve(_ctx: Context<RefreshReserve>) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    // pub fn refresh_reserves_batch(
    //     _ctx: Context<RefreshReservesBatch>,
    //     _skip_price_updates: bool,
    // ) -> Result<()> {
    //     unimplemented!("This program is a wrapper for CPI.")
    // }
    pub fn deposit_reserve_liquidity(
        _ctx: Context<DepositReserveLiquidity>,
        _liquidity_amount: u64,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn redeem_reserve_collateral(
        _ctx: Context<RedeemReserveCollateral>,
        _collateral_amount: u64,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn init_obligation(_ctx: Context<InitObligation>, _args: InitObligationArgs) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn init_obligation_farms_for_reserve(
        _ctx: Context<InitObligationFarmsForReserve>,
        _mode: u8,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn refresh_obligation_farms_for_reserve(
        _ctx: Context<RefreshObligationFarmsForReserve>,
        _mode: u8,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn refresh_obligation(_ctx: Context<RefreshObligation>) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn deposit_obligation_collateral(
        _ctx: Context<DepositObligationCollateral>,
        _collateral_amount: u64,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn withdraw_obligation_collateral(
        _ctx: Context<WithdrawObligationCollateral>,
        _collateral_amount: u64,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn borrow_obligation_liquidity(
        _ctx: Context<BorrowObligationLiquidity>,
        _liquidity_amount: u64,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn repay_obligation_liquidity(
        _ctx: Context<RepayObligationLiquidity>,
        _liquidity_amount: u64,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn deposit_reserve_liquidity_and_obligation_collateral(
        _ctx: Context<DepositReserveLiquidityAndObligationCollateral>,
        _liquidity_amount: u64,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn withdraw_obligation_collateral_and_redeem_reserve_collateral(
        _ctx: Context<WithdrawObligationCollateralAndRedeemReserveCollateral>,
        _collateral_amount: u64,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn liquidate_obligation_and_redeem_reserve_collateral(
        _ctx: Context<LiquidateObligationAndRedeemReserveCollateral>,
        _liquidity_amount: u64,
        _min_acceptable_received_liquidity_amount: u64,
        _max_allowed_ltv_override_percent: u64,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn flash_repay_reserve_liquidity(
        _ctx: Context<FlashRepayReserveLiquidity>,
        _liquidity_amount: u64,
        _borrow_instruction_index: u8,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn flash_borrow_reserve_liquidity(
        _ctx: Context<FlashBorrowReserveLiquidity>,
        _liquidity_amount: u64,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn request_elevation_group(
        _ctx: Context<RequestElevationGroup>,
        _elevation_group: u8,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn init_referrer_token_state(_ctx: Context<InitReferrerTokenState>) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn init_user_metadata(
        _ctx: Context<InitUserMetadata>,
        _user_lookup_table: Pubkey,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn withdraw_referrer_fees(_ctx: Context<WithdrawReferrerFees>) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn init_referrer_state_and_short_url(
        _ctx: Context<InitReferrerStateAndShortUrl>,
        _short_url: String,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn delete_referrer_state_and_short_url(
        _ctx: Context<DeleteReferrerStateAndShortUrl>,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
    pub fn idl_missing_types(
        _ctx: Context<IdlMissingTypes>,
        _reserve_farm_kind: ReserveFarmKind,
        _asset_tier: AssetTier,
        _fee_calculation: FeeCalculation,
        _reserve_status: ReserveStatus,
        _update_config_mode: UpdateConfigMode,
        _update_lending_market_config_value: UpdateLendingMarketConfigValue,
        _update_lending_market_config_mode: UpdateLendingMarketMode,
    ) -> Result<()> {
        unimplemented!("This program is a wrapper for CPI.")
    }
}
