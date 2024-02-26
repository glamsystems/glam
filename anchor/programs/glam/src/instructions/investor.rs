use anchor_lang::prelude::*;

use anchor_spl::token::Token;
use anchor_spl::token_interface::{
    burn, mint_to, transfer_checked, Burn, Mint, MintTo, Token2022, TokenAccount, TransferChecked,
};
use pyth_sdk_solana::Price;

use crate::error::InvestorError;
use crate::manager::Treasury;
use crate::state::fund::*;

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

pub fn subscribe_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, Subscribe<'info>>,
    amount: u64,
    skip_state: bool,
) -> Result<()> {
    let fund = &ctx.accounts.fund;
    require!(fund.is_active, InvestorError::FundNotActive);

    if fund.share_classes_len > 1 {
        // we need to define how to split the total amount into share classes
        panic!("not implemented")
    }

    let asset_info = ctx.accounts.asset.to_account_info();
    let asset_key = asset_info.key();
    let asset_idx = fund.assets.iter().position(|&asset| asset == asset_key);
    require!(asset_idx.is_some(), InvestorError::InvalidAssetSubscribe);
    let asset_idx = asset_idx.unwrap();
    //TODO check if in_kind is allowed, or idx must be 0

    // compute amount of shares
    let share_class = &ctx.accounts.share_class;
    let total_shares = share_class.supply;

    let share_expo = -(share_class.decimals as i32);
    let mut total_value = Price {
        price: 0,
        conf: 0,
        expo: share_expo,
        publish_time: 0,
    };

    // if we skip the redeem state, we attempt to do in_kind redeem,
    // i.e. transfer to the user a % of each asset in the fund (assuming
    // the fund is balanced, if it's not the redeem may fail).
    // ctx.remaining_accounts must contain tuples of (asset, signer_ata, treasury_ata, pricing).
    // the assets should be the fund.assets, including the base asset,
    // and in the correct order.
    require!(
        ctx.remaining_accounts.len() == 2 * fund.assets_len as usize,
        InvestorError::InvalidAssetsRedeem
    );

    let mut subscribe_asset_price = total_value.clone();
    let mut subscribe_asset_expo = 0i32;
    for (i, accounts) in ctx.remaining_accounts.chunks(2).enumerate() {
        let treasury_ata = InterfaceAccount::<TokenAccount>::try_from(&accounts[0])
            .expect("invalid treasury account");
        let pricing_account = &accounts[1];
        // require!(
        //     treasury_ata.mint == fund.assets[i],
        //     InvestorError::InvalidTreasuryAccount
        // );
        //TODO check pricing account

        //TODO fetch price
        let mut asset_price = Price {
            // i=0 => 1 USDC
            // i=1 => 51000 BTC
            // i=2 => 3000 ETH
            price: if i == 0 {
                1
            } else if i == 1 {
                51000
            } else {
                3000
            },
            conf: 0,
            expo: 0,
            publish_time: 0,
        };

        let asset_decimals: u8 = if i == 1 { 9 } else { 6 };
        let asset_expo = -(asset_decimals as i32);
        asset_price = asset_price.scale_to_exponent(asset_expo).unwrap();
        let asset_amount = treasury_ata.amount;
        let asset_value = asset_price
            .cmul(asset_amount.try_into().unwrap(), asset_expo)
            .unwrap();

        if i == asset_idx {
            msg!("- asset {}: amount={} decimals={} price={}e{} value={}e{}", i, asset_amount, asset_decimals, asset_price.price, asset_price.expo, asset_value.price, asset_value.expo);
            subscribe_asset_price = asset_price;
            subscribe_asset_expo = asset_expo;
        }

        total_value = total_value
            .add(&asset_value.scale_to_exponent(share_expo).unwrap())
            .unwrap();
    }

    // let value_to_redeem = Price {
    //     price:        (total_value.price as u128 * amount as u128 / total_shares as u128) as i64,
    //     conf:         0,
    //     expo:         share_expo,
    //     publish_time: 0,
    // };
    let asset_value = subscribe_asset_price
        .cmul(amount.try_into().unwrap(), subscribe_asset_expo)
        .unwrap()
        .scale_to_exponent(0)
        .unwrap()
        .price as u128;
    // msg!("- asset_value={}", asset_value);

    let amount_shares = if total_shares == 0 {
        // fixed $10/share initial value
        //TODO: pick value from fund definition
        (asset_value / 10) as u64
    } else {
        // msg!("- total_shares={} total_value={}e{}", total_shares, total_value.price, total_value.expo);
        ((asset_value * total_shares as u128 * 10u128.pow((-total_value.expo) as u32)) / (total_value.price as u128)) as u64
    };
    msg!("Subscribe: {} for {} shares", amount, amount_shares);

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

    // signers
    #[account(mut)]
    pub signer: Signer<'info>,
    pub treasury: Account<'info, Treasury>,

    // programs
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
}

pub struct AssetToTransfer<'info> {
    pub asset: InterfaceAccount<'info, Mint>,
    pub treasury_ata: InterfaceAccount<'info, TokenAccount>,
    pub signer_asset_ata: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: We will manually check this against the Pubkey of the price feed
    pub pricing_account: AccountInfo<'info>,
    pub asset_decimals: u8,
    pub asset_price: Price,
    pub asset_amount: u64,
    pub asset_value: Price,
}

