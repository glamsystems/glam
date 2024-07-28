use anchor_lang::prelude::*;

use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;
use anchor_spl::token_interface::{
    burn, mint_to, transfer_checked, Burn, Mint, MintTo, Token2022, TokenAccount, TransferChecked,
};
use pyth_sdk_solana::Price;

use spl_associated_token_account::get_associated_token_address_with_program_id;

use crate::constants::WSOL;
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

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

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
    let asset_base = assets[0];
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

    let aum_components = get_aum_components(
        Action::Subscribe,
        assets,
        ctx.remaining_accounts,
        &ctx.accounts.treasury,
        &ctx.accounts.signer,
        &ctx.accounts.token_program,
        &ctx.accounts.token_2022_program,
        false,     // only for redeem
        asset_idx, // only for subscribe
    )?;

    let subscribe_asset_price = aum_components[asset_idx].asset_price;
    for att in aum_components {
        total_value = total_value
            .add(&att.asset_value.scale_to_exponent(share_expo).unwrap())
            .unwrap();
    }

    let asset_value = subscribe_asset_price
        .cmul(amount.try_into().unwrap(), subscribe_asset_price.expo)
        .unwrap()
        .scale_to_exponent(share_expo)
        .unwrap()
        .price as u128;
    // msg!(
    //     "- total_value={:.2} asset_value={}",
    //     log_price(total_value),
    //     log_price(asset_value),
    // );

    // amount_shares = asset_value / nav = asset_value * total_shares / aum
    // - when total_shares = 0, default nav is $100 or 1 SOL
    let amount_shares = if use_fixed_price {
        if asset_base == WSOL {
            // fixed 1SOL/share initial value
            asset_value
        } else {
            // fixed $100/share initial value
            asset_value / 100
        }
    } else {
        // msg!("- total_shares={} total_value={}e{}", total_shares, total_value.price, total_value.expo);
        (asset_value * total_shares as u128) / (total_value.price as u128)
    } as u64;
    msg!(
        "Subscribe: {} for {} shares",
        log_decimal(amount, subscribe_asset_price.expo),
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

pub struct AumComponent<'info> {
    pub treasury_ata: Option<InterfaceAccount<'info, TokenAccount>>,
    pub signer_asset_ata: Option<InterfaceAccount<'info, TokenAccount>>,
    pub asset: Option<InterfaceAccount<'info, Mint>>,
    pub asset_amount: u64,
    pub asset_price: Price,
    pub asset_value: Price,
}

