use anchor_lang::prelude::*;

#[derive(AnchorDeserialize, AnchorSerialize, Clone, PartialEq, Debug)]
pub enum Integration {
    Drift,
    StakePool,
    Marinade,
    Jupiter,
}
