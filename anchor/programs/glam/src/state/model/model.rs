use anchor_lang::prelude::*;



// Fund
//
// Implemented:
// - Openfunds Fund Essential + Core

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct FundModel {
    // Core
    pub id: Option<Pubkey>,
    pub name: Option<String>,
    pub uri: Option<String>,
    pub openfunds_uri: Option<String>,
    pub is_enabled: Option<bool>,

    // Assets
    pub assets: Vec<Pubkey>,
    pub assets_weights: Vec<u32>,

    // Relationships
    pub share_classes: Vec<ShareClassModel>,
    pub company: Option<CompanyModel>,
    pub manager: Option<ManagerModel>,
    pub created: Option<CreatedModel>,

    // Openfunds
    pub is_raw_openfunds: Option<bool>,
    pub raw_openfunds: Option<FundOpenfundsModel>,
}

// Subset of the Openfunds v2 modelled by Glam
#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct FundOpenfundsModel {
    pub fund_domicile_alpha_2: Option<String>,
    pub legal_fund_name_including_umbrella: Option<String>,
    pub fiscal_year_end: Option<String>,
    pub fund_currency: Option<String>,
    pub fund_launch_date: Option<String>,
    pub investment_objective: Option<String>,
    pub is_etc: Option<bool>,
    pub is_eu_directive_relevant: Option<bool>,
    pub is_fund_of_funds: Option<bool>,
    pub is_passive_fund: Option<bool>,
    pub is_reit: Option<bool>,
    pub legal_form: Option<String>,
    pub legal_fund_name_only: Option<String>,
    pub open_ended_or_closed_ended_fund_structure: Option<String>,
    pub type_of_eu_directive: Option<String>,
    pub ucits_version: Option<String>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct CreatedModel {
    pub key: [u8; 8],
    pub manager: Option<Pubkey>,
}

