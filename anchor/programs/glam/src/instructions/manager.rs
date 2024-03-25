use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, Token2022};

use crate::error::ManagerError;
use crate::state::fund::*;

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
    symbol: String,
    asset_weights: Vec<u32>,
    activate: bool,
) -> Result<()> {
    require!(name.as_bytes().len() <= 30, ManagerError::InvalidFundName);
    require!(symbol.as_bytes().len() <= 10, ManagerError::InvalidFundName);

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
    fund.symbol = symbol;
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
pub struct UpdateFund<'info> {
    #[account(mut, has_one = manager @ ManagerError::NotAuthorizedError)]
    fund: Account<'info, Fund>,
    #[account(mut)]
    manager: Signer<'info>,
}

pub fn update_fund_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, UpdateFund<'info>>,
    name: Option<String>,
    symbol: Option<String>,
    asset_weights: Option<Vec<u32>>,
    activate: Option<bool>,
) -> Result<()> {
    let fund = &mut ctx.accounts.fund;

    if let Some(name) = name {
        require!(name.as_bytes().len() <= 30, ManagerError::InvalidFundName);
        fund.name = name;
    }
    if let Some(symbol) = symbol {
        require!(symbol.as_bytes().len() <= 10, ManagerError::InvalidFundName);
        fund.symbol = symbol;
    }
    if let Some(activate) = activate {
        fund.is_active = activate;
    }
    if let Some(asset_weights) = asset_weights {
        let assets_len = asset_weights.len();
        require!(assets_len <= MAX_ASSETS, ManagerError::InvalidAssetsLen);
        require!(
            assets_len == fund.assets_len as usize,
            ManagerError::InvalidAssetsLen
        );
        for (i, &w) in asset_weights.iter().enumerate() {
            fund.assets_weights[i] = w;
        }
    }

    msg!("Fund updated: {}", ctx.accounts.fund.key());
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
