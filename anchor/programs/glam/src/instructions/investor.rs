use anchor_lang::prelude::*;

use anchor_spl::token::Token;
use anchor_spl::token_interface::{
    burn, mint_to, transfer_checked, Burn, Mint, MintTo, Token2022, TokenAccount,
    TransferChecked,
};

use crate::error::InvestorError;
use crate::manager::{Fund, Treasury};

//TODO(security): check that treasury and share_class belong to the fund

#[derive(Accounts)]
pub struct Subscribe<'info> {
    pub fund: Account<'info, Fund>,

    // the shares to mint
    #[account(mut, mint::authority = share_class, mint::token_program = token_2022_program)]
    pub share_class: Box<InterfaceAccount<'info, Mint>>, // mint
    #[account(mut)]
    pub signer_share_ata: Box<InterfaceAccount<'info, TokenAccount>>, // user account

    // the asset to transfer
    #[account(mut)]
    pub asset: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut)]
    pub treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub signer_asset_ata: Box<InterfaceAccount<'info, TokenAccount>>, // user account

    // user
    #[account(mut)]
    pub signer: Signer<'info>,

    // programs
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
}

pub fn subscribe_handler(ctx: Context<Subscribe>, amount: u64, skip_state: bool) -> Result<()> {
    let mut asset_found = false;
    let asset_info = ctx.accounts.asset.to_account_info();
    let asset_key = asset_info.key();
    for fund_asset in ctx.accounts.fund.assets {
        if fund_asset == asset_key {
            asset_found = true;
        }
    }
    require!(asset_found, InvestorError::InvalidAssetSubscribe);

    // transfer asset from user to treasury
    // note: we detect the token program to use from the asset
    let asset_info = ctx.accounts.asset.to_account_info();
    let asset_program = if *asset_info.owner == Token2022::id() {
        ctx.accounts.token_2022_program.to_account_info()
    } else {
        ctx.accounts.token_program.to_account_info()
    };
    transfer_checked(
        CpiContext::new(
            asset_program,
            TransferChecked {
                from: ctx.accounts.signer_asset_ata.to_account_info(),
                mint: asset_info,
                to: ctx.accounts.treasury_ata.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        ),
        amount,
        ctx.accounts.asset.decimals,
    )?;

    // compute amount of shares
    let amount_base = amount;
    let amount_shares = amount_base;
    msg!("Subscribe: {} for {} shares", amount, amount_shares);

    if skip_state {
        // mint shares to signer
        let fund_key = ctx.accounts.fund.key();
        let seeds = &[
            "share-0".as_bytes(),
            fund_key.as_ref(),
            &[ctx.accounts.fund.share_classes_bumps[0]],
        ];
        let signer_seeds = &[&seeds[..]];
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_2022_program.to_account_info(),
                MintTo {
                    authority: ctx.accounts.share_class.to_account_info(),
                    to: ctx.accounts.signer_share_ata.to_account_info(),
                    mint: ctx.accounts.share_class.to_account_info(),
                },
                signer_seeds,
            ),
            amount_shares,
        )?;
    } else {
        //TODO: create subscribe state
        panic!("not implemented")
    }

    Ok(())
}

#[derive(Accounts)]
pub struct Redeem<'info> {
    pub fund: Account<'info, Fund>,

    // the shares to burn
    #[account(mut, mint::authority = share_class, mint::token_program = token_2022_program)]
    pub share_class: Box<InterfaceAccount<'info, Mint>>, // mint
    #[account(mut)]
    pub signer_share_ata: Box<InterfaceAccount<'info, TokenAccount>>, // user account

    // the asset to transfer
    #[account(mut)]
    pub asset: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut)]
    pub treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub signer_asset_ata: Box<InterfaceAccount<'info, TokenAccount>>, // user account

    // signers
    #[account(mut)]
    pub signer: Signer<'info>,
    pub treasury: Account<'info, Treasury>,

    // programs
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
}

pub fn redeem_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, Redeem<'info>>,
    amount: u64,
    in_kind: bool,
    skip_state: bool,
) -> Result<()> {
    if !in_kind {
        // we need to implement redeem state first
        panic!("not implemented")
    }

    burn(
        CpiContext::new(
            ctx.accounts.token_2022_program.to_account_info(),
            Burn {
                mint: ctx.accounts.share_class.to_account_info(),
                from: ctx.accounts.signer_share_ata.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        ),
        amount,
    )?;

    msg!("Redeem: {} shares", amount);

    let should_transfer_everything = amount == ctx.accounts.share_class.supply;

    if skip_state {
        let fund = &ctx.accounts.fund;
        let signer = &ctx.accounts.signer;
        let treasury = &ctx.accounts.treasury;

        // if we skip the redeem state, we attempt to do in_kind redeem,
        // i.e. transfer to the user a % of each asset in the fund (assuming
        // the fund is balanced, if it's not the redeem may fail).
        // ctx.remaining_accounts must contain tuples of (asset, treasury_ata, signer_ata, pricing).
        // the assets should be the fund.assets, including the base asset,
        // and in the correct order.
        require!(
            ctx.remaining_accounts.len() == 4 * fund.assets_len as usize,
            InvestorError::InvalidAssetsRedeem
        );
        for (i, accounts) in ctx.remaining_accounts.chunks(4).enumerate() {
            let asset = InterfaceAccount::<Mint>::try_from(&accounts[0]).expect("invalid asset");
            let treasury_ata = InterfaceAccount::<TokenAccount>::try_from(&accounts[1])
                .expect("invalid treasury account");
            let signer_asset_ata = InterfaceAccount::<TokenAccount>::try_from(&accounts[2])
                .expect("invalid user account");
            let _pricing_account = &accounts[3];

            require!(
                asset.key() == fund.assets[i],
                InvestorError::InvalidAssetsRedeem
            );
            require!(
                signer_asset_ata.owner == signer.key(),
                InvestorError::InvalidAssetsRedeem
            );

            let amount_asset = if should_transfer_everything {
                treasury_ata.amount
            } else {
                treasury_ata.amount / 2 //TODO compute %
            };

            if amount_asset == 0 {
                continue;
            }

            // transfer asset from user to treasury
            // note: we detect the token program to use from the asset
            let asset_info = asset.to_account_info();
            let asset_program = if *asset_info.owner == Token2022::id() {
                ctx.accounts.token_2022_program.to_account_info()
            } else {
                ctx.accounts.token_program.to_account_info()
            };

            let seeds = &[
                "treasury".as_bytes(),
                treasury.fund.as_ref(),
                &[treasury.bump],
            ];
            let signer_seeds = &[&seeds[..]];
            transfer_checked(
                CpiContext::new_with_signer(
                    asset_program,
                    TransferChecked {
                        from: treasury_ata.to_account_info(),
                        mint: asset_info,
                        to: signer_asset_ata.to_account_info(),
                        authority: treasury.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount_asset,
                ctx.accounts.asset.decimals,
            )?;
        }
    } else {
        //TODO: create redeem state
        panic!("not implemented")
    }

    Ok(())
}
