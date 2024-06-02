use anchor_lang::prelude::*;

use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;
use anchor_spl::token_interface::{
    burn, mint_to, transfer_checked, Burn, Mint, MintTo, Token2022, TokenAccount, TransferChecked,
};
use pyth_sdk_solana::state::SolanaPriceAccount;
use pyth_sdk_solana::Price;

use crate::error::{FundError, InvestorError};
use crate::state::*;

//TODO(security): check that treasury belongs to the fund

fn log_decimal(amount: u64, minus_decimals: i32) -> f64 {
    amount as f64 * 10f64.powf(minus_decimals as f64)
}
fn _log_price(price: Price) -> f64 {
    price.price as f64 * 10f64.powf(price.expo as f64)
}

#[derive(Accounts)]
pub struct Subscribe<'info> {
    pub fund: Box<Account<'info, FundAccount>>,

    // the shares to mint
    #[account(mut, seeds = [
        b"share".as_ref(),
        &[0u8], //TODO: add share_class_idx to instruction
        fund.key().as_ref()
      ],
      bump, mint::authority = share_class, mint::token_program = token_2022_program)]
    pub share_class: Box<InterfaceAccount<'info, Mint>>, // mint

    #[account(
      init_if_needed,
      payer = signer,
      associated_token::mint = share_class,
      associated_token::authority = signer,
      associated_token::token_program = token_2022_program
    )]
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
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
}

