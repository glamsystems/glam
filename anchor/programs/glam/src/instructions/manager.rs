use crate::error::ManagerError;
use anchor_lang::prelude::*;

use anchor_spl::token_interface::{Mint, Token2022};

#[account]
pub struct Fund {
    manager: Pubkey,
    treasury: Pubkey,
    asset_base: Pubkey,
    assets_len: u8,
    assets: [Pubkey; 5],
    share_classes_len: u8,
    share_classes: [Pubkey; 3],
    pub share_classes_bumps: [u8; 3],
    time_created: i64,
    bump_fund: u8,
    bump_treasury: u8,
    name: String, // max 30 chars
}
impl Fund {
    pub const INIT_SIZE: usize = 32 + 32 + 32 + 1 + 32 * 10 + 1 + 32 * 3 + 3 + 8 + 2 + 30;
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

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeFund<'info> {
    #[account(init, seeds = [b"fund".as_ref(), manager.key().as_ref(), name.as_ref()], bump, payer = manager, space = 8 + Fund::INIT_SIZE)]
    pub fund: Account<'info, Fund>,

    #[account(init, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump, payer = manager, space = 8 + Treasury::INIT_SIZE)]
    pub treasury: Account<'info, Treasury>,

    // this can be either token or token2022
    pub asset_base: InterfaceAccount<'info, Mint>,

    #[account(init, seeds = [b"share-0".as_ref(), fund.key().as_ref()], bump, payer = manager, mint::decimals = 9, mint::authority = share_0)]
    pub share_0: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>, // to create shares
}

pub fn initialize_fund_handler(ctx: Context<InitializeFund>, name: String) -> Result<()> {
    if name.as_bytes().len() > 30 {
        return Err(error!(ManagerError::InvalidFundName));
    }

    let fund = &mut ctx.accounts.fund;
    let treasury = &mut ctx.accounts.treasury;

    fund.manager = ctx.accounts.manager.key();
    fund.treasury = treasury.key();
    fund.name = name;
    fund.bump_fund = ctx.bumps.fund;
    fund.bump_treasury = ctx.bumps.treasury;
    fund.time_created = Clock::get()?.unix_timestamp;
    fund.asset_base = ctx.accounts.asset_base.key();
    fund.share_classes_len = 1;
    fund.share_classes[0] = ctx.accounts.share_0.key();
    fund.share_classes_bumps[0] = ctx.bumps.share_0;

    treasury.manager = ctx.accounts.manager.key();
    treasury.fund = fund.key();
    treasury.bump = ctx.bumps.treasury;

    msg!("Fund created: {}", ctx.accounts.fund.key());
    Ok(())
}

#[derive(Accounts)]
pub struct CloseFund<'info> {
    #[account(mut, close = manager, has_one = manager @ ManagerError::NotAuthorizedError)]
    fund: Account<'info, Fund>,
    #[account(mut)]
    manager: Signer<'info>,
}

pub fn close_handler(ctx: Context<CloseFund>) -> Result<()> {
    //TODO: check that all share classes have 0 supply
    //TODO: close treasury (checkin that it's empty)
    msg!("Fund closed: {}", ctx.accounts.fund.key());
    Ok(())
}
