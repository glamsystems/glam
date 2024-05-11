use anchor_lang::prelude::*;

// Openfunds v2.0 Share Class

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum ShareClassFieldName {
    // Essential
    ISIN,               // impl
    ShareClassCurrency, // impl
    // Core
    AllInFeeApplied,
    AllInFeeDate,
    AllInFeeIncludesTransactionCosts,
    AllInFeeMaximum,
    AppliedSubscriptionFeeInFavourOfDistributor, // impl
    AppliedSubscriptionFeeInFavourOfDistributorReferenceDate, // impl
    Benchmark,
    CountryLegalRegistration,
    CountryMarketingDistribution,
    CurrencyHedgeShareClass,
    CurrencyOfMinimalSubscription, // impl
    DistributionDeclarationFrequency,
    FullShareClassName, // impl
    HasAllInFee,
    HasOngoingCharges,
    HasPerformanceFee,                       // impl
    HasSubscriptionFeeInFavourOfDistributor, // impl
    InvestmentStatus,                        // impl
    IsETF,
    IsRDRCompliant,
    IsTrailerFeeClean,
    ManagementFeeApplied,                        // impl
    ManagementFeeAppliedReferenceDate,           // impl
    ManagementFeeMaximum,                        // impl
    MaximumSubscriptionFeeInFavourOfDistributor, // impl
    MinimalInitialSubscriptionCategory,          // impl
    MinimalInitialSubscriptionInAmount,          // impl
    MinimalInitialSubscriptionInShares,          // impl
    MinimalSubsequentSubscriptionCategory,       // impl
    MinimalSubsequentSubscriptionInAmount,       // impl
    MinimalSubsequentSubscriptionInShares,       // impl
    MinimumSubscriptionFeeInFavourOfDistributor, // impl
    OngoingCharges,
    OngoingChargesDate,
    PerformanceFeeApplied,
    PerformanceFeeAppliedReferenceDate,
    PerformanceFeeInProspectus,
    PerformanceFeeInProspectusReferenceDate,
    RecordDateForSRRI,
    ShareClassDistributionPolicy, // impl
    ShareClassExtension,          // impl
    ShareClassLaunchDate,         // impl
    ShareClassLifecycle,          // impl
    SRRI,                         // impl
    TERExcludingPerformanceFee,
    TERExcludingPerformanceFeeDate,
    TERIncludingPerformanceFee,
    TERIncludingPerformanceFeeDate,
    // Additional
    TransferAgentName,
    BICOfTransferAgent,
    DomicileOfTransferAgent,
    FormOfShare,
    HasDurationHedge,
    TypeOfEqualization,
    IsMultiseries,
    SeriesIssuance,
    SeriesFrequency,
    DoesFundIssueSidePocket,
    HasRedemptionGates,
    TypeOfAlternativeFundStructureVehicle,
    BloombergCode,
    FIGICode,
    AbbreviatedShareClassName,
    ValuationFrequency,
    NAVPublicationTime,
    IsShareClassEligibleForUCITS,
    InvestmentStatusDate,
    LaunchPrice,         // impl
    LaunchPriceCurrency, // impl
    LaunchPriceDate,     // impl
    EFAMAMainEFCCategory,
    EFAMAEFCClassificationType,
    EFAMAActiveEFCClassification,
    EFAMAEFCInvestmentTheme,
    PricingMethodology,
    SinglePricingType,
    SwingFactor,
    StandardMinimumRemainingAmount,
    StandardMinimumRemainingShares,
    CurrencyOfMinimumRemainingAmount,
    StandardMinimumRemainingCategory,
    HurdleRate,
    HighWaterMark,
    HasAppliedSubscriptionFeeInFavourOfFund,           // impl
    AppliedSubscriptionFeeInFavourOfFund,              // impl
    AppliedSubscriptionFeeInFavourOfFundReferenceDate, // impl
    MaximumSubscriptionFeeInFavourOfFund,              // impl
    HasAppliedRedemptionFeeInFavourOfFund,             // impl
    AppliedRedemptionFeeInFavourOfFund,                // impl
    AppliedRedemptionFeeInFavourOfFundReferenceDate,   // impl
    MaximumRedemptionFeeInFavourOfFund,                // impl
    EquivalentTrailerFeeCleanISIN,
    HasSeparateDistributionFee,
    DistributionFee,
    DistributionFeeMaximum,
    IASector,
    // Full
    AbsorbingFundFullShareClassName,
    AbsorbingFundShareClassISIN,
    AdministrationFeeMaximum,
    AnnualDistributionAtFiscalYearEnd,
    AnnualDistributionYieldAtFiscalYearEnd,
    AppliedRedemptionFeeInFavourOfDistributor, // impl
    AppliedRedemptionFeeInFavourOfDistributorReferenceDate, // impl
    BankDetailsSSIForPaymentsProvision,
    BankDetailsLevelApplication,
    BenchmarkBloombergTicker,
    CalculationDateOffsetForRedemption,
    CalculationDateOffsetForSubscription,
    CalendarOrBusinessDaysForCutOffDateOffsetForRedemption,
    CalendarOrBusinessDaysForCutOffDateOffsetForSubscription,
    CalendarOrBusinessDaysForPrePaymentDaysForSubscription,
    CalendarOrBusinessDaysForSettlementPeriodForRedemption,
    CalendarOrBusinessDaysForSettlementPeriodForSubscription,
    CalendarOrBusinessDaysForTransactions,
    CFICode,
    ContingentDeferredSalesChargeExitFee,
    ContingentDeferredSalesChargeUpfrontFee,
    CountryISOCodeAlpha2,
    CountryISOCodeAlpha3,
    CountryName,
    CurrenciesOfMulticurrencyShareClass,
    CurrencyOfMinimalOrMaximumRedemption, // impl
    CustodianFeeApplied,
    CustodianFeeAppliedReferenceDate,
    CustodianFeeMaximum,
    CutOffDateOffsetForRedemption,   // impl
    CutOffDateOffsetForSubscription, // impl
    CutOffTimeForRedemption,         // impl
    CutOffTimeForSubscription,       // impl
    CutOffTimeForSwitchIn,
    CutOffTimeForSwitchOut,
    DealingDaysOfMultipleRedemptionTradeCycles,
    DealingDaysOfMultipleSubscriptionTradeCycles,
    DisseminationRecipient,
    DistributionFeeReferenceDate,
    DoesShareClassApplyMandatoryConversion,
    DoesShareClassApplyPartialDealingDays,
    DoesShareClassApplyPartialPaymentDays,
    DormantEndDate,
    DormantStartDate,
    ExDividendDateCalendar,
    ExitCostDescription,
    HasContingentDeferredSalesChargeFee,
    HasDilutionLevyAppliedByFund,
    HasEqualizationMethodForDistribution,
    HasEqualizationMethodForPerformanceFee,
    HasForcedRedemption,
    HasForwardPricing,
    HasHighWaterMark,
    HasLockUpForRedemption, // impl
    HasPreNoticeForSwitchIn,
    HasPreNoticeForSwitchOut,
    HasPrePaymentForSubscription,
    HasRedemptionFeeInFavourOfDistributor, // impl
    HasTripartiteReport,
    InvestmentStatusDescription,
    IrregularRedemptionDealingDays,
    IrregularSubscriptionDealingDays,
    IsMulticurrencyShareClass,
    IsRestrictedToSeparateFeeArrangement,
    IsStructuredFinanceProduct,
    IsValidISIN, // impl
    LiquidationStartDate,
    LockUpComment,        // impl
    LockUpPeriodInDays,   // impl
    ManagementFeeMinimum, // impl
    MandatoryShareConversionDescriptionDetails,
    MarketsRelevantToFundTradingCalendar,
    MaximalNumberOfPossibleDecimalsAmount,     // impl
    MaximalNumberOfPossibleDecimalsNAV,        // impl
    MaximalNumberOfPossibleDecimalsShares,     // impl
    MaximumInitialRedemptionInAmount,          // impl
    MaximumInitialRedemptionInShares,          // impl
    MaximumRedemptionFeeInFavourOfDistributor, // impl
    MaximumSubsequentRedemptionInAmount,       // impl
    MaximumSubsequentRedemptionInShares,       // impl
    MergerRatio,
    MinimalInitialRedemptionInAmount,          // impl
    MinimalInitialRedemptionInShares,          // impl
    MinimalRedemptionCategory,                 // impl
    MinimalSubsequentRedemptionInAmount,       // impl
    MinimalSubsequentRedemptionInShares,       // impl
    MinimumRedemptionFeeInFavourOfDistributor, // impl
    MinimumRedemptionFeeInFavourOfFund,        // impl
    MinimumSubscriptionFeeInFavourOfFund,      // impl
    MonthlyRedemptionDealingDays,
    MonthlySubscriptionDealingDays,
    NasdaqFundNetworkNFNIdentifier,
    NoTradingDate,
    NumberOfPossibleRedemptionsWithinPeriod,
    NumberOfPossibleSubscriptionsWithinPeriod,
    PartialDealingDaysDateAndTime,
    PartialPaymentDaysDateAndTime,
    PaymentDateCalendar,
    PerformanceFeeMinimum, // impl
    PreNoticeCutOffForRedemption,
    PreNoticeCutOffForSubscription,
    PrePaymentCutOffTimeForSubscription,
    PrePaymentDaysForSubscription,
    RecordDateCalendar,
    RedemptionTradeCyclePeriod,
    RoundingMethodForPrices,               // impl
    RoundingMethodForRedemptionInAmount,   // impl
    RoundingMethodForRedemptionInShares,   // impl
    RoundingMethodForSubscriptionInAmount, // impl
    RoundingMethodForSubscriptionInShares, // impl
    SettlementPeriodForRedemption,
    SettlementPeriodForSubscription,
    SettlementPeriodForSwitchIn,
    SettlementPeriodForSwitchOut,
    ShareClassDividendType, // impl
    SingleRegisterAccountRestrictions,
    SubscriptionPeriodEndDate,
    SubscriptionPeriodStartDate,
    SubscriptionTradeCyclePeriod,
    SwitchInNoticePeriod,
    SwitchOutNoticePeriod,
    TerminationDate,
    TimeZoneForCutOff,
    TimeZoneForCutOffUsingTZDatabase,
    ValuationFrequencyDetail,
    ValuationReduction,
    WeeklyRedemptionDealingDays,
    WeeklySubscriptionDealingDays,
    YearlyRedemptionDealingDays,
    YearlySubscriptionDealingDays,
    // Full | Country
    CUSIP, // impl
    Valor, // impl
    // Glam Extensions
    FundId,   // impl
    ImageUri, // impl
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum ShareClassDynamicFieldName {
    // Dynamic
    AskNAV,
    AskNAVDate,
    AuMShareClass,     // impl (api)
    AuMShareClassDate, // impl (api)
    BidNAV,
    BidNAVDate,
    DividendAnnouncementDate,
    DividendCurrency,
    DividendExDate,
    DividendGross,
    DividendNet,
    DividendPaymentDate,
    DividendRecordDate,
    DynamicCurrency,
    DynamicDataType,
    DynamicValue,
    EqualisationRate,
    GeneralReferenceDate,
    IsDividendFinal,
    NoSShareClass,     // impl (api)
    NoSShareClassDate, // impl (api)
    SplitRatio,
    SplitReferenceDate,
    TaxDeductedReinvestedAmount,
    TaxDeductedReinvestedAmountReferenceDate,
    TaxableIncomeperDividend,
    TaxableIncomeperShareEU,
    TransactionNAV,
    TransactionNAVDate,
    ValuationNAV,     // impl (api)
    ValuationNAVDate, // impl (api)
    YieldOneDayGross,
    YieldOneDayNet,
    YieldSevenDayGross,
    YieldSevenDayNet,
    YieldThirtyDayGross,
    YieldThirtyDayNet,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct ShareClassField {
    pub name: ShareClassFieldName,
    pub value: String,
}
