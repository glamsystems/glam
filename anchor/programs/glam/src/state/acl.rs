use anchor_lang::prelude::*;

use super::{
    accounts::{EngineField, EngineFieldName, EngineFieldValue},
    FundAccount,
};

#[error_code]
pub enum AccessError {
    #[msg("Signer not authorized to perform this action")]
    NotAuthorized,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, PartialEq, Debug)]
pub enum Permission {
    FundUpdate,
    DriftDeposit,
    DriftWithdraw,
    MarinadeStake,
    MarinadeUnstake, // Order delayed unstake + claim ticket
    MarinadeLiquidUnstake,
    JupiterSwapFundAssets,
    JupiterSwapAnyAsset,
    WSolWrap,
    WSolUnwrap,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct Acl {
    pub pubkey: Pubkey,
    pub permissions: Vec<Permission>,
}

pub fn check_access(fund: &FundAccount, signer: &Pubkey, permission: Permission) -> Result<()> {
    if fund.manager == *signer {
        return Ok(());
    }

    msg!(
        "Checking access for signer {:?} on permission {:?}",
        signer,
        permission
    );

    let engine_fields = &fund.params[0];
    let mut authorized = false;
    for EngineField { name, value } in engine_fields {
        match name {
            EngineFieldName::Acls => {
                if let EngineFieldValue::VecAcl { val } = &value {
                    for acl in val {
                        if acl.pubkey == *signer && acl.permissions.contains(&permission) {
                            authorized = true
                        }
                        break;
                    }
                }
            }
            _ => (),
        }
    }
    if authorized {
        Ok(())
    } else {
        Err(AccessError::NotAuthorized.into())
    }
}
