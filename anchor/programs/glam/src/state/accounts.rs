use anchor_lang::prelude::*;

use super::acl::*;
use super::model::*;
use super::openfunds::*;

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum EngineFieldName {
    TimeCreated,
    IsEnabled,
    Assets,
    AssetsWeights,
    ShareClassAllowlist,
    ShareClassBlocklist,
    Acls,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum EngineFieldValue {
    // openfunds
    Boolean { val: bool },
    Date { val: String }, // YYYY-MM-DD
    Double { val: i64 },
    Integer { val: i32 },
    String { val: String },
    Time { val: String }, // hh:mm (24 hour)
    // more types
    U8 { val: u8 },
    U64 { val: u64 },
    Pubkey { val: Pubkey },
    Percentage { val: u32 }, // 100% = 1_000_000
    URI { val: String },
    Timestamp { val: i64 },
    VecPubkey { val: Vec<Pubkey> },
    VecU32 { val: Vec<u32> },
    VecAcl { val: Vec<Acl> },
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct EngineField {
    pub name: EngineFieldName,
    pub value: EngineFieldValue,
}

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
    pub params: Vec<Vec<EngineField>>, // params[0]: EngineFundParams, ...
                                       // params[1]: EngineShareClass0Params, ...
}
impl FundAccount {
    pub const INIT_SIZE: usize = 1024;

    pub fn is_enabled(&self) -> bool {
        return true;
    }

    pub fn share_class_allowlist(&self, share_class_id: usize) -> Option<&Vec<Pubkey>> {
        // params[1]: share class 0 acls
        // params[2]: share class 1 acls
        // ...
        let param_idx = share_class_id + 1;
        for EngineField { name, value } in &self.params[param_idx] {
            match name {
                EngineFieldName::ShareClassAllowlist => {
                    return match value {
                        EngineFieldValue::VecPubkey { val: v } => Some(v),
                        _ => None,
                    };
                }
                _ => { /* ignore */ }
            }
        }
        return None;
    }

    pub fn share_class_blocklist(&self, share_class_id: usize) -> Option<&Vec<Pubkey>> {
        // params[1]: share class 0 acls
        // params[2]: share class 1 acls
        // ...
        let param_idx = share_class_id + 1;
        for EngineField { name, value } in &self.params[param_idx] {
            match name {
                EngineFieldName::ShareClassBlocklist => {
                    return match value {
                        EngineFieldValue::VecPubkey { val: v } => Some(v),
                        _ => None,
                    };
                }
                _ => { /* ignore */ }
            }
        }
        return None;
    }

    pub fn assets(&self) -> Option<&Vec<Pubkey>> {
        for EngineField { name, value } in &self.params[0] {
            match name {
                EngineFieldName::Assets => {
                    return match value {
                        EngineFieldValue::VecPubkey { val: v } => Some(v),
                        _ => None,
                    };
                }
                _ => { /* ignore */ }
            }
        }
        return None;
    }

    pub fn assets_weights(&self) -> Option<&Vec<u32>> {
        for EngineField { name, value } in &self.params[0] {
            match name {
                EngineFieldName::AssetsWeights => {
                    return match value {
                        EngineFieldValue::VecU32 { val: v } => Some(v),
                        _ => None,
                    };
                }
                _ => { /* ignore */ }
            }
        }
        return None;
    }

    pub fn acls(&self) -> Option<&Vec<Acl>> {
        for EngineField { name, value } in &self.params[0] {
            match name {
                EngineFieldName::Acls => {
                    return match value {
                        EngineFieldValue::VecAcl { val: v } => Some(v),
                        _ => None,
                    };
                }
                _ => { /* ignore */ }
            }
        }
        return None;
    }
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
