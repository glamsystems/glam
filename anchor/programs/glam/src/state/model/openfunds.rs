use anchor_lang::prelude::*;

use super::super::openfunds::*;
use super::*;

// Given a Model, derive the corresponding Openfund fields

// Fund

impl From<FundModel> for Vec<FundField> {
    fn from(model: FundModel) -> Self {
        let mut res = vec![];
        // Raw Openfund fields
        if let Some(model) = model.raw_openfunds {
            vec![
                (
                    model.fund_domicile_alpha_2,
                    FundFieldName::FundDomicileAlpha2,
                ),
                (
                    model.legal_fund_name_including_umbrella,
                    FundFieldName::LegalFundNameIncludingUmbrella,
                ),
                (model.fiscal_year_end, FundFieldName::FiscalYearEnd),
                (model.fund_currency, FundFieldName::FundCurrency),
                (model.fund_launch_date, FundFieldName::FundLaunchDate),
                (
                    model.investment_objective,
                    FundFieldName::InvestmentObjective,
                ),
                (bool2string(model.is_etc), FundFieldName::IsETC),
                (
                    bool2string(model.is_eu_directive_relevant),
                    FundFieldName::IsEUDirectiveRelevant,
                ),
                (
                    bool2string(model.is_fund_of_funds),
                    FundFieldName::IsFundOfFunds,
                ),
                (
                    bool2string(model.is_passive_fund),
                    FundFieldName::IsPassiveFund,
                ),
                (bool2string(model.is_reit), FundFieldName::IsREIT),
                (model.legal_form, FundFieldName::LegalForm),
                (model.legal_fund_name_only, FundFieldName::LegalFundNameOnly),
                (
                    model.open_ended_or_closed_ended_fund_structure,
                    FundFieldName::OpenEndedOrClosedEndedFundStructure,
                ),
                (model.type_of_eu_directive, FundFieldName::TypeOfEUDirective),
                (model.ucits_version, FundFieldName::UCITSVersion),
            ]
            .iter()
            .for_each(|(value, field)| {
                if let Some(value) = value {
                    res.push(FundField {
                        name: field.clone(),
                        value: value.clone(),
                    })
                }
            });
        }
        // Derived fields
        let is_raw_openfunds = model.is_raw_openfunds.unwrap_or(false);
        if !is_raw_openfunds {
            //TODO
        }
        res
    }
}

// Share Class

