use anchor_lang::prelude::*;

// Openfunds v2.0 Fund Manager

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum FundManagerFieldName {
    PortfolioManagerForename,
    PortfolioManagerName, // impl
    PortfolioManagerYearOfBirth,
    PortfolioManagerYearOfExperienceStart,
    PortfolioManagerBriefBiography,
    PortfolioManagerType,
    PortfolioManagerRoleStartingDate,
    PortfolioManagerRoleEndDate,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct FundManagerField {
    pub name: FundManagerFieldName,
    pub value: String,
}
