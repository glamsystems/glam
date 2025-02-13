use anchor_lang::prelude::*;

use super::{AccountType, StateAccount};
use crate::error::GlamError;
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
    JupiterSwapAllowlisted,
    JupiterSwapAny,
    WSolWrap,
    WSolUnwrap,
    MintTokens,
    BurnTokens,
    ForceTransferTokens,
    SetTokenAccountState,
    StakeJup,       // Initialize locked voter escrow and stake JUP
    VoteOnProposal, // New vote and cast vote
    UnstakeJup,     // Unstake JUP
    JupiterSwapLst, // Swap LSTs
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, Debug, PartialEq)]
pub struct DelegateAcl {
    pub pubkey: Pubkey,
    pub permissions: Vec<Permission>,
    pub expires_at: i64, // Unix timestamp in seconds, 0 means no expiration
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, PartialEq, Debug)]
pub enum Integration {
    Drift,
    SplStakePool,
    SanctumStakePool,
    NativeStaking,
    Marinade,
    JupiterSwap, // Jupiter Swap
    JupiterVote, // Jupiter Vote
}

pub fn check_access(state: &StateAccount, signer: &Pubkey, permission: Permission) -> Result<()> {
    if state.owner == *signer {
        return Ok(());
    }

    #[cfg(not(feature = "mainnet"))]
    msg!(
        "Checking signer {:?} has permission {:?}",
        signer,
        permission
    );

    for acl in state.delegate_acls.clone() {
        if acl.pubkey == *signer && acl.permissions.contains(&permission) {
            return Ok(());
        }
    }

    return Err(GlamError::NotAuthorized.into());
}

pub fn check_access_any(
    state: &StateAccount,
    signer: &Pubkey,
    allowed_permissions: Vec<Permission>,
) -> Result<()> {
    if state.owner == *signer {
        return Ok(());
    }

    #[cfg(not(feature = "mainnet"))]
    msg!(
        "Checking signer {:?} has any of {:?}",
        signer,
        allowed_permissions
    );

    for acl in state.delegate_acls.clone() {
        if acl.pubkey == *signer
            && acl
                .permissions
                .iter()
                .any(|p| allowed_permissions.contains(p))
        {
            return Ok(());
        }
    }

    return Err(GlamError::NotAuthorized.into());
}

pub fn check_state_type(state: &StateAccount, accont_type: AccountType) -> Result<()> {
    #[cfg(not(feature = "mainnet"))]
    msg!("Checking state account type {:?}", accont_type);

    if state.account_type == accont_type {
        Ok(())
    } else {
        Err(GlamError::InvalidAccountType.into())
    }
}

pub fn check_integration(state: &StateAccount, integration: Integration) -> Result<()> {
    #[cfg(not(feature = "mainnet"))]
    msg!("Checking integration {:?} is enabled", integration);

    if state.integrations.contains(&integration) {
        Ok(())
    } else {
        Err(GlamError::IntegrationDisabled.into())
    }
}

pub fn check_stake_pool_integration(
    state: &StateAccount,
    stake_pool_program: &Pubkey,
) -> Result<()> {
    let integration = if stake_pool_program == &SPL_STAKE_POOL_PROGRAM_ID {
        Integration::SplStakePool
    } else {
        Integration::SanctumStakePool
    };
    check_integration(state, integration)
}
