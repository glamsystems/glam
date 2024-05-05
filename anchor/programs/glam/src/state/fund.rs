use anchor_lang::prelude::*;

use super::model::*;
use super::openfund::*;

pub const MAX_ASSETS: usize = 5;
pub const MAX_SHARE_CLASSES: usize = 3;
pub const MAX_FUND_NAME: usize = 50;
pub const MAX_FUND_SYMBOL: usize = 20;
pub const MAX_FUND_URI: usize = 100;

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum OFKey {
    Symbol,
    TimeCreated,
    Active,
    Hello,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum OFValue {
    // openfund
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
pub struct GlamParam {
    pub key: OFKey,
    pub val: OFValue,
}

#[account]
pub struct FundAccount {
    pub name: String,
    pub uri: String,
    pub treasury: Pubkey,
    pub share_classes: Vec<Pubkey>,
    pub openfund: Pubkey,
    pub openfund_uri: String,
    pub manager: Pubkey,
    pub engine: Pubkey,
    pub params: Vec<Vec<GlamParam>>, // params[0]: EngineFundParams, ...
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

pub enum EngineModule {
    Drift,
    Squads,
    Marinade,
    Orca,
    Jupiter,
}

pub struct EngineFundParams {
    pub create_manager: Pubkey,
    pub create_name: String,
    pub create_bump: u8,
    pub create_time: i64,
    pub assets: Vec<Pubkey>,
    pub assets_weigths: Vec<u32>,
    pub manager_kind: ManagerKind,
    pub external_aum: u64,
    pub external_aum_timestamp: i64,
    pub mods_enabled: Vec<EngineModule>,
    pub mods_drift_delegated_account: Pubkey,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum ShareClassStatus {
    Open,
    SoftClosed,
    HardClosed,
    ClosedForRedemption,
    ClosedForSubscriptionAndRedemption,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct EngineShareClassParams {
    pub status: ShareClassStatus,
    pub subscribe_filter: bool,
    pub subscribe_allow_list: Vec<Pubkey>,
    pub subscribe_deny_list: Vec<Pubkey>,
}

#[account]
pub struct Fund {
    pub manager: Pubkey,  // 32
    pub treasury: Pubkey, // 32
    pub assets_len: u8,   // 1
    pub assets: [Pubkey; MAX_ASSETS],
    pub assets_weights: [u32; MAX_ASSETS], // (32 + 4) * MAX_ASSETS
    pub share_classes_len: u8,             // 1
    pub share_classes: [Pubkey; MAX_SHARE_CLASSES],
    pub share_classes_metadata: [ShareClassMetadata; MAX_SHARE_CLASSES],
    pub share_classes_bumps: [u8; MAX_SHARE_CLASSES], // (32 + 1) * MAX_SHARE_CLASSES
    pub time_created: i64,                            // 8
    pub bump_fund: u8,                                // 1
    pub bump_treasury: u8,                            // 1
    pub name: String,                                 // max MAX_FUND_NAME chars
    pub symbol: String,                               // max MAX_FUND_SYMBOL chars
    pub uri: String,                                  // max MAX_FUND_URI chars
    pub is_active: bool,                              // 1
}
impl Fund {
    pub const INIT_SIZE: usize = 1024;
}

#[account]
pub struct Treasury {
    pub manager: Pubkey,
    pub fund: Pubkey,
    pub bump: u8,
}
impl Treasury {
    pub const INIT_SIZE: usize = 32 + 32 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ShareClassMetadata {
    pub name: String,                 // MAX_FUND_NAME
    pub symbol: String,               // MAX_FUND_SYMBOL
    pub uri: String,                  // MAX_FUND_URI
    pub share_class_asset: String,    // 20
    pub share_class_asset_id: Pubkey, // 32
    pub isin: String,                 // 20
    pub status: String,               // 20
    pub fee_management: i32,          // 4, 1_000_000 == 1%
    pub fee_performance: i32,         // 4, 1_000_000 == 1%
    pub policy_distribution: String,  // 20
    pub extension: String,            // 20
    pub launch_date: String,          // 20
    pub lifecycle: String,            // 20
    pub image_uri: String,            // 100
}
impl ShareClassMetadata {
    // use the same max sizes as Fund
    // more space needed for two reasons:
    // 1. we need to support additional metadata
    // 2. for each KV pair in metadata, keys ("name" etc) also take up space
    pub const INIT_SIZE: usize = MAX_FUND_NAME + MAX_FUND_SYMBOL + MAX_FUND_URI + 500;
}

// #[cfg(test)]
// mod tests {
//     use super::*;

//     #[test]
//     fn from_conversion() {
//         let of = OpenfundFund {
//             FundDomicileAlpha2: "100 Some St., San Francisco, CA, 94100, US".to_string(),
//             FundDomicileAlpha3: "".to_string(),
//             LegalFundNameIncludingUmbrella: "Fund in SF".to_string(),
//         };

//         let m = Map::from(of.clone());
//         println!("map={:#?}", m);

//         let of2: OpenfundFund = m.into();
//         println!("of={:#?}", of2);

//         assert!(of == of2);
//     }
// }
