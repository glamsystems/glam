use anchor_lang::prelude::*;

use crate::error::ManagerError;
use crate::state::fund::*;

use drift::instruction::{
    InitializeUserStats as initialize_user_stats,
    InitializeUser as initialize_user,
    UpdateUserDelegate as update_user_delegate,
    Deposit as deposit,
    DepositIntoSpotMarketRevenuePool as deposit_into_spot,
    Withdraw as withdraw,
    DeleteUser as delete_user,
};
use drift::accounts::{
    InitializeUserStats,
    InitializeUser,
    UpdateUserDelegate,
    Deposit,
    DepositIntoSpotMarketRevenuePool,
    Withdraw,
    DeleteUser,
};

#[derive(Accounts)]
pub struct DriftInitialize<'info> {
    pub fund: Account<'info, Fund>,
    #[account(mut)]
    manager: Signer<'info>,
}

pub fn drift_initialize_handler(ctx: Context<DriftInitialize>) -> Result<()> {
    // transfer_checked(
    //     CpiContext::new_with_signer(
    //         asset_program,
    //         TransferChecked {
    //             from: att.treasury_ata.to_account_info(),
    //             mint: asset_info,
    //             to: att.signer_asset_ata.to_account_info(),
    //             authority: treasury.to_account_info(),
    //         },
    //         signer_seeds,
    //     ),
    //     amount_asset,
    //     att.asset_decimals,
    // )?;
    Ok(())
}

#[derive(Accounts)]
pub struct DriftDeposit<'info> {
    pub fund: Account<'info, Fund>,
    #[account(mut)]
    manager: Signer<'info>,
}

pub fn drift_deposit_handler(ctx: Context<DriftDeposit>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct DriftWithdraw<'info> {
    pub fund: Account<'info, Fund>,
    #[account(mut)]
    manager: Signer<'info>,
}

pub fn drift_withdraw_handler(ctx: Context<DriftWithdraw>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct DriftClose<'info> {
    pub fund: Account<'info, Fund>,
    #[account(mut)]
    manager: Signer<'info>,
}

pub fn drift_close_handler(ctx: Context<DriftClose>) -> Result<()> {
    Ok(())
}
