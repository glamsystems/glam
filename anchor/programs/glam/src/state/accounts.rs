use anchor_lang::prelude::*;

use super::model::*;
use super::openfunds::*;

#[account]
pub struct FundAccount {
    pub name: String,
    pub uri: String,
    pub treasury: Pubkey,
    pub share_classes: Vec<Pubkey>,
    pub openfunds: Pubkey,
    pub openfunds_uri: String,
    pub manager: Pubkey,
    pub engine: Pubkey,
    //  pub params: Vec<Vec<GlamParam>>, // params[0]: EngineFundParams, ...
}
impl FundAccount {
    pub const INIT_SIZE: usize = 1024;
}

#[account]
pub struct FundMetadataAccount {
    pub fund_pubkey: Pubkey,
    pub company: Vec<CompanyField>,
    pub fund: Vec<FundField>,
    pub share_classes: Vec<Vec<ShareClassField>>,
    pub fund_managers: Vec<Vec<FundManagerField>>,
}
impl FundMetadataAccount {
    pub const INIT_SIZE: usize = 1024;
}

impl From<FundModel> for FundMetadataAccount {
    fn from(model: FundModel) -> Self {
        let company = if let Some(company) = &model.company {
            company.into()
        } else {
            vec![]
        };
        let fund_managers = if let Some(manager) = &model.manager {
            vec![manager.into()]
        } else {
            vec![]
        };
        let share_classes = model
            .share_classes
            .iter()
            .map(|share_class| share_class.into())
            .collect::<Vec<_>>();
        let fund = model.into();
        FundMetadataAccount {
            fund_pubkey: Pubkey::default(),
            company,
            fund,
            share_classes,
            fund_managers,
        }
    }
}
