use anchor_lang::prelude::*;

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

// impl From<OpenfundFund> for Map {
//     fn from(of: OpenfundFund) -> Self {
//         let mut v = vec![];
//         if of.FundDomicileAlpha2 != "" {
//             v.push(KV(
//                 "Fund Domicile Alpha-2".to_string(),
//                 Value::String(of.FundDomicileAlpha2),
//             ))
//         }
//         if of.FundDomicileAlpha3 != "" {
//             v.push(KV(
//                 "Fund Domicile Alpha-3".to_string(),
//                 Value::String(of.FundDomicileAlpha3),
//             ))
//         }
//         if of.LegalFundNameIncludingUmbrella != "" {
//             v.push(KV(
//                 "Legal Fund Name Including Umbrella".to_string(),
//                 Value::String(of.LegalFundNameIncludingUmbrella),
//             ))
//         }
//         v
//     }
// }

// impl From<Map> for OpenfundFund {
//     fn from(m: Map) -> Self {
//         let mut of = OpenfundFund::default();
//         for kv in m.iter() {
//             match kv.clone().1 {
//                 Value::String(v) => match kv.0.as_str() {
//                     "Fund Domicile Alpha-2" => of.FundDomicileAlpha2 = v.to_string(),
//                     "Fund Domicile Alpha-3" => of.FundDomicileAlpha3 = v.to_string(),
//                     "Legal Fund Name Including Umbrella" => {
//                         of.LegalFundNameIncludingUmbrella = v.to_string()
//                     }
//                     _ => { /* do nothing */ }
//                 },
//                 _ => { /* do nothing */ }
//             }
//         }
//         of
//     }
// }

#[account]
pub struct FundAccount {
    pub name: String,
    pub uri: String,
    pub treasury: Pubkey,
    pub share_class: Vec<Pubkey>,
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
    pub share_class: Vec<Vec<ShareClassField>>,
    pub fund_manager: Vec<Vec<FundManagerField>>,
}
impl FundMetadataAccount {
    pub const INIT_SIZE: usize = 1024;
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct ShareClassModel {
    pub symbol: Option<String>,
    pub name: Option<String>,
    pub uri: Option<String>,   // metadata uri
    pub asset: Option<String>, // asset denom
    pub asset_pubkey: Option<Pubkey>,
    pub isin: Option<String>,
    pub status: Option<ShareClassStatus>,
    pub policy_distribution: Option<String>,
    pub extension: Option<String>,
    pub launch_date: Option<String>,
    pub lifecycle: Option<String>,
    pub image_uri: Option<String>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct CompanyModel {
    pub name: Option<String>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub enum ManagerKind {
    Wallet,
    Squads,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct ManagerModel {
    pub pubkey: Option<Pubkey>,
    pub name: Option<String>,
    pub kind: Option<ManagerKind>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct CreatedModel {
    pub key: [u8; 8],
    pub manager: Option<Pubkey>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct FundModel {
    // pub name: String,
    // pub symbol: Option<String>,
    pub id: Option<String>,
    pub symbol: Option<String>,
    pub name: Option<String>,
    pub uri: Option<String>,
    pub openfund_uri: Option<String>,
    pub is_active: Option<bool>,

    // assets
    pub assets: Vec<Pubkey>,
    pub assets_weights: Vec<u32>,

    // relationships
    pub share_class: Vec<ShareClassModel>,
    pub company: Option<CompanyModel>,
    pub manager: Option<ManagerModel>,
    pub created: Option<CreatedModel>,
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
