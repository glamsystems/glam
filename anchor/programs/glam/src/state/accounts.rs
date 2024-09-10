use anchor_lang::prelude::*;
use anchor_lang::system_program;

use super::acl::*;
use super::model::*;
use super::openfunds::*;

#[derive(AnchorDeserialize, AnchorSerialize, PartialEq, Clone, Debug, Copy)]
pub enum EngineFieldName {
    TimeCreated,
    IsEnabled,
    Assets,
    AssetsWeights,
    ShareClassAllowlist, // share class
    ShareClassBlocklist, // share class
    DelegateAcls,
    IntegrationAcls,
    ExternalTreasuryAccounts, // external accounts with treasury assets
    LockUp,                   // share class
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
    VecDelegateAcl { val: Vec<DelegateAcl> },
    VecIntegrationAcl { val: Vec<IntegrationAcl> },
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct EngineField {
    pub name: EngineFieldName,
    pub value: EngineFieldValue,
}

#[account]
pub struct FundAccount {
    pub manager: Pubkey,
    pub treasury: Pubkey,
    pub openfunds: Pubkey,
    pub engine: Pubkey,
    pub share_classes: Vec<Pubkey>,
    pub name: String,
    pub uri: String,
    pub openfunds_uri: String,
    pub params: Vec<Vec<EngineField>>, // params[0]: EngineFundParams, ...
                                       // params[1]: EngineShareClass0Params, ...
}
impl FundAccount {
    pub const INIT_SIZE: usize = 1024;

    pub fn is_enabled(&self) -> bool {
        return true;
    }

    // return the share class lockup period in s. 0 == no lockup (default).
    pub fn share_class_lock_up(&self, share_class_id: usize) -> i64 {
        let param_idx = share_class_id + 1;
        for EngineField { name, value } in &self.params[param_idx] {
            match name {
                EngineFieldName::LockUp => {
                    return match value {
                        EngineFieldValue::Timestamp { val: v } => {
                            if *v > 0 {
                                *v
                            } else {
                                0
                            }
                        }
                        _ => 0,
                    };
                }
                _ => { /* ignore */ }
            }
        }
        return 0;
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

    pub fn assets_mut(&mut self) -> Option<&mut Vec<Pubkey>> {
        for EngineField { name, value } in &mut self.params[0] {
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

    pub fn delegate_acls(&self) -> Option<&Vec<DelegateAcl>> {
        for EngineField { name, value } in &self.params[0] {
            match name {
                EngineFieldName::DelegateAcls => {
                    return match value {
                        EngineFieldValue::VecDelegateAcl { val: v } => Some(v),
                        _ => None,
                    };
                }
                _ => { /* ignore */ }
            }
        }
        return None;
    }

    pub fn add_to_engine_field(&mut self, engine_field_name: EngineFieldName, pubkey: Pubkey) {
        // Try to find the MarinadeTickets field, if it exists.
        let mut engine_field = self.params[0]
            .iter_mut()
            .find(|field| field.name == engine_field_name);

        // If the field does not exist, create it and push it to params.
        if engine_field.is_none() {
            msg!("Adding engine field {:?} to fund params", engine_field_name);
            self.params[0].push(EngineField {
                name: engine_field_name,
                value: EngineFieldValue::VecPubkey { val: Vec::new() },
            });
            // Get a mutable reference to the newly created field.
            engine_field = self.params[0]
                .iter_mut()
                .find(|field| field.name == engine_field_name);
        }

        // Now, safely add the ticket to the VecPubkey in the MarinadeTickets field.
        if let Some(EngineField {
            value: EngineFieldValue::VecPubkey { val },
            ..
        }) = engine_field
        {
            val.push(pubkey);
            msg!(
                "Added pubkey {:?} to engine field {:?}",
                pubkey,
                engine_field_name
            );
        }
    }

    pub fn delete_from_engine_field(&mut self, engine_field_name: EngineFieldName, pubkey: Pubkey) {
        for EngineField { name, value } in &mut self.params[0] {
            if *name == engine_field_name {
                if let EngineFieldValue::VecPubkey { val } = value {
                    if let Some(pos) = val.iter().position(|t| *t == pubkey) {
                        val.remove(pos);
                        msg!(
                            "Removed pubkey {:?} from engine field {:?}",
                            pubkey,
                            engine_field_name
                        );
                    }
                }
            }
        }
    }

    pub fn get_pubkeys_from_engine_field(&self, engine_field_name: EngineFieldName) -> Vec<Pubkey> {
        for EngineField { name, value } in &self.params[0] {
            if *name == engine_field_name {
                if let EngineFieldValue::VecPubkey { val } = value {
                    return val.clone();
                }
            }
        }
        Vec::new()
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

// https://github.com/coral-xyz/anchor/blob/v0.30.1/lang/src/common.rs#L6
pub fn close_account_info<'info>(
    info: AccountInfo<'info>,
    sol_destination: AccountInfo<'info>,
) -> std::result::Result<(), ProgramError> {
    let dest_starting_lamports = sol_destination.lamports();
    **sol_destination.lamports.borrow_mut() =
        dest_starting_lamports.checked_add(info.lamports()).unwrap();
    **info.lamports.borrow_mut() = 0;

    info.assign(&system_program::ID);
    info.realloc(0, false)
}
