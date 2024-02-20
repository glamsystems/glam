use crate::error::ManagerError;
use anchor_lang::prelude::*;



use anchor_spl::token_interface::{Mint, Token2022};

pub const MAX_ASSETS: usize = 5;

#[account]
pub struct Fund {
    pub manager: Pubkey,
    pub treasury: Pubkey,
    pub assets_len: u8,
    pub assets: [Pubkey; MAX_ASSETS],
    pub assets_weights: [u32; MAX_ASSETS],
    pub share_classes_len: u8,
    pub share_classes: [Pubkey; 3],
    pub share_classes_bumps: [u8; 3],
    pub time_created: i64,
    pub bump_fund: u8,
    pub bump_treasury: u8,
    pub name: String, // max 30 chars
    pub is_active: bool,
}
impl Fund {
    pub const INIT_SIZE: usize =
        32 + 32 + 1 + (32 + 4) * MAX_ASSETS + 1 + (32 + 1) * 3 + 8 + 2 + 30 + 1;
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
    // pub asset_base: InterfaceAccount<'info, Mint>,
    #[account(init, seeds = [b"share-0".as_ref(), fund.key().as_ref()], bump, payer = manager, mint::decimals = 9, mint::authority = share)]
    pub share: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut)]
    pub manager: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

pub fn initialize_fund_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, InitializeFund<'info>>,
    name: String,
    asset_weights: Vec<u32>,
    activate: bool,
) -> Result<()> {
    require!(name.as_bytes().len() <= 30, ManagerError::InvalidFundName);

    let assets_len = ctx.remaining_accounts.len();
    require!(assets_len <= MAX_ASSETS, ManagerError::InvalidAssetsLen);
    require!(
        asset_weights.len() == assets_len,
        ManagerError::InvalidAssetsLen
    );

    let fund = &mut ctx.accounts.fund;
    let treasury = &mut ctx.accounts.treasury;

    fund.manager = ctx.accounts.manager.key();
    fund.treasury = treasury.key();
    fund.name = name;
    fund.bump_fund = ctx.bumps.fund;
    fund.bump_treasury = ctx.bumps.treasury;
    fund.time_created = Clock::get()?.unix_timestamp;
    fund.share_classes_len = 1;
    fund.share_classes[0] = ctx.accounts.share.key();
    fund.share_classes_bumps[0] = ctx.bumps.share;

    fund.assets_len = assets_len as u8;
    for (i, account) in ctx.remaining_accounts.iter().enumerate() {
        let asset = InterfaceAccount::<Mint>::try_from(account).expect("invalid asset");
        fund.assets[i] = asset.key();
    }
    for (i, &w) in asset_weights.iter().enumerate() {
        fund.assets_weights[i] = w;
    }
    fund.is_active = activate;

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
