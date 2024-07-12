use anchor_lang::prelude::*;

use super::FundAccount;

#[error_code]
pub enum AccessError {
    #[msg("Signer is not authorized")]
    NotAuthorized,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, PartialEq, Debug)]
pub enum Permission {
    DriftDeposit,
    DriftWithdraw,
    Stake, // Stake with marinade or spl/sanctum stake pool programs
    Unstake,
    LiquidUnstake,
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
        "Checking signer {:?} has permission {:?}",
        signer,
        permission
    );

    if let Some(acls) = fund.acls() {
        for acl in acls {
            if acl.pubkey == *signer && acl.permissions.contains(&permission) {
                return Ok(());
            }
        }
    }
    return Err(AccessError::NotAuthorized.into());
}

pub fn check_access_any(
    fund: &FundAccount,
    signer: &Pubkey,
    allowed_permissions: Vec<Permission>,
) -> Result<()> {
    if fund.manager == *signer {
        return Ok(());
    }

    msg!(
        "Checking signer {:?} has any of {:?}",
        signer,
        allowed_permissions
    );

    if let Some(acls) = fund.acls() {
        for acl in acls {
            for permission in &allowed_permissions {
                if acl.pubkey == *signer && acl.permissions.contains(permission) {
                    return Ok(());
                }
            }
        }
    }
    return Err(AccessError::NotAuthorized.into());
}
