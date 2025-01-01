use anchor_lang::prelude::*;

use super::FundAccount;
use crate::error::AccessError;
use spl_stake_pool::ID as SPL_STAKE_POOL_PROGRAM_ID;

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
    MintShare,
    BurnShare,
    ForceTransferShare,
    SetTokenAccountsStates,
    StakeJup,       // Initialize locked voter escrow and stake JUP
    VoteOnProposal, // New vote and cast vote
    UnstakeJup,     // Unstake JUP
    JupiterSwapLst, // Swap LSTs
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
    SanctumStakePool,
    NativeStaking,
    Marinade,
    JupiterSwap, // Jupiter Swap
    Mint,        // GLAM Mint
    JupiterVote, // Jupiter Vote
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

    #[cfg(not(feature = "mainnet"))]
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

    #[cfg(not(feature = "mainnet"))]
    msg!(
        "Checking signer {:?} has any of {:?}",
        signer,
        allowed_permissions
    );

    if let Some(acls) = fund.delegate_acls() {
        for acl in acls {
            if acl.pubkey == *signer
                && acl
                    .permissions
                    .iter()
                    .any(|p| allowed_permissions.contains(p))
            {
                return Ok(());
            }
        }
    }
    return Err(AccessError::NotAuthorized.into());
}

pub fn check_integration(fund: &FundAccount, integration: IntegrationName) -> Result<()> {
    #[cfg(not(feature = "mainnet"))]
    msg!("Checking integration {:?} is enabled", integration);

    if let Some(acls) = fund.integration_acls() {
        for acl in acls {
            if acl.name == integration {
                return Ok(());
            }
        }
    }

    return Err(AccessError::IntegrationDisabled.into());
}

pub fn check_stake_pool_integration(fund: &FundAccount, stake_pool_program: &Pubkey) -> Result<()> {
    let integration = if stake_pool_program == &SPL_STAKE_POOL_PROGRAM_ID {
        IntegrationName::SplStakePool
    } else {
        IntegrationName::SanctumStakePool
    };
    check_integration(fund, integration)
}
