use anchor_lang::prelude::*;
use anchor_lang::system_program;

use super::acl::*;
use super::model::*;
use super::openfunds::*;

#[derive(AnchorDeserialize, AnchorSerialize, PartialEq, Clone, Debug, Copy)]
pub enum EngineFieldName {
    ShareClassAllowlist,   // share class
    ShareClassBlocklist,   // share class
    ExternalVaultAccounts, // external accounts with vault assets
    LockUp,                // share class
    DriftMarketIndexesPerp,
    DriftMarketIndexesSpot,
    DriftOrderTypes,
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
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct EngineField {
    pub name: EngineFieldName,
    pub value: EngineFieldValue,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug, PartialEq)]
pub enum AccountType {
    Vault,
    Mint,
    Fund,
    // ... more account types
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug, PartialEq, Copy)]
pub enum MetadataType {
    Openfunds,
    // ... more metadata types
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct Metadata {
    pub template: MetadataType,
    pub pubkey: Pubkey, // metadata account pubkey
    pub uri: String,
}

#[account]
pub struct StateAccount {
    pub account_type: AccountType,
    pub owner: Pubkey,
    pub vault: Pubkey,
    pub enabled: bool,
    pub created: i64,
    pub engine: Pubkey,
    pub mints: Vec<Pubkey>,
    pub metadata: Option<Metadata>,
    pub name: String,
    pub uri: String,
    pub assets: Vec<Pubkey>,
    pub delegate_acls: Vec<DelegateAcl>,
    pub integrations: Vec<Integration>,

    // params[0]: state params
    // params[1..n+1]: mints [0..n] params
    pub params: Vec<Vec<EngineField>>,
}
impl StateAccount {
    pub const INIT_SIZE: usize = 2048; // TODO: auto extend account size if needed

    // return the share class lockup period in s. 0 == no lockup (default).
    pub fn share_class_lock_up(&self, share_class_id: usize) -> i64 {
        self.params
            .get(share_class_id + 1)
            .and_then(|params| {
                params
                    .iter()
                    .find(|EngineField { name, .. }| *name == EngineFieldName::LockUp)
                    .and_then(|EngineField { value, .. }| match value {
                        EngineFieldValue::Timestamp { val: v } if *v > 0 => Some(*v),
                        _ => None,
                    })
            })
            .unwrap_or(0)
    }

    pub fn share_class_allowlist(&self, share_class_id: usize) -> Option<&Vec<Pubkey>> {
        self.params.get(share_class_id + 1).and_then(|params| {
            params
                .iter()
                .find(|EngineField { name, .. }| *name == EngineFieldName::ShareClassAllowlist)
                .and_then(|EngineField { value, .. }| match value {
                    EngineFieldValue::VecPubkey { val } => Some(val),
                    _ => None,
                })
        })
    }

    pub fn share_class_allowlist_mut(&mut self, share_class_id: usize) -> Option<&mut Vec<Pubkey>> {
        self.params.get_mut(share_class_id + 1).and_then(|params| {
            params
                .iter_mut()
                .find(|EngineField { name, .. }| *name == EngineFieldName::ShareClassAllowlist)
                .and_then(|EngineField { value, .. }| match value {
                    EngineFieldValue::VecPubkey { val } => Some(val),
                    _ => None,
                })
        })
    }

    pub fn share_class_blocklist(&self, share_class_id: usize) -> Option<&Vec<Pubkey>> {
        self.params.get(share_class_id + 1).and_then(|params| {
            params
                .iter()
                .find(|EngineField { name, .. }| *name == EngineFieldName::ShareClassBlocklist)
                .and_then(|EngineField { value, .. }| match value {
                    EngineFieldValue::VecPubkey { val } => Some(val),
                    _ => None,
                })
        })
    }

    pub fn share_class_blocklist_mut(&mut self, share_class_id: usize) -> Option<&mut Vec<Pubkey>> {
        self.params.get_mut(share_class_id + 1).and_then(|params| {
            params
                .iter_mut()
                .find(|EngineField { name, .. }| *name == EngineFieldName::ShareClassBlocklist)
                .and_then(|EngineField { value, .. }| match value {
                    EngineFieldValue::VecPubkey { val } => Some(val),
                    _ => None,
                })
        })
    }

    pub fn drift_order_types(&self) -> Option<&Vec<u32>> {
        self.params.get(0).and_then(|params| {
            params
                .iter()
                .find(|EngineField { name, .. }| *name == EngineFieldName::DriftOrderTypes)
                .and_then(|EngineField { value, .. }| match value {
                    EngineFieldValue::VecU32 { val } => Some(val),
                    _ => None,
                })
        })
    }

    pub fn drift_market_indexes_perp(&self) -> Option<&Vec<u32>> {
        self.params.get(0).and_then(|params| {
            params
                .iter()
                .find(|EngineField { name, .. }| *name == EngineFieldName::DriftMarketIndexesPerp)
                .and_then(|EngineField { value, .. }| match value {
                    EngineFieldValue::VecU32 { val } => Some(val),
                    _ => None,
                })
        })
    }

    pub fn drift_market_indexes_spot(&self) -> Option<&Vec<u32>> {
        self.params.get(0).and_then(|params| {
            params
                .iter()
                .find(|EngineField { name, .. }| *name == EngineFieldName::DriftMarketIndexesSpot)
                .and_then(|EngineField { value, .. }| match value {
                    EngineFieldValue::VecU32 { val } => Some(val),
                    _ => None,
                })
        })
    }

    pub fn add_to_engine_field(&mut self, engine_field_name: EngineFieldName, pubkey: Pubkey) {
        let mut engine_field = self.params.get_mut(0).and_then(|params| {
            params
                .iter_mut()
                .find(|field| field.name == engine_field_name)
        });

        // If the field does not exist, create it and push it to params.
        if engine_field.is_none() {
            msg!(
                "Adding engine field {:?} to state params",
                engine_field_name
            );
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
        if let Some(field) = self
            .params
            .get_mut(0)
            .and_then(|params| params.iter_mut().find(|f| f.name == engine_field_name))
        {
            if let EngineFieldValue::VecPubkey { val } = &mut field.value {
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
pub struct OpenfundsMetadataAccount {
    pub fund_id: Pubkey,
    pub company: Vec<CompanyField>,
    pub fund: Vec<FundField>,
    pub share_classes: Vec<Vec<ShareClassField>>,
    pub fund_managers: Vec<Vec<FundManagerField>>,
}
impl OpenfundsMetadataAccount {
    pub const INIT_SIZE: usize = 1024;
}

impl From<StateModel> for OpenfundsMetadataAccount {
    fn from(model: StateModel) -> Self {
        let fund = model.clone().into();
        let company = model.company.as_ref().map(|c| c.into()).unwrap_or_default();
        let fund_managers = model
            .owner
            .as_ref()
            .map(|m| vec![m.into()])
            .unwrap_or_default();

        let share_classes = model
            .mints
            .unwrap_or_default()
            .iter()
            .map(|share_class| share_class.into())
            .collect::<Vec<_>>();

        OpenfundsMetadataAccount {
            fund_id: Pubkey::default(),
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