pub fn get_aum_components<'info>(
    action: Action,
    assets: &[Pubkey],
    remaining_accounts: &'info [AccountInfo<'info>],
    treasury: &SystemAccount<'info>,
    signer: &Signer<'info>,
    token_program: &Program<'info, Token>,
    token_2022_program: &Program<'info, Token2022>,
    skip_prices: bool,            // only for redeem
    force_price_asset_idx: usize, // only for subscribe
) -> Result<Vec<AumComponent<'info>>> {
    let mut aum_components: Vec<AumComponent> = Vec::new();

    let num_accounts = if action == Action::Subscribe { 2 } else { 4 };
    require!(
        remaining_accounts.len() == num_accounts * assets.len(),
        InvestorError::InvalidRemainingAccounts
    );

    let timestamp = Clock::get()?.unix_timestamp;
    for (i, accounts) in remaining_accounts.chunks(num_accounts).enumerate() {
        let cur_asset = assets[i];
        let cur_asset_str = cur_asset.to_string();
        let cur_asset_meta = AssetMeta::get(cur_asset_str.as_str())?;

        // Parse treasury account
        let treasury_ata_account = &accounts[0];
        let cur_token_program_key = if cur_asset_meta.is_token_2022 {
            token_2022_program.key()
        } else {
            token_program.key()
        };
        let expected_treasury_ata = get_associated_token_address_with_program_id(
            &treasury.key(),
            &cur_asset,
            &cur_token_program_key,
        );
        msg!("asset={} = {}", i, cur_asset);
        require_eq!(
            treasury_ata_account.key(),
            expected_treasury_ata,
            // InvestorError::InvalidTreasuryAccount
        );

        // Parse pricing account
        let pricing_account = &accounts[1];
        let expected_pricing_account = cur_asset_meta.get_pricing_account();
        require!(
            pricing_account.key().to_string().as_str() == expected_pricing_account,
            InvestorError::InvalidPricingOracle
        );

        let (asset, signer_asset_ata) = if action == Action::Redeem {
            // Parse and deser asset mint account
            let asset_account = &accounts[2];
            require!(
                asset_account.key() == assets[i],
                InvestorError::InvalidRemainingAccounts
            );
            let asset = InterfaceAccount::<Mint>::try_from(asset_account).expect("invalid asset");

            // Parse and deser signer ata account
            let signer_ata_account = &accounts[3];
            let signer_asset_ata: InterfaceAccount<'_, TokenAccount> =
                InterfaceAccount::<TokenAccount>::try_from(signer_ata_account)
                    .expect("invalid user account");
            require!(
                signer_asset_ata.mint == cur_asset,
                InvestorError::InvalidSignerAccount
            );
            require!(
                signer_asset_ata.owner == signer.key(),
                InvestorError::InvalidSignerAccount
            );

            (Some(asset), Some(signer_asset_ata))
        } else {
            (None, None)
        };

        // Calculate asset_amount in treasury
        // Deser treasury_ata, if it fails (account doesn't exist) then amount=0
        let maybe_treasury_ata = InterfaceAccount::<TokenAccount>::try_from(treasury_ata_account);
        let asset_amount = if let Ok(treasury_ata) = &maybe_treasury_ata {
            require!(
                treasury_ata.mint == cur_asset,
                InvestorError::InvalidTreasuryAccount
            );
            require!(
                treasury_ata.owner == treasury.key(),
                InvestorError::InvalidTreasuryAccount
            );
            treasury_ata.amount
        } else {
            0
        };

        let treasury_ata = if asset_amount > 0 {
            Some(maybe_treasury_ata?)
        } else {
            None
        };

        let need_price = !skip_prices && (asset_amount > 0 || i == force_price_asset_idx);
        let asset_price = if need_price {
            cur_asset_meta.get_price(pricing_account, timestamp, action)?
        } else {
            // not used
            Price::default()
        };
        let asset_value = asset_price
            .cmul(asset_amount.try_into().unwrap(), asset_price.expo)
            .unwrap();

        aum_components.push(AumComponent {
            treasury_ata,
            signer_asset_ata,
            asset,
            asset_amount,
            asset_price,
            asset_value,
        });
        // msg!(
        //     "- asset {}: price={:.2} (={}e{}) value={:.2} ({}e{})",
        //     i,
        //     _log_price(asset_price),
        //     asset_price.price,
        //     asset_price.expo,
        //     _log_price(asset_value),
        //     asset_value.price,
        //     asset_value.expo
        // );
    }

    Ok(aum_components)
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
        let assets = fund.assets().unwrap();

        let skip_prices = should_transfer_everything || in_kind;

        let assets_to_transfer = get_aum_components(
            Action::Redeem,
            assets,
            ctx.remaining_accounts,
            &ctx.accounts.treasury,
            &ctx.accounts.signer,
            &ctx.accounts.token_program,
            &ctx.accounts.token_2022_program,
            skip_prices, // only for redeem
            usize::MAX,  // only for subscribe
        )?;

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

        // msg!(
        //     "= value_red={:.2} ({}e{})",
        //     log_price(value_to_redeem),
        //     value_to_redeem.price,
        //     value_to_redeem.expo
        // );

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
            if att.asset_amount == 0 {
                continue;
            }
            let asset = att.asset.clone().unwrap();
            let signer_asset_ata = att.signer_asset_ata.clone().unwrap();
            let treasury_ata = att.treasury_ata.clone().unwrap();
            let amount_asset = if should_transfer_everything {
                treasury_ata.amount
            } else if in_kind {
                //TODO do not compute pricing
                ((att.asset_amount as u128 * amount as u128) / total_shares as u128) as u64
            } else {
                if i > 0 {
                    continue;
                }
                let value_to_redeem = Price {
                    price: ((total_value.price as u128 * amount as u128) / total_shares as u128)
                        as i64,
                    conf: 0,
                    expo: share_expo,
                    publish_time: 0,
                };
                let value = value_to_redeem
                    .scale_to_exponent(att.asset_price.expo)
                    .unwrap();
                ((value.price as u128 * 10u128.pow(asset.decimals as u32))
                    / att.asset_price.price as u128) as u64
            };
            msg!(
                "- asset {}: amount={} total={}",
                i,
                amount_asset,
                treasury_ata.amount
            );

            // transfer asset from user to treasury
            // note: we detect the token program to use from the asset
            let asset_info = asset.to_account_info();
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
                        from: treasury_ata.to_account_info(),
                        mint: asset_info,
                        to: signer_asset_ata.to_account_info(),
                        authority: ctx.accounts.treasury.to_account_info(),
                    },
                    signer_seeds,
                ),
                amount_asset,
                asset.decimals,
            )?;
        }
    } else {
        //TODO: create redeem state
        panic!("not implemented")
    }

    Ok(())
}