// Share Class
//
// Implemented:
// - Openfunds Share Class Essential
// - Subset of Core, Additional, Full (e.g. Fees)

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct ShareClassModel {
    // Token
    pub symbol: Option<String>,
    pub name: Option<String>,
    pub uri: Option<String>, // metadata uri

    // Glam
    pub fund_id: Option<Pubkey>,
    pub asset: Option<Pubkey>,
    pub image_uri: Option<String>,

    // Openfund
    pub is_raw_openfunds: Option<bool>,
    pub raw_openfunds: Option<ShareClassOpenfundsModel>,

    // Acls
    pub allowlist: Vec<Pubkey>,
    pub blocklist: Vec<Pubkey>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct ShareClassOpenfundsModel {
    // Essential
    pub isin: Option<String>,
    pub share_class_currency: Option<String>,
    // Core
    // pub applied_subscription_fee_in_favour_of_distributor: Option<String>,
    // pub applied_subscription_fee_in_favour_of_distributor_reference_date: Option<String>,
    pub currency_of_minimal_subscription: Option<String>,
    pub full_share_class_name: Option<String>,
    // pub has_performance_fee: Option<bool>,
    // pub has_subscription_fee_in_favour_of_distributor: Option<bool>,
    pub investment_status: Option<String>,
    // pub management_fee_applied: Option<String>,
    // pub management_fee_applied_reference_date: Option<String>,
    // pub management_fee_maximum: Option<String>,
    // pub maximum_subscription_fee_in_favour_of_distributor: Option<String>,
    pub minimal_initial_subscription_category: Option<String>,
    pub minimal_initial_subscription_in_amount: Option<String>,
    pub minimal_initial_subscription_in_shares: Option<String>,
    // pub minimal_subsequent_subscription_category: Option<String>,
    // pub minimal_subsequent_subscription_in_amount: Option<String>,
    // pub minimal_subsequent_subscription_in_shares: Option<String>,
    // pub minimum_subscription_fee_in_favour_of_distributor: Option<String>,
    pub share_class_distribution_policy: Option<String>,
    pub share_class_extension: Option<String>,
    pub share_class_launch_date: Option<String>,
    pub share_class_lifecycle: Option<String>,
    // Additional
    pub launch_price: Option<String>,
    pub launch_price_currency: Option<String>,
    pub launch_price_date: Option<String>,
    // pub has_applied_subscription_fee_in_favour_of_fund: Option<bool>,
    // pub applied_subscription_fee_in_favour_of_fund: Option<String>,
    // pub applied_subscription_fee_in_favour_of_fund_reference_date: Option<String>,
    // pub maximum_subscription_fee_in_favour_of_fund: Option<String>,
    // pub has_applied_redemption_fee_in_favour_of_fund: Option<bool>,
    // pub applied_redemption_fee_in_favour_of_fund: Option<String>,
    // pub applied_redemption_fee_in_favour_of_fund_reference_date: Option<String>,
    // pub maximum_redemption_fee_in_favour_of_fund: Option<String>,
    // Full
    // pub applied_redemption_fee_in_favour_of_distributor: Option<String>,
    // pub applied_redemption_fee_in_favour_of_distributor_reference_date: Option<String>,
    pub currency_of_minimal_or_maximum_redemption: Option<String>,
    // pub cut_off_date_offset_for_redemption: Option<String>,
    // pub cut_off_date_offset_for_subscription: Option<String>,
    // pub cut_off_time_for_redemption: Option<String>,
    // pub cut_off_time_for_subscription: Option<String>,
    pub has_lock_up_for_redemption: Option<bool>,
    // pub has_redemption_fee_in_favour_of_distributor: Option<bool>,
    pub is_valid_isin: Option<bool>,
    pub lock_up_comment: Option<String>,
    pub lock_up_period_in_days: Option<String>,
    // pub management_fee_minimum: Option<String>,
    // pub maximal_number_of_possible_decimals_amount: Option<String>,
    // pub maximal_number_of_possible_decimals_nav: Option<String>,
    // pub maximal_number_of_possible_decimals_shares: Option<String>,
    pub maximum_initial_redemption_in_amount: Option<String>,
    pub maximum_initial_redemption_in_shares: Option<String>,
    // pub maximum_redemption_fee_in_favour_of_distributor: Option<String>,
    // pub maximum_subsequent_redemption_in_amount: Option<String>,
    // pub maximum_subsequent_redemption_in_shares: Option<String>,
    pub minimal_initial_redemption_in_amount: Option<String>,
    pub minimal_initial_redemption_in_shares: Option<String>,
    pub minimal_redemption_category: Option<String>,
    // pub minimal_subsequent_redemption_in_amount: Option<String>,
    // pub minimal_subsequent_redemption_in_shares: Option<String>,
    // pub minimum_redemption_fee_in_favour_of_distributor: Option<String>,
    // pub minimum_redemption_fee_in_favour_of_fund: Option<String>,
    // pub minimum_subscription_fee_in_favour_of_fund: Option<String>,
    // pub performance_fee_minimum: Option<String>,
    // pub rounding_method_for_prices: Option<String>,
    // pub rounding_method_for_redemption_in_amount: Option<String>,
    // pub rounding_method_for_redemption_in_shares: Option<String>,
    // pub rounding_method_for_subscription_in_amount: Option<String>,
    // pub rounding_method_for_subscription_in_shares: Option<String>,
    pub share_class_dividend_type: Option<String>,
    // Full | Country
    pub cusip: Option<String>,
    pub valor: Option<String>,
}

// Company
//
// Implemented:
// - Openfunds Company Essential + Core + fields: email, website

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct CompanyModel {
    // Openfunds
    pub fund_group_name: Option<String>,
    pub man_co: Option<String>,
    pub domicile_of_man_co: Option<String>,
    pub email_address_of_man_co: Option<String>,
    pub fund_website_of_man_co: Option<String>,
}

// Fund Manager
//
// Implemented:
// - Openfunds fields: name
// - Single manager, regular wallet
// - Squads

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct ManagerModel {
    // Openfunds
    pub portfolio_manager_name: Option<String>,
    // Glam
    pub pubkey: Option<Pubkey>,
    pub kind: Option<ManagerKind>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum ManagerKind {
    Wallet,
    Squads,
}
