use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    burn, mint_to, transfer_checked, Burn, Mint, MintTo, Token2022, TokenAccount, TokenInterface,
    TransferChecked,
};

use crate::error::ManagerError;
use crate::manager::{Fund, Treasury};

#[derive(Accounts)]
pub struct SubscribeRedeem<'info> {
    pub fund: Account<'info, Fund>,

    // the shares to mint/burn
    #[account(mut, mint::authority = share_class, mint::token_program = share_token_program)]
    pub share_class: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut)]
    pub share_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    // the asset to transfer
    #[account(mut, mint::token_program = asset_token_program)]
    pub asset: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut)]
    pub treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub signer_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    // user
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub treasury: Account<'info, Treasury>,

    // programs
    pub system_program: Program<'info, System>,
    pub asset_token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub share_token_program: Program<'info, Token2022>,
}

pub fn subscribe_handler(ctx: Context<SubscribeRedeem>, amount: u64) -> Result<()> {
    //TODO: conversion
    let amount_base = amount;
    let amount_shares = amount_base;
    msg!("Subscribe: {} for {} shares", amount, amount_shares);

    transfer_checked(
        CpiContext::new(
            ctx.accounts.asset_token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.signer_ata.to_account_info(),
                mint: ctx.accounts.asset.to_account_info(),
                to: ctx.accounts.treasury_ata.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        ),
        amount,
        ctx.accounts.asset.decimals,
    )?;

    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "share-0".as_bytes(),
        fund_key.as_ref(),
        &[ctx.accounts.fund.share_classes_bumps[0]],
    ];
    let signer_seeds = &[&seeds[..]];
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.share_token_program.to_account_info(),
            MintTo {
                authority: ctx.accounts.share_class.to_account_info(),
                to: ctx.accounts.share_ata.to_account_info(),
                mint: ctx.accounts.share_class.to_account_info(),
            },
            signer_seeds,
        ),
        amount_shares,
    )?;

    Ok(())
}

pub fn redeem_handler(ctx: Context<SubscribeRedeem>, amount: u64) -> Result<()> {
    //TODO: conversion
    let amount_base = amount;
    let amount_asset = amount_base;
    msg!("Redeem: {} shares for {}", amount, amount_asset);

    burn(
        CpiContext::new(
            ctx.accounts.share_token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.share_class.to_account_info(),
                from: ctx.accounts.share_ata.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        ),
        amount,
    )?;

    let treasury = &ctx.accounts.treasury;
    let seeds = &[
        "treasury".as_bytes(),
        treasury.fund.as_ref(),
        &[treasury.bump],
    ];
    let signer_seeds = &[&seeds[..]];
    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.asset_token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.treasury_ata.to_account_info(),
                mint: ctx.accounts.asset.to_account_info(),
                to: ctx.accounts.signer_ata.to_account_info(),
                authority: treasury.to_account_info(),
            },
            signer_seeds,
        ),
        amount_asset,
        ctx.accounts.asset.decimals,
    )?;

    Ok(())
}