pub fn subscribe_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, Subscribe<'info>>,
    amount: u64,
    skip_state: bool,
) -> Result<()> {
    let fund = &ctx.accounts.fund;
    require!(fund.is_enabled(), InvestorError::FundNotActive);

    if fund.share_classes.len() > 1 {
        // we need to define how to split the total amount into share classes
        panic!("not implemented")
    }
    require!(fund.share_classes.len() > 0, FundError::NoShareClassInFund);
    require!(
        fund.share_classes[0] == ctx.accounts.share_class.key(),
        InvestorError::InvalidShareClass
    );

    if let Some(share_class_blocklist) = fund.share_class_blocklist(0) {
        require!(
            share_class_blocklist.len() == 0
                || !share_class_blocklist
                    .iter()
                    .any(|&k| k == ctx.accounts.signer.key()),
            InvestorError::InvalidShareClass
        );
    }

    if let Some(share_class_allowlist) = fund.share_class_allowlist(0) {
        require!(
            share_class_allowlist.len() == 0
                || share_class_allowlist
                    .iter()
                    .any(|&k| k == ctx.accounts.signer.key()),
            InvestorError::InvalidShareClass
        );
    }

    let assets = fund.assets().unwrap();
    // msg!("assets: {:?}", assets);
    let asset_info = ctx.accounts.asset.to_account_info();
    let asset_key = asset_info.key();
    let asset_idx = assets.iter().position(|&asset| asset == asset_key);
    // msg!("asset={:?} idx={:?}", asset_key, asset_idx);

    require!(asset_idx.is_some(), InvestorError::InvalidAssetSubscribe);
    let asset_idx = asset_idx.unwrap();
    //TODO check if in_kind is allowed, or idx must be 0

    // compute amount of shares
    let share_class = &ctx.accounts.share_class;
    let total_shares = share_class.supply;
    let use_fixed_price = total_shares == 0;

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
        ctx.remaining_accounts.len() == 2 * assets.len(),
        InvestorError::InvalidAssetSubscribe
    );

    let timestamp = Clock::get()?.unix_timestamp;
    let mut subscribe_asset_price = total_value;
    let mut subscribe_asset_expo = 0i32;
    for (i, accounts) in ctx.remaining_accounts.chunks(2).enumerate() {
        let cur_asset = assets[i];
        let cur_asset_str = cur_asset.to_string();
        let cur_asset_meta = AssetInfo::get(cur_asset_str.as_str())?;

        let treasury_ata = InterfaceAccount::<TokenAccount>::try_from(&accounts[0])
            .expect("invalid treasury account");
        require!(
            treasury_ata.mint == cur_asset,
            InvestorError::InvalidTreasuryAccount
        );

        let pricing_account = &accounts[1];
        require!(
            pricing_account.key().to_string().as_str() == cur_asset_meta.pyth_account,
            InvestorError::InvalidPricingOracle
        );

        let price_feed: pyth_sdk_solana::PriceFeed =
            SolanaPriceAccount::account_info_to_feed(pricing_account).unwrap();
        let mut asset_price = price_feed.get_price_no_older_than(timestamp, 60).unwrap();
        // let mut asset_price = Price {
        //     // i=0 => 1 USDC
        //     // i=1 => 51000 BTC
        //     // i=2 => 3000 ETH
        //     price: if i == 0 {
        //         1
        //     } else if i == 1 {
        //         51000
        //     } else {
        //         3000
        //     },
        //     conf: 0,
        //     expo: 0,
        //     publish_time: 0,
        // };

        let asset_decimals = cur_asset_meta.decimals;
        let asset_expo = -(asset_decimals as i32);
        asset_price = asset_price.scale_to_exponent(asset_expo).unwrap();
        let asset_amount = treasury_ata.amount;
        let asset_value = asset_price
            .cmul(asset_amount.try_into().unwrap(), asset_expo)
            .unwrap();
        /*
        msg!(
            "- asset {}: amount={:.2} decimals={} price={:.2} value={:.2}",
            i,
            log_decimal(asset_amount, asset_expo),
            asset_decimals,
            log_price(asset_price),
            log_price(asset_value),
        );
        */

        if i == asset_idx {
            subscribe_asset_price = asset_price;
            subscribe_asset_expo = asset_expo;
        }

        total_value = total_value
            .add(&asset_value.scale_to_exponent(share_expo).unwrap())
            .unwrap();
    }

    let asset_value = subscribe_asset_price
        .cmul(amount.try_into().unwrap(), subscribe_asset_expo)
        .unwrap()
        .scale_to_exponent(share_expo)
        .unwrap()
        .price as u128;
    // msg!(
    //     "- total_value={:.2} asset_value={}",
    //     log_price(total_value),
    //     log_price(asset_value),
    // );

    let amount_shares = if use_fixed_price {
        // fixed $100/share initial value
        asset_value / 100
    } else {
        // msg!("- total_shares={} total_value={}e{}", total_shares, total_value.price, total_value.expo);
        (asset_value * total_shares as u128) / (total_value.price as u128)
    } as u64;
    msg!(
        "Subscribe: {} for {} shares",
        log_decimal(amount, subscribe_asset_expo),
        log_decimal(amount_shares, share_expo)
    );

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
        // TODO: we should read share class symbol from metadata so that we don't need to pass it as an argument
        // mint shares to signer
        let fund_key = ctx.accounts.fund.key();
        let seeds = &[
            "share".as_bytes(),
            &[0u8],
            fund_key.as_ref(),
            &[ctx.bumps.share_class],
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
    pub fund: Account<'info, FundAccount>,

    // the shares to burn
    #[account(mut, mint::authority = share_class, mint::token_program = token_2022_program)]
    pub share_class: Box<InterfaceAccount<'info, Mint>>, // mint
    #[account(mut)]
    pub signer_share_ata: Box<InterfaceAccount<'info, TokenAccount>>, // user account

    // signers
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

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
    if ctx.accounts.fund.share_classes.len() > 1 {
        // we need to define how to split the total amount into share classes
        panic!("not implemented")
    }

    let share_class = &ctx.accounts.share_class;
    let share_expo = -(share_class.decimals as i32);
    let total_shares = share_class.supply;
    let should_transfer_everything = amount == total_shares;

    msg!(
        "Redeem: amount={:.2} total_shares={:.2} ({}e{})",
        log_decimal(amount, share_expo),
        log_decimal(total_shares, share_expo),
        total_shares,
        share_expo,
    );

    if skip_state {
        let fund = &ctx.accounts.fund;
        let signer = &ctx.accounts.signer;
        let treasury = &ctx.accounts.treasury;

        let assets = fund.assets().unwrap();
        let assets_weights = fund.assets_weights().unwrap();

        // if we skip the redeem state, we attempt to do in_kind redeem,
        // i.e. transfer to the user a % of each asset in the fund (assuming
        // the fund is balanced, if it's not the redeem may fail).
        // ctx.remaining_accounts must contain tuples of (asset, signer_ata, treasury_ata, pricing).
        // the assets should be the fund.assets, including the base asset,
        // and in the correct order.
        require!(
            ctx.remaining_accounts.len() == 4 * assets.len(),
            InvestorError::InvalidAssetsRedeem
        );

        let timestamp = Clock::get()?.unix_timestamp;
        let mut assets_to_transfer: Vec<AssetToTransfer> = Vec::new();
        for (i, accounts) in ctx.remaining_accounts.chunks(4).enumerate() {
            let asset = InterfaceAccount::<Mint>::try_from(&accounts[0]).expect("invalid asset");
            let signer_asset_ata: InterfaceAccount<'_, TokenAccount> =
                InterfaceAccount::<TokenAccount>::try_from(&accounts[1])
                    .expect("invalid user account");
            let treasury_ata = InterfaceAccount::<TokenAccount>::try_from(&accounts[2])
                .expect("invalid treasury account");
            let pricing_account = &accounts[3];

            require!(asset.key() == assets[i], InvestorError::InvalidAssetsRedeem);
            require!(
                signer_asset_ata.owner == signer.key(),
                InvestorError::InvalidAssetsRedeem
            );

            let price_feed: pyth_sdk_solana::PriceFeed =
                SolanaPriceAccount::account_info_to_feed(pricing_account).unwrap();
            let mut asset_price = price_feed.get_price_no_older_than(timestamp, 60).unwrap();
            // let mut asset_price = Price {
            //     // i=0 => 1 USDC
            //     // i=1 => 51000 BTC
            //     // i=2 => 3000 ETH
            //     price: if i == 0 {
            //         1
            //     } else if i == 1 {
            //         51000
            //     } else {
            //         3000
            //     },
            //     conf: 0,
            //     expo: 0,
            //     publish_time: 0,
            // };

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
            // msg!(
            //     "- asset {}: amount={:.2} decimals={} price={:.2} (={}e{}) value={:.2} ({}e{})",
            //     i,
            //     asset_amount as f64 / 10f64.powf(asset_decimals as f64),
            //     asset_decimals,
            //     log_price(asset_price),
            //     asset_price.price,
            //     asset_price.expo,
            //     log_price(asset_value),
            //     asset_value.price,
            //     asset_value.expo
            // );
        }

        //TODO: use Price::price_basket?
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
        // msg!(
        //     "= tot_value={:.2} ({}e{})",
        //     log_price(total_value),
        //     total_value.price,
        //     total_value.expo
        // );

        let value_to_redeem = Price {
            price: ((total_value.price as u128 * amount as u128) / total_shares as u128) as i64,
            conf: 0,
            expo: share_expo,
            publish_time: 0,
        };
        // msg!(
        //     "= value_red={:.2} ({}e{})",
        //     log_price(value_to_redeem),
        //     value_to_redeem.price,
        //     value_to_redeem.expo
        // );
        let total_weight: u32 = assets_weights.iter().sum();

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
                ((value.price as u128 * 10u128.pow(att.asset_decimals as u32))
                    / att.asset_price.price as u128) as u64
            } else {
                let weight: u32 = assets_weights[i];
                if weight == 0 {
                    continue;
                }

                let value = value_to_redeem
                    .scale_to_exponent(att.asset_price.expo)
                    .unwrap();
                ((((value.price as u128 * weight as u128) / total_weight as u128)
                    * 10u128.pow(att.asset_decimals as u32))
                    / att.asset_price.price as u128) as u64
            };
            msg!("- asset {}: amount={}", i, amount_asset);

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

            let fund_key = ctx.accounts.fund.key();
            let seeds = &[
                "treasury".as_bytes(),
                fund_key.as_ref(),
                &[ctx.bumps.treasury],
            ];
            let signer_seeds = &[&seeds[..]];
            // msg!(
            //     "- {}e-{} {}",
            //     amount_asset,
            //     att.asset_decimals,
            //     asset_info.key()
            // );
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
