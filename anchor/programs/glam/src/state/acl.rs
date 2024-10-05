use anchor_lang::prelude::*;

use super::FundAccount;

#[error_code]
pub enum AccessError {
    #[msg("Signer is not authorized")]
    NotAuthorized,
    #[msg("Integration is disabled")]
    IntegrationDisabled,
}

/**
 * Delegate ACL
 */
#[derive(AnchorDeserialize, AnchorSerialize, Clone, PartialEq, Debug)]
pub enum Permission {
    DriftInitialize,
    DriftUpdateUser,
    DriftDeleteUser,
    DriftDeposit,
    DriftWithdraw,
    DriftPlaceOrders,
    DriftCancelOrders,
    DriftPerpMarket,
    DriftSpotMarket,
    Stake, // Stake with marinade or spl/sanctum stake pool programs
    Unstake,
    LiquidUnstake,
    JupiterSwapFundAssets,
    JupiterSwapAnyAsset,
    WSolWrap,
    WSolUnwrap,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct DelegateAcl {
    pub pubkey: Pubkey,
    pub permissions: Vec<Permission>,
}

/**
 * Integration ACL
 */
#[derive(AnchorDeserialize, AnchorSerialize, Clone, PartialEq, Debug)]
pub enum IntegrationName {
    Drift,
    SplStakePool,
    SanctunmStakePool,
    NativeStaking,
    Marinade,
    Jupiter,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, PartialEq, Debug)]
pub enum IntegrationFeature {
    All,
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug)]
pub struct IntegrationAcl {
    pub name: IntegrationName,
    pub features: Vec<IntegrationFeature>,
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

    if let Some(acls) = fund.delegate_acls() {
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

    if let Some(acls) = fund.delegate_acls() {
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

pub fn check_integration(fund: &FundAccount, integration: IntegrationName) -> Result<()> {
    #[cfg(not(feature = "mainnet"))]
    msg!(
        "Checking integration {:?} is enabled for fund {:?}",
        integration,
        fund.name
    );

    if let Some(acls) = fund.integration_acls() {
        for acl in acls {
            if acl.name == integration {
                return Ok(());
            }
        }
    }

    return Err(AccessError::IntegrationDisabled.into());
}
