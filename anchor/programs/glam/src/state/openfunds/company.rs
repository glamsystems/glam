use anchor_lang::prelude::*;

// Openfunds v2.0 Company + Umbrella

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum CompanyFieldName {
    // Essential
    FundGroupName, // impl
    // Core
    ManCo,           // impl
    DomicileOfManCo, // impl
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
    EmailAddressOfManCo, // impl
    FundWebsiteofManCo,  // impl
    IsUNPRISignatory,
    PhoneCountryCodeofManCo,
    PhoneNumberofManCo,
    SubInvestmentAdvisorName,
    ZIPCodeofManCo,
    // Umbrella Core
    DomicileOfUmbrella,
    HasUmbrella,
    LEIOfUmbrella,
    Umbrella,
    // Umbrella Full
    GlobalIntermediaryIdentificationNumberOfUmbrella,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct CompanyField {
    pub name: CompanyFieldName,
    pub value: String,
}