pub fn redeem_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, Redeem<'info>>,
    amount: u64,
    in_kind: bool,
    skip_state: bool,
) -> Result<()> {
    if ctx.accounts.fund.share_classes_len > 1 {
        // we need to define how to split the total amount into share classes
        panic!("not implemented")
    }

    msg!("Redeem: {} shares", amount);

    let share_class = &ctx.accounts.share_class;
    let total_shares = share_class.supply;
    let should_transfer_everything = amount == total_shares;

    if skip_state {
        let fund = &ctx.accounts.fund;
        let signer = &ctx.accounts.signer;
        let treasury = &ctx.accounts.treasury;

        // if we skip the redeem state, we attempt to do in_kind redeem,
        // i.e. transfer to the user a % of each asset in the fund (assuming
        // the fund is balanced, if it's not the redeem may fail).
        // ctx.remaining_accounts must contain tuples of (asset, signer_ata, treasury_ata, pricing).
        // the assets should be the fund.assets, including the base asset,
        // and in the correct order.
        require!(
            ctx.remaining_accounts.len() == 4 * fund.assets_len as usize,
            InvestorError::InvalidAssetsRedeem
        );

        let mut assets_to_transfer: Vec<AssetToTransfer> = Vec::new();
        for (i, accounts) in ctx.remaining_accounts.chunks(4).enumerate() {
            let asset = InterfaceAccount::<Mint>::try_from(&accounts[0]).expect("invalid asset");
            let signer_asset_ata: InterfaceAccount<'_, TokenAccount> =
                InterfaceAccount::<TokenAccount>::try_from(&accounts[1])
                    .expect("invalid user account");
            let treasury_ata = InterfaceAccount::<TokenAccount>::try_from(&accounts[2])
                .expect("invalid treasury account");
            let pricing_account = &accounts[3];

            require!(
                asset.key() == fund.assets[i],
                InvestorError::InvalidAssetsRedeem
            );
            require!(
                signer_asset_ata.owner == signer.key(),
                InvestorError::InvalidAssetsRedeem
            );

            //TODO fetch price
            let mut asset_price = Price {
                // i=0 => 1 USDC
                // i=1 => 51000 BTC
                // i=2 => 3000 ETH
                price: if i == 0 {
                    1
                } else if i == 1 {
                    51000
                } else {
                    3000
                },
                conf: 0,
                expo: 0,
                publish_time: 0,
            };

            let asset_decimals: u8 = if i == 1 { 9 } else { 6 };
            let asset_expo = -(asset_decimals as i32);
            asset_price = asset_price.scale_to_exponent(asset_expo).unwrap();
            let asset_amount = treasury_ata.amount;
            let asset_value = asset_price
                .cmul(asset_amount.try_into().unwrap(), asset_expo)
                .unwrap();
            assets_to_transfer.push(AssetToTransfer {
                asset,
                treasury_ata,
                signer_asset_ata,
                pricing_account: pricing_account.clone(),
                asset_decimals,
                asset_price,
                asset_amount,
                asset_value,
            });
            // msg!("- asset {}: amount={} decimals={} price={}e{} value={}e{}", i, asset_amount, asset_decimals, asset_price.price, asset_price.expo, asset_value.price, asset_value.expo);
        }

        //TODO: use Price::price_basket?
        let share_expo = -(share_class.decimals as i32);
        let mut total_value = Price {
            price: 0,
            conf: 0,
            expo: share_expo,
            publish_time: 0,
        };
        for att in &assets_to_transfer {
            total_value = total_value
                .add(&att.asset_value.scale_to_exponent(share_expo).unwrap())
                .unwrap();
        }
        // msg!("= tot_value={}e{}", total_value.price, total_value.expo);

        let value_to_redeem = Price {
            price: (total_value.price as u128 * amount as u128 / total_shares as u128) as i64,
            conf: 0,
            expo: share_expo,
            publish_time: 0,
        };
        // msg!("= value_red={}e{}", value_to_redeem.price, value_to_redeem.expo);
        let total_weight: u32 = fund.assets_weights.iter().sum();

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

        for (i, att) in assets_to_transfer.iter().enumerate() {
            let amount_asset = if should_transfer_everything {
                att.treasury_ata.amount
            } else if !in_kind {
                if i > 0 {
                    continue;
                }
                let value = value_to_redeem
                    .scale_to_exponent(att.asset_price.expo)
                    .unwrap();
                (value.price as u128
                    / (att.asset_price.price as u128 / 10u128.pow(att.asset_decimals as u32)))
                    as u64
            } else {
                let weight = fund.assets_weights[i];

                let value = value_to_redeem
                    .scale_to_exponent(att.asset_price.expo)
                    .unwrap();
                (value.price as u128 * weight as u128
                    / total_weight as u128
                    / (att.asset_price.price as u128 / 10u128.pow(att.asset_decimals as u32)))
                    as u64
            };
            // msg!("- asset {}: amount={}", i, amount_asset);

            if amount_asset == 0 {
                continue;
            }

            // transfer asset from user to treasury
            // note: we detect the token program to use from the asset
            let asset_info = att.asset.to_account_info();
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
            msg!("- {}e-{} {}", amount_asset, att.asset_decimals, asset_info.key());
            transfer_checked(
                CpiContext::new_with_signer(
                    asset_program,
                    TransferChecked {
                        from: att.treasury_ata.to_account_info(),
                        mint: asset_info,
                        to: att.signer_asset_ata.to_account_info(),
                        authority: treasury.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount_asset,
                att.asset_decimals,
            )?;
        }
    } else {
        //TODO: create redeem state
        panic!("not implemented")
    }

    Ok(())
}