impl From<&ShareClassModel> for Vec<ShareClassField> {
    fn from(model: &ShareClassModel) -> Self {
        let mut res = vec![];
        // Derived fields
        let is_raw_openfunds = model.is_raw_openfunds.unwrap_or(false);
        let model = model.clone();
        if !is_raw_openfunds {
            //TODO
            let v: Vec<(Option<String>, ShareClassFieldName)> = vec![
                (pubkey2string(model.fund_id), ShareClassFieldName::FundId),
                (model.image_uri, ShareClassFieldName::ImageUri),
            ];
            v.iter().for_each(|(value, field)| {
                if let Some(value) = value {
                    let value = value.to_string();
                    res.push(ShareClassField {
                        name: field.clone(),
                        value: value.clone(),
                    })
                }
            });
        }
        // Raw Openfund fields
        if let Some(model) = model.raw_openfunds.clone() {
            //TODO
            vec![
                // Essential
                (model.isin, ShareClassFieldName::ISIN),
                (
                    model.share_class_currency,
                    ShareClassFieldName::ShareClassCurrency,
                ),
                // Core
                // (
                //     model.applied_subscription_fee_in_favour_of_distributor,
                //     ShareClassFieldName::AppliedSubscriptionFeeInFavourOfDistributor,
                // ),
                // (
                //     model.applied_subscription_fee_in_favour_of_distributor_reference_date,
                //     ShareClassFieldName::AppliedSubscriptionFeeInFavourOfDistributorReferenceDate,
                // ),
                (
                    model.currency_of_minimal_subscription,
                    ShareClassFieldName::CurrencyOfMinimalSubscription,
                ),
                (
                    model.full_share_class_name,
                    ShareClassFieldName::FullShareClassName,
                ),
                // (
                //     bool2string(model.has_performance_fee),
                //     ShareClassFieldName::HasPerformanceFee,
                // ),
                // (
                //     bool2string(model.has_subscription_fee_in_favour_of_distributor),
                //     ShareClassFieldName::HasSubscriptionFeeInFavourOfDistributor,
                // ),
                (
                    model.investment_status,
                    ShareClassFieldName::InvestmentStatus,
                ),
                // (
                //     model.management_fee_applied,
                //     ShareClassFieldName::ManagementFeeApplied,
                // ),
                // (
                //     model.management_fee_applied_reference_date,
                //     ShareClassFieldName::ManagementFeeAppliedReferenceDate,
                // ),
                // (
                //     model.management_fee_maximum,
                //     ShareClassFieldName::ManagementFeeMaximum,
                // ),
                // (
                //     model.maximum_subscription_fee_in_favour_of_distributor,
                //     ShareClassFieldName::MaximumSubscriptionFeeInFavourOfDistributor,
                // ),
                (
                    model.minimal_initial_subscription_category,
                    ShareClassFieldName::MinimalInitialSubscriptionCategory,
                ),
                (
                    model.minimal_initial_subscription_in_amount,
                    ShareClassFieldName::MinimalInitialSubscriptionInAmount,
                ),
                (
                    model.minimal_initial_subscription_in_shares,
                    ShareClassFieldName::MinimalInitialSubscriptionInShares,
                ),
                // (
                //     model.minimal_subsequent_subscription_category,
                //     ShareClassFieldName::MinimalSubsequentSubscriptionCategory,
                // ),
                // (
                //     model.minimal_subsequent_subscription_in_amount,
                //     ShareClassFieldName::MinimalSubsequentSubscriptionInAmount,
                // ),
                // (
                //     model.minimal_subsequent_subscription_in_shares,
                //     ShareClassFieldName::MinimalSubsequentSubscriptionInShares,
                // ),
                // (
                //     model.minimum_subscription_fee_in_favour_of_distributor,
                //     ShareClassFieldName::MinimumSubscriptionFeeInFavourOfDistributor,
                // ),
                (
                    model.share_class_distribution_policy,
                    ShareClassFieldName::ShareClassDistributionPolicy,
                ),
                (
                    model.share_class_extension,
                    ShareClassFieldName::ShareClassExtension,
                ),
                (
                    model.share_class_launch_date,
                    ShareClassFieldName::ShareClassLaunchDate,
                ),
                (
                    model.share_class_lifecycle,
                    ShareClassFieldName::ShareClassLifecycle,
                ),
                // Additional
                (model.launch_price, ShareClassFieldName::LaunchPrice),
                (
                    model.launch_price_currency,
                    ShareClassFieldName::LaunchPriceCurrency,
                ),
                (
                    model.launch_price_date,
                    ShareClassFieldName::LaunchPriceDate,
                ),
                // (
                //     bool2string(model.has_applied_subscription_fee_in_favour_of_fund),
                //     ShareClassFieldName::HasAppliedSubscriptionFeeInFavourOfFund,
                // ),
                // (
                //     model.applied_subscription_fee_in_favour_of_fund,
                //     ShareClassFieldName::AppliedSubscriptionFeeInFavourOfFund,
                // ),
                // (
                //     model.applied_subscription_fee_in_favour_of_fund_reference_date,
                //     ShareClassFieldName::AppliedSubscriptionFeeInFavourOfFundReferenceDate,
                // ),
                // (
                //     model.maximum_subscription_fee_in_favour_of_fund,
                //     ShareClassFieldName::MaximumSubscriptionFeeInFavourOfFund,
                // ),
                // (
                //     bool2string(model.has_applied_redemption_fee_in_favour_of_fund),
                //     ShareClassFieldName::HasAppliedRedemptionFeeInFavourOfFund,
                // ),
                // (
                //     model.applied_redemption_fee_in_favour_of_fund,
                //     ShareClassFieldName::AppliedRedemptionFeeInFavourOfFund,
                // ),
                // (
                //     model.applied_redemption_fee_in_favour_of_fund_reference_date,
                //     ShareClassFieldName::AppliedRedemptionFeeInFavourOfFundReferenceDate,
                // ),
                // (
                //     model.maximum_redemption_fee_in_favour_of_fund,
                //     ShareClassFieldName::MaximumRedemptionFeeInFavourOfFund,
                // ),
                // Full
                // (
                //     model.applied_redemption_fee_in_favour_of_distributor,
                //     ShareClassFieldName::AppliedRedemptionFeeInFavourOfDistributor,
                // ),
                // (
                //     model.applied_redemption_fee_in_favour_of_distributor_reference_date,
                //     ShareClassFieldName::AppliedRedemptionFeeInFavourOfDistributorReferenceDate,
                // ),
                (
                    model.currency_of_minimal_or_maximum_redemption,
                    ShareClassFieldName::CurrencyOfMinimalOrMaximumRedemption,
                ),
                // (
                //     model.cut_off_date_offset_for_redemption,
                //     ShareClassFieldName::CutOffDateOffsetForRedemption,
                // ),
                // (
                //     model.cut_off_date_offset_for_subscription,
                //     ShareClassFieldName::CutOffDateOffsetForSubscription,
                // ),
                // (
                //     model.cut_off_time_for_redemption,
                //     ShareClassFieldName::CutOffTimeForRedemption,
                // ),
                // (
                //     model.cut_off_time_for_subscription,
                //     ShareClassFieldName::CutOffTimeForSubscription,
                // ),
                (
                    bool2string(model.has_lock_up_for_redemption),
                    ShareClassFieldName::HasLockUpForRedemption,
                ),
                // (
                //     bool2string(model.has_redemption_fee_in_favour_of_distributor),
                //     ShareClassFieldName::HasRedemptionFeeInFavourOfDistributor,
                // ),
                (
                    bool2string(model.is_valid_isin),
                    ShareClassFieldName::IsValidISIN,
                ),
                (model.lock_up_comment, ShareClassFieldName::LockUpComment),
                (
                    model.lock_up_period_in_days,
                    ShareClassFieldName::LockUpPeriodInDays,
                ),
                // (
                //     model.management_fee_minimum,
                //     ShareClassFieldName::ManagementFeeMinimum,
                // ),
                // (
                //     model.maximal_number_of_possible_decimals_amount,
                //     ShareClassFieldName::MaximalNumberOfPossibleDecimalsAmount,
                // ),
                // (
                //     model.maximal_number_of_possible_decimals_nav,
                //     ShareClassFieldName::MaximalNumberOfPossibleDecimalsNAV,
                // ),
                // (
                //     model.maximal_number_of_possible_decimals_shares,
                //     ShareClassFieldName::MaximalNumberOfPossibleDecimalsShares,
                // ),
                (
                    model.maximum_initial_redemption_in_amount,
                    ShareClassFieldName::MaximumInitialRedemptionInAmount,
                ),
                (
                    model.maximum_initial_redemption_in_shares,
                    ShareClassFieldName::MaximumInitialRedemptionInShares,
                ),
                // (
                //     model.maximum_redemption_fee_in_favour_of_distributor,
                //     ShareClassFieldName::MaximumRedemptionFeeInFavourOfDistributor,
                // ),
                // (
                //     model.maximum_subsequent_redemption_in_amount,
                //     ShareClassFieldName::MaximumSubsequentRedemptionInAmount,
                // ),
                // (
                //     model.maximum_subsequent_redemption_in_shares,
                //     ShareClassFieldName::MaximumSubsequentRedemptionInShares,
                // ),
                (
                    model.minimal_initial_redemption_in_amount,
                    ShareClassFieldName::MinimalInitialRedemptionInAmount,
                ),
                (
                    model.minimal_initial_redemption_in_shares,
                    ShareClassFieldName::MinimalInitialRedemptionInShares,
                ),
                (
                    model.minimal_redemption_category,
                    ShareClassFieldName::MinimalRedemptionCategory,
                ),
                // (
                //     model.minimal_subsequent_redemption_in_amount,
                //     ShareClassFieldName::MinimalSubsequentRedemptionInAmount,
                // ),
                // (
                //     model.minimal_subsequent_redemption_in_shares,
                //     ShareClassFieldName::MinimalSubsequentRedemptionInShares,
                // ),
                // (
                //     model.minimum_redemption_fee_in_favour_of_distributor,
                //     ShareClassFieldName::MinimumRedemptionFeeInFavourOfDistributor,
                // ),
                // (
                //     model.minimum_redemption_fee_in_favour_of_fund,
                //     ShareClassFieldName::MinimumRedemptionFeeInFavourOfFund,
                // ),
                // (
                //     model.minimum_subscription_fee_in_favour_of_fund,
                //     ShareClassFieldName::MinimumSubscriptionFeeInFavourOfFund,
                // ),
                // (
                //     model.performance_fee_minimum,
                //     ShareClassFieldName::PerformanceFeeMinimum,
                // ),
                // (
                //     model.rounding_method_for_prices,
                //     ShareClassFieldName::RoundingMethodForPrices,
                // ),
                // (
                //     model.rounding_method_for_redemption_in_amount,
                //     ShareClassFieldName::RoundingMethodForRedemptionInAmount,
                // ),
                // (
                //     model.rounding_method_for_redemption_in_shares,
                //     ShareClassFieldName::RoundingMethodForRedemptionInShares,
                // ),
                // (
                //     model.rounding_method_for_subscription_in_amount,
                //     ShareClassFieldName::RoundingMethodForSubscriptionInAmount,
                // ),
                // (
                //     model.rounding_method_for_subscription_in_shares,
                //     ShareClassFieldName::RoundingMethodForSubscriptionInShares,
                // ),
                (
                    model.share_class_dividend_type,
                    ShareClassFieldName::ShareClassDividendType,
                ),
                // Full | Country
                (model.cusip, ShareClassFieldName::CUSIP),
                (model.valor, ShareClassFieldName::Valor),
            ]
            .iter()
            .for_each(|(value, field)| {
                if let Some(value) = value {
                    res.push(ShareClassField {
                        name: field.clone(),
                        value: value.clone(),
                    })
                }
            });
        }
        res
    }
}

