use anchor_lang::prelude::*;

/*
   Openfund fields (key/value pairs), organized by kind:
   Company, Fund, ShareClass, FundManager.

   Used by FundMetadataAccount.

   Each Field also has its corresponding FieldName enum.
*/

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct CompanyField {
    pub name: CompanyFieldName,
    pub value: String,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct FundField {
    pub name: FundFieldName,
    pub value: String,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct ShareClassField {
    pub name: ShareClassFieldName,
    pub value: String,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct FundManagerField {
    pub name: FundManagerFieldName,
    pub value: String,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum CompanyFieldName {
    // Essential
    FundGroupName,
    // Core
    DomicileOfManCo,
    ManCo,
    // Additional
    BICOfCustodian,
    CollateralManagerName,
    CustodianBankName,
    DomicileOfCustodianBank,
    FundAdministratorName,
    FundAdvisorName,
    FundPromoterName,
    IsSelfManagedInvestmentCompany,
    LEIOfCustodianBank,
    LEIOfManCo,
    PortfolioManagingCompanyName,
    SecuritiesLendingCounterpartyName,
    SwapCounterpartyName,
    // Full
    AddressofManCo,
    AuditorName,
    CityofManCo,
    EmailAddressOfManCo,
    FundWebsiteofManCo,
    IsUNPRISignatory,
    PhoneCountryCodeofManCo,
    PhoneNumberofManCo,
    SubInvestmentAdvisorName,
    ZIPCodeofManCo,
    // Umbrella
    DomicileOfUmbrella,
    HasUmbrella,
    LEIOfUmbrella,
    Umbrella,
    GlobalIntermediaryIdentificationNumberOfUmbrella,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum FundFieldName {
    // Essential
    FundDomicileAlpha2,
    FundDomicileAlpha3,
    LegalFundNameIncludingUmbrella,
    // Core
    FiscalYearEnd,
    FundCurrency,
    FundLaunchDate,
    InvestmentObjective,
    IsETC,
    IsEUDirectiveRelevant,
    IsFundOfFunds,
    IsPassiveFund,
    IsREIT,
    LegalForm,
    LegalFundNameOnly,
    OpenEndedOrClosedEndedFundStructure,
    TypeOfEUDirective,
    UCITSVersion,
    // Additional
    CurrencyHedgePortfolio,
    DepositoryName,
    FundValuationPoint,
    FundValuationPointTimeZone,
    FundValuationPointTimeZoneUsingTZDatabase,
    HasCollateralManager,
    HasEmbeddedDerivatives,
    HasSecuritiesLending,
    HasSwap,
    IsLeveraged,
    IsShariaCompliant,
    IsShort,
    LEIofDepositoryBank,
    LEIOfFund,
    LocationOfBearerShare,
    LocationOfShareRegister,
    MaximumLeverageInFund,
    MiFIDSecuritiesClassification,
    MoneyMarketTypeOfFund,
    TrusteeName,
    // Dynamic
    AuMFund,
    AuMFundDate,
    NoSFund,
    NoSFundDate,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum ShareClassFieldName {
    // Essential
    ISIN,
    ShareClassCurrency,
    // Core
    AllInFeeApplied,
    AllInFeeDate,
    AllInFeeIncludesTransactionCosts,
    AllInFeeMaximum,
    AppliedSubscriptionFeeInFavourOfDistributor,
    AppliedSubscriptionFeeInFavourOfDistributorReferenceDate,
    Benchmark,
    CountryLegalRegistration,
    CountryMarketingDistribution,
    CurrencyHedgeShareClass,
    CurrencyofMinimalSubscription,
    DistributionDeclarationFrequency,
    FullShareClassName,
    HasAllInFee,
    HasOngoingCharges,
    HasPerformanceFee,
    HasSubscriptionFeeInFavourOfDistributor,
    InvestmentStatus,
    IsETF,
    IsRDRCompliant,
    IsTrailerFeeClean,
    ManagementFeeApplied,
    ManagementFeeAppliedReferenceDate,
    ManagementFeeMaximum,
    MaximumSubscriptionFeeInFavourOfDistributor,
    MinimalInitialSubscriptionCategory,
    MinimalInitialSubscriptionInAmount,
    MinimalInitialSubscriptionInShares,
    MinimalSubsequentSubscriptionCategory,
    MinimalSubsequentSubscriptionInAmount,
    MinimalSubsequentSubscriptionInShares,
    MinimumSubscriptionFeeInFavourOfDistributor,
    OngoingCharges,
    OngoingChargesDate,
    PerformanceFeeApplied,
    PerformanceFeeAppliedReferenceDate,
    PerformanceFeeInProspectus,
    PerformanceFeeInProspectusReferenceDate,
    RecordDateForSRRI,
    ShareClassDistributionPolicy,
    ShareClassExtension,
    ShareClassLaunchDate,
    ShareClassLifecycle,
    SRRI,
    TERExcludingPerformanceFee,
    TERExcludingPerformanceFeeDate,
    TERIncludingPerformanceFee,
    TERIncludingPerformanceFeeDate,
    // Additional
    AbbreviatedShareClassName,
    BICOfTransferAgent,
    BloombergCode,
    CurrencyOfMinimumRemainingAmount,
    DistributionFeeMaximum,
    DomicileofTransferAgent,
    EFAMAActiveEFCClassification,
    EFAMAEFCClassificationType,
    EFAMAEFCInvestmentTheme,
    EFAMAMainEFCCategory,
    FIGICode,
    FormOfShare,
    HasDurationHedge,
    IASector,
    InvestmentStatusDate,
    IsShareClassEligibleForUCITS,
    LaunchPrice,
    LaunchPriceCurrency,
    LaunchPriceDate,
    NAVPublicationTime,
    PricingMethodology,
    SinglePricingType,
    StandardMinimumRemainingAmount,
    StandardMinimumRemainingCategory,
    StandardMinimumRemainingShares,
    SwingFactor,
    TransferAgentName,
    ValuationFrequency,
    // Dynamic
    AskNAV,
    AskNAVDate,
    AuMShareClass,
    AuMShareClassDate,
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
    NoSShareClass,
    NoSShareClassDate,
    SplitRatio,
    SplitReferenceDate,
    TaxDeductedReinvestedAmount,
    TaxDeductedReinvestedAmountReferenceDate,
    TaxableIncomeperDividend,
    TaxableIncomeperShareEU,
    TransactionNAV,
    TransactionNAVDate,
    ValuationNAV,
    ValuationNAVDate,
    YieldOneDayGross,
    YieldOneDayNet,
    YieldSevenDayGross,
    YieldSevenDayNet,
    YieldThirtyDayGross,
    YieldThirtyDayNet,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum FundManagerFieldName {
    PortfolioManagerForename,
    PortfolioManagerName,
    PortfolioManagerYearOfBirth,
    PortfolioManagerYearOfExperienceStart,
    PortfolioManagerBriefBiography,
    PortfolioManagerType,
    PortfolioManagerRoleStartingDate,
    PortfolioManagerRoleEndDate,
}
