use anchor_lang::prelude::*;

// Openfund v2.0 Fund

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum FundFieldName {
    // Essential
    FundDomicileAlpha2,             // impl
    FundDomicileAlpha3,             // not impl
    LegalFundNameIncludingUmbrella, // impl
    // Core
    FiscalYearEnd,                       // impl
    FundCurrency,                        // impl
    FundLaunchDate,                      // impl
    InvestmentObjective,                 // impl
    IsETC,                               // impl (no ui)
    IsEUDirectiveRelevant,               // impl (no ui)
    IsFundOfFunds,                       // impl
    IsPassiveFund,                       // impl
    IsREIT,                              // impl (no ui)
    LegalForm,                           // impl
    LegalFundNameOnly,                   // impl (no ui)
    OpenEndedOrClosedEndedFundStructure, // impl
    TypeOfEUDirective,                   // impl (no ui)
    UCITSVersion,                        // impl (no ui)
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
    AuMFund,     // impl (api)
    AuMFundDate, // impl (api)
    NoSFund,     // impl (api)
    NoSFundDate, // impl (api)
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct FundField {
    pub name: FundFieldName,
    pub value: String,
}