// Company

impl From<&CompanyModel> for Vec<CompanyField> {
    fn from(model: &CompanyModel) -> Self {
        let model = model.clone();
        let mut res = vec![];
        vec![
            (model.fund_group_name, CompanyFieldName::FundGroupName),
            (model.man_co, CompanyFieldName::ManCo),
            (model.domicile_of_man_co, CompanyFieldName::DomicileOfManCo),
            (
                model.email_address_of_man_co,
                CompanyFieldName::EmailAddressOfManCo,
            ),
            (
                model.fund_website_of_man_co,
                CompanyFieldName::FundWebsiteofManCo,
            ),
        ]
        .iter()
        .for_each(|(value, field)| {
            if let Some(value) = value {
                res.push(CompanyField {
                    name: field.clone(),
                    value: value.clone(),
                })
            }
        });
        res
    }
}

// Fund Manager

impl From<&ManagerModel> for Vec<FundManagerField> {
    fn from(model: &ManagerModel) -> Self {
        let model = model.clone();
        let mut res = vec![];
        vec![(
            model.portfolio_manager_name,
            FundManagerFieldName::PortfolioManagerName,
        )]
        .iter()
        .for_each(|(value, field)| {
            if let Some(value) = value {
                res.push(FundManagerField {
                    name: field.clone(),
                    value: value.clone(),
                })
            }
        });
        res
    }
}

// Utils

fn bool2string(option: Option<bool>) -> Option<String> {
    if let Some(value) = option {
        return Some(if value {
            "yes".to_string()
        } else {
            "no".to_string()
        });
    }
    None
}

fn pubkey2string(option: Option<Pubkey>) -> Option<String> {
    if let Some(value) = option {
        return Some(value.to_string());
    }
    None
}
