use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::{
    spl_associated_token_account::get_associated_token_address_with_program_id, AssociatedToken,
};
use anchor_spl::stake::StakeAccount;
use anchor_spl::token::Token;
use anchor_spl::token_interface::{
    burn, mint_to, transfer_checked, Burn, Mint, MintTo, Token2022, TokenAccount, TransferChecked,
};
use glam_macros::share_class_signer_seeds;
use glam_macros::vault_signer_seeds;
use marinade::state::delayed_unstake_ticket::TicketAccountData;
use pyth_solana_receiver_sdk::price_update::Price;
use solana_program::stake::state::warmup_cooldown_rate;

use crate::constants::{self, WSOL};
use crate::error::{InvestorError, PolicyError, StateError};
use crate::instructions::policy_hook::PolicyAccount;
use crate::state::pyth_price::PriceExt;
use crate::{constants::*, state::*};

fn log_decimal(amount: u64, minus_decimals: i32) -> f64 {
    amount as f64 * 10f64.powf(minus_decimals as f64)
}

#[derive(Accounts)]
#[instruction(share_class_id: u8)]
pub struct Subscribe<'info> {
    #[account()]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    // the shares to mint
    #[account(
        mut,
        seeds = [SEED_MINT.as_bytes(), &[share_class_id], state.key().as_ref()],
        bump,
        mint::authority = share_class_mint,
        mint::token_program = token_2022_program
    )]
    pub share_class_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = share_class_mint,
        associated_token::authority = signer,
        associated_token::token_program = token_2022_program
    )]
    pub signer_share_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    // the asset to transfer in exchange for shares
    pub asset: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut, constraint = vault_ata.mint == asset.key())]
    pub vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut, constraint = signer_asset_ata.mint == asset.key())]
    pub signer_asset_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    // signer_policy is required if a fund has a lock-up period.
    // it's optional, so we can avoid creating it for funds without
    // a lock-up period.
    #[account(
        init_if_needed,
        payer = signer,
        space = 8+8,
        seeds = [
          b"account-policy".as_ref(),
          signer_share_ata.key().as_ref()
        ],
        bump
    )]
    pub signer_policy: Option<Account<'info, PolicyAccount>>,

    // user
    #[account(mut)]
    pub signer: Signer<'info>,

    // programs
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
}

#[share_class_signer_seeds]
pub fn subscribe_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, Subscribe<'info>>,
    share_class_id: u8,
    amount: u64,
    skip_state: bool,
) -> Result<()> {
    let state = &ctx.accounts.state;
    require!(state.enabled, StateError::Disabled);

    let external_vault_accounts =
        state.get_pubkeys_from_engine_field(EngineFieldName::ExternalVaultAccounts);

    // If system program is in the external vault accounts, it means that
    // the state is disabled for subscription and redemption.
    if external_vault_accounts.contains(&system_program::ID) {
        return err!(InvestorError::SubscribeRedeemDisable);
    }

    if state.mints.len() > 1 {
        // we need to define how to split the total amount into share classes
        panic!("not implemented")
    }
    require!(state.mints.len() > 0, StateError::NoShareClass);
    require!(
        state.mints[0] == ctx.accounts.share_class_mint.key(),
        InvestorError::InvalidShareClass
    );

    if let Some(share_class_blocklist) = state.share_class_blocklist(0) {
        require!(
            share_class_blocklist.len() == 0
                || !share_class_blocklist
                    .iter()
                    .any(|&k| k == ctx.accounts.signer.key()),
            InvestorError::InvalidShareClass
        );
    }

    if let Some(share_class_allowlist) = state.share_class_allowlist(0) {
        require!(
            share_class_allowlist.len() == 0
                || share_class_allowlist
                    .iter()
                    .any(|&k| k == ctx.accounts.signer.key()),
            InvestorError::InvalidShareClass
        );
    }

    // Lock-up
    let lock_up = state.share_class_lock_up(0);
    if lock_up > 0 {
        require!(
            ctx.accounts.signer_policy.is_some(),
            InvestorError::InvalidPolicyAccount
        );
        let signer_policy = ctx.accounts.signer_policy.as_mut().unwrap();

        let timestamp = Clock::get()?.unix_timestamp;
        let cur_locked_until_ts = signer_policy.locked_until_ts;
        let new_locked_until_ts = timestamp.saturating_add(lock_up);
        // This check is only paranoia.
        // If the fund changes the lock-up period to a shorter one,
        // user with an existing lock-up won't get a shorter period
        // just by re-subscribing.
        // Note: because we use init_if_needed there might be a way
        // to circumvent with re-init attack, but we accept the risk.
        if new_locked_until_ts > cur_locked_until_ts {
            signer_policy.locked_until_ts = new_locked_until_ts;
        }
    }

    let state_assets = &state.assets;
    let asset_idx = state_assets
        .iter()
        .position(|&asset| asset == ctx.accounts.asset.key());
    require!(asset_idx.is_some(), InvestorError::InvalidAssetSubscribe);
    // msg!("asset={:?} idx={:?}", asset_key, asset_idx);

    let asset_idx = asset_idx.unwrap();
    let asset_base = state_assets[0];
    //TODO check if in_kind is allowed, or idx must be 0

    //
    // Compute amount of shares to mint
    //
    let share_class = &ctx.accounts.share_class_mint;
    let share_expo = -(share_class.decimals as i32);
    let total_shares = share_class.supply;
    let use_fixed_price = total_shares == 0;

    let aum_components = get_aum_components(
        Action::Subscribe,
        &state_assets,
        ctx.remaining_accounts,
        &ctx.accounts.vault,
        &external_vault_accounts,
        &ctx.accounts.signer,
        &ctx.accounts.token_program,
        &ctx.accounts.token_2022_program,
        false,     // only for redeem
        asset_idx, // only for subscribe
    )?;

    let subscribe_asset_price = aum_components[asset_idx].asset_price;
    let mut total_value = Price {
        price: 0,
        conf: 0,
        exponent: share_expo,
        publish_time: 0,
    };
    for att in aum_components {
        total_value = total_value
            .add(&att.asset_value.scale_to_exponent(share_expo).unwrap())
            .unwrap();
    }

    let asset_value = subscribe_asset_price
        .cmul(amount.try_into().unwrap(), subscribe_asset_price.exponent)
        .unwrap()
        .scale_to_exponent(share_expo)
        .unwrap()
        .price as u128;
    // msg!(
    //     "- total_value={:.2} asset_value={}",
    //     _log_price(total_value),
    //     log_decimal(asset_value as u64, share_expo),
    // );

    // amount_shares = asset_value / nav = asset_value / (aum / total_shares) = asset_value * total_shares / aum
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
        log_decimal(amount, subscribe_asset_price.exponent),
        log_decimal(amount_shares, share_expo)
    );

    // transfer asset from user to vault
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
                to: ctx.accounts.vault_ata.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        ),
        amount,
        ctx.accounts.asset.decimals,
    )?;

    if skip_state {
        // TODO: we should read share class symbol from metadata so that we don't need to pass it as an argument
        // mint shares to signer

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_2022_program.to_account_info(),
                MintTo {
                    authority: ctx.accounts.share_class_mint.to_account_info(),
                    to: ctx.accounts.signer_share_ata.to_account_info(),
                    mint: ctx.accounts.share_class_mint.to_account_info(),
                },
                share_class_signer_seeds,
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
    pub state: Account<'info, StateAccount>,

    // the shares to burn
    #[account(mut, mint::authority = share_class, mint::token_program = token_2022_program)]
    pub share_class: Box<InterfaceAccount<'info, Mint>>, // mint
    #[account(mut)]
    pub signer_share_ata: Box<InterfaceAccount<'info, TokenAccount>>, // user account

    // signers
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [
          b"account-policy".as_ref(),
          signer_share_ata.key().as_ref()
        ],
        bump
      )]
    pub signer_policy: Option<UncheckedAccount<'info>>,

    // programs
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
}

#[vault_signer_seeds]
pub fn redeem_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, Redeem<'info>>,
    amount: u64,
    in_kind: bool,
    skip_state: bool,
) -> Result<()> {
    let state = &ctx.accounts.state;
    require!(state.enabled, StateError::Disabled);

    let external_vault_accounts =
        state.get_pubkeys_from_engine_field(EngineFieldName::ExternalVaultAccounts);

    // If system program is in the external vault accounts, it means that
    // the state is disabled for subscription and redemption.
    if external_vault_accounts.contains(&system_program::ID) {
        return err!(InvestorError::SubscribeRedeemDisable);
    }

    if ctx.accounts.state.mints.len() > 1 {
        // we need to define how to split the total amount into share classes
        panic!("not implemented")
    }
    require!(state.mints.len() > 0, StateError::NoShareClass);
    require!(
        state.mints[0] == ctx.accounts.share_class.key(),
        InvestorError::InvalidShareClass
    );

    // Lock-up
    let mut close_signer_policy = false;
    let lock_up = state.share_class_lock_up(0);
    if lock_up > 0 {
        require!(
            ctx.accounts.signer_policy.is_some(),
            InvestorError::InvalidPolicyAccount
        );
        let signer_policy = &ctx.accounts.signer_policy.clone().unwrap();

        // It's responsibility of subscribe() to create the policy account
        // with the proper lock-up timestamp.
        // If a user doesn't have a policy account, it means that his tokens
        // are not subject to lock-up period for whatever reason, so from the
        // perspective of this check an unitialized account means lock-up
        // timestamp set to 0.
        // All other deserialize errors must be thrown.
        let maybe_signer_policy = PolicyAccount::try_from(signer_policy);
        let locked_until_ts = match maybe_signer_policy {
            Ok(src_account_policy) => Ok(src_account_policy.locked_until_ts),
            Err(ProgramError::UninitializedAccount) => Ok(0),
            Err(err) => Err(err),
        }?;

        let cur_timestamp = Clock::get()?.unix_timestamp;
        if cur_timestamp < locked_until_ts {
            return err!(PolicyError::LockUp);
        }

        // If the lock-up period has expired, we can delete the
        // signer_policy account and reclaim the rent.
        // We do it only if lamports > 0 (but for completeness,
        // it'd work also without the if).
        if signer_policy.lamports() > 0 {
            close_signer_policy = true;
        }
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

    let assets = &state.assets;
    let skip_prices = should_transfer_everything || in_kind;
    let aum_components = get_aum_components(
        Action::Redeem,
        &assets,
        ctx.remaining_accounts,
        &ctx.accounts.vault,
        &external_vault_accounts,
        &ctx.accounts.signer,
        &ctx.accounts.token_program,
        &ctx.accounts.token_2022_program,
        skip_prices, // only for redeem
        usize::MAX,  // only for subscribe
    )?;

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

    if skip_state {
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

        for (i, att) in aum_components.iter().enumerate() {
            let asset = att.asset.clone().unwrap();

            let amount_asset = if should_transfer_everything {
                if let Some(vault_ata) = &att.vault_ata {
                    vault_ata.amount
                } else {
                    0
                }
            } else if in_kind {
                //TODO do not compute pricing
                ((att.asset_amount as u128 * amount as u128) / total_shares as u128) as u64
            } else {
                if i > 0 {
                    break;
                }

                let mut total_value = Price {
                    price: 0,
                    conf: 0,
                    exponent: share_expo,
                    publish_time: 0,
                };
                for att in &aum_components {
                    total_value = total_value
                        .add(&att.asset_value.scale_to_exponent(share_expo).unwrap())
                        .unwrap();
                }

                let value_to_redeem = Price {
                    price: ((total_value.price as u128 * amount as u128) / total_shares as u128)
                        as i64,
                    conf: 0,
                    exponent: share_expo,
                    publish_time: 0,
                };
                let value = value_to_redeem
                    .scale_to_exponent(att.asset_price.exponent)
                    .unwrap();
                ((value.price as u128 * 10u128.pow(asset.decimals as u32))
                    / att.asset_price.price as u128) as u64
            };

            if amount_asset == 0 {
                continue;
            }

            // transfer asset from vault to user
            // note: we detect the token program to use from the asset
            let asset_info = asset.to_account_info();
            let asset_program = if *asset_info.owner == Token2022::id() {
                ctx.accounts.token_2022_program.to_account_info()
            } else {
                ctx.accounts.token_program.to_account_info()
            };

            #[cfg(not(feature = "mainnet"))]
            msg!(
                "Transfer {} (decimals {}) {} from vault to user",
                amount_asset,
                asset.decimals,
                asset_info.key()
            );
            require!(
                !att.vault_ata.is_none(),
                InvestorError::InvalidTreasuryAccount
            );

            let signer_asset_ata = att.signer_asset_ata.clone().unwrap();
            let vault_ata: InterfaceAccount<TokenAccount> = att.vault_ata.clone().unwrap();
            transfer_checked(
                CpiContext::new_with_signer(
                    asset_program,
                    TransferChecked {
                        from: vault_ata.to_account_info(),
                        mint: asset_info,
                        to: signer_asset_ata.to_account_info(),
                        authority: ctx.accounts.vault.to_account_info(),
                    },
                    vault_signer_seeds,
                ),
                amount_asset,
                asset.decimals,
            )?;
        }

        if should_transfer_everything {
            let lamports = ctx.accounts.vault.lamports();
            if lamports > 0 {
                system_program::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.system_program.to_account_info(),
                        system_program::Transfer {
                            from: ctx.accounts.vault.to_account_info(),
                            to: ctx.accounts.signer.to_account_info(),
                        },
                        vault_signer_seeds,
                    ),
                    lamports,
                )?;
            }
        }
    } else {
        //TODO: create redeem state
        panic!("not implemented")
    }

    // close the signer_policy account
    if close_signer_policy {
        close_account_info(
            ctx.accounts
                .signer_policy
                .as_ref()
                .unwrap()
                .to_account_info(),
            ctx.accounts.signer.to_account_info(),
        )?;
    }

    Ok(())
}

#[derive(Debug)]
pub struct AumComponent<'info> {
    pub vault_ata: Option<InterfaceAccount<'info, TokenAccount>>,
    pub signer_asset_ata: Option<InterfaceAccount<'info, TokenAccount>>,
    pub asset: Option<InterfaceAccount<'info, Mint>>,
    pub asset_amount: u64,
    pub asset_price: Price,
    pub asset_value: Price,
    pub price_type: PriceDenom,
}

pub fn get_aum_components<'info>(
    action: Action,
    assets: &[Pubkey],
    remaining_accounts: &'info [AccountInfo<'info>],
    vault: &SystemAccount<'info>,
    external_vault_accounts: &[Pubkey],
    signer: &Signer<'info>,
    token_program: &Program<'info, Token>,
    token_2022_program: &Program<'info, Token2022>,
    skip_prices: bool,            // only for redeem
    force_price_asset_idx: usize, // only for subscribe
) -> Result<Vec<AumComponent<'info>>> {
    //
    // Split remaining_accounts and validate them
    //
    let (stake_accounts, marinade_tickets, accounts_for_pricing) =
        split_remaining_accounts(remaining_accounts)?;

    require!(
        stake_accounts.len() + marinade_tickets.len() == external_vault_accounts.len(),
        InvestorError::InvalidRemainingAccounts
    );

    for account in stake_accounts.iter().chain(marinade_tickets.iter()) {
        require!(
            external_vault_accounts.contains(&account.key()),
            InvestorError::InvalidRemainingAccounts
        );
    }

    let num_accounts = if action == Action::Subscribe { 2 } else { 4 };
    require!(
        accounts_for_pricing.len() == num_accounts * assets.len(),
        InvestorError::InvalidRemainingAccounts
    );

    //
    // Collect aum components
    //
    let mut aum_components: Vec<AumComponent> = Vec::new();
    let timestamp = Clock::get()?.unix_timestamp;
    let mut price_sol_usd = Price {
        price: 0,
        conf: 0,
        exponent: 0,
        publish_time: 0,
    };
    let mut price_type = PriceDenom::USD;
    for (i, accounts) in accounts_for_pricing.chunks(num_accounts).enumerate() {
        let cur_asset = assets[i];
        let cur_asset_str = cur_asset.to_string();
        let cur_asset_meta = AssetMeta::get(cur_asset_str.as_str())?;

        let is_wsol = cur_asset == constants::WSOL;
        if i == 0 {
            if is_wsol {
                // Fund denominated in SOL
                price_type = PriceDenom::SOL;
            } else if cur_asset_meta.is_stable_coin {
                // Fund denominated in USD
                price_type = PriceDenom::USD;
            } else {
                // Fund denominated in another asset
                // price_type = PriceDenom::Asset;
                panic!("not implemented");
            }
        }

        // Parse vault token account
        let vault_ata = &accounts[0];
        let cur_token_program_key = if cur_asset_meta.is_token_2022 {
            token_2022_program.key()
        } else {
            token_program.key()
        };
        let expected_vault_ata = get_associated_token_address_with_program_id(
            &vault.key(),
            &cur_asset,
            &cur_token_program_key,
        );
        require_keys_eq!(vault_ata.key(), expected_vault_ata);

        // Parse pricing account
        let pricing_account = &accounts[1];
        let expected_pricing_account = cur_asset_meta.get_pricing_account();

        #[cfg(not(feature = "mainnet"))]
        msg!(
            "pricing_account={:?} expected={:?}",
            pricing_account.key().to_string().as_str(),
            expected_pricing_account
        );
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
                InterfaceAccount::<TokenAccount>::try_from(signer_ata_account).expect(&format!(
                    "invalid user account: {}",
                    signer_ata_account.key()
                ));
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

        // Calculate asset_amount in vault
        // Deser vault_ata, if it fails (account doesn't exist) then amount=0
        let maybe_vault_ata = InterfaceAccount::<TokenAccount>::try_from(vault_ata);
        let mut asset_amount = if let Ok(vault_ata) = &maybe_vault_ata {
            require!(
                vault_ata.mint == cur_asset,
                InvestorError::InvalidTreasuryAccount
            );
            require!(
                vault_ata.owner == vault.key(),
                InvestorError::InvalidTreasuryAccount
            );
            vault_ata.amount
        } else {
            0
        };
        if is_wsol {
            asset_amount += vault.lamports();
        }

        let vault_ata = if asset_amount > 0 {
            Some(maybe_vault_ata?)
        } else {
            None
        };

        let need_price =
            !skip_prices && (asset_amount > 0 || i == force_price_asset_idx || is_wsol);
        let mut asset_price = if need_price {
            cur_asset_meta.get_price(pricing_account, timestamp, action)?
        } else {
            // not used
            Price {
                price: 0,
                conf: 0,
                exponent: 0,
                publish_time: 0,
            }
        };
        let mut asset_price_type = cur_asset_meta.get_price_denom();
        if is_wsol {
            price_sol_usd = asset_price;

            if price_type == PriceDenom::SOL {
                asset_price = Price {
                    price: 1_000_000_000,
                    conf: 0,
                    exponent: -9,
                    publish_time: 0,
                };
                asset_price_type = PriceDenom::SOL;
            }
        }

        let asset_value = asset_price
            .cmul(asset_amount.try_into().unwrap(), asset_price.exponent)
            .unwrap();

        aum_components.push(AumComponent {
            vault_ata,
            signer_asset_ata,
            asset,
            asset_amount,
            asset_price,
            asset_value,
            price_type: asset_price_type,
        });
    }

    /*
     * Calculate the external lamports of the fund. Currently only marinade tickets and stake accounts are included.
     * External lamports will be added to the wsol aum_component.
     */
    if let Some(wsol_component) = aum_components.iter_mut().find(|aum| {
        !aum.vault_ata.is_none() && aum.vault_ata.as_ref().unwrap().mint == constants::WSOL
    }) {
        msg!("wsol aum_component={:?}", wsol_component);

        let mut external_lamports = marinade_tickets
            .iter()
            .map(|account_info| {
                let mut data_slice: &[u8] = &account_info.data.borrow();
                let data: &mut &[u8] = &mut data_slice;
                let ticket = TicketAccountData::try_deserialize(data).unwrap();

                account_info.lamports() + ticket.lamports_amount // total lamports hold by the ticket account
            })
            .sum::<u64>();

        external_lamports += stake_accounts
            .iter()
            .map(|account_info| account_info.lamports())
            .sum::<u64>();

        /*
         * Besides lamports in the tickets and stake accounts, we also estimate the yields of eligible stake accounts:
         * 1. iterate through stake accounts and calculate the activated stake
         * 2. calculate the rewards based on the activated stake
         */
        let clock = Clock::get()?;
        let activated_stake: u64 = stake_accounts
            .iter()
            .map(|account_info| {
                let mut data_slice: &[u8] = &account_info.data.borrow();
                let data: &mut &[u8] = &mut data_slice;
                let stake = StakeAccount::try_deserialize(data).unwrap();

                #[cfg(not(feature = "mainnet"))]
                msg!(
                    "Stake account {:?}, delegation: {:?}",
                    account_info.key,
                    stake.delegation()
                );

                let delegation = stake.delegation().unwrap();

                // stake is activating, not eligible for yields
                if clock.epoch <= delegation.activation_epoch {
                    return 0;
                }
                // stake has been deactivated, not eligible for yields
                if clock.epoch > delegation.deactivation_epoch {
                    return 0;
                }
                // activation_epoch < clock.epoch <= deactivation_epoch
                let mut activated_stake_pct = (clock.epoch - delegation.activation_epoch) as f64
                    * warmup_cooldown_rate(clock.epoch, None);
                activated_stake_pct = activated_stake_pct.min(1.0);

                #[cfg(not(feature = "mainnet"))]
                msg!(
                    "current epoch: {:?}, activation epoch {:?}, activated_stake_pct {:?}",
                    clock.epoch,
                    delegation.activation_epoch,
                    activated_stake_pct
                );

                return (activated_stake_pct * delegation.stake as f64) as u64;
            })
            .sum();

        // TODO: allow fund manager to set the yield rate
        let stake_rewards = activated_stake as f64 * 0.0005 * get_epoch_progress().unwrap();

        msg!(
            "external_lamports={:?}, stake_rewards={:?}",
            external_lamports,
            stake_rewards as u64
        );

        let expo = wsol_component.asset_price.exponent;
        let updated_asset_amount =
            wsol_component.asset_amount + external_lamports + stake_rewards as u64;
        let updated_asset_value = wsol_component
            .asset_price
            .cmul(updated_asset_amount.try_into().unwrap(), expo)
            .unwrap();

        wsol_component.asset_amount = updated_asset_amount;
        wsol_component.asset_value = updated_asset_value;
    }

    // SOL <-> USD conversion not needed if skip_prices is true
    if !skip_prices {
        for att in &mut aum_components {
            if price_type == PriceDenom::SOL {
                // Any asset priced in USD, should be converted in SOL
                // by divinging by the SOL price.
                // Note: wSOL price is already in SOL
                if att.price_type == PriceDenom::USD {
                    let expo = att.asset_price.exponent;
                    att.asset_price = att.asset_price.div(&price_sol_usd).unwrap();
                    att.asset_value = att
                        .asset_price
                        .cmul(att.asset_amount.try_into().unwrap(), expo)
                        .unwrap()
                        .scale_to_exponent(expo)
                        .unwrap()
                }
            }

            if price_type == PriceDenom::USD {
                // LST (or any asset with price in SOL) should be converted to USD
                // by multiplying their price time SOL price
                // Note: wSOL price is already in USD
                if att.price_type == PriceDenom::SOL {
                    let expo = att.asset_price.exponent;
                    att.asset_price = att.asset_price.mul(&price_sol_usd).unwrap();
                    att.asset_value = att
                        .asset_price
                        .cmul(att.asset_amount.try_into().unwrap(), expo)
                        .unwrap()
                        .scale_to_exponent(expo)
                        .unwrap()
                }
            }
        }
    }

    Ok(aum_components)
}

/**
 * Split remaining_accounts into 3 categories:
 * 1) Accounts with owner being stake program
 * 2) Accounts with owner being marinade program
 * 3) Accounts for pricing: those not in 1) or 2)
 */
fn split_remaining_accounts<'info>(
    remaining_accounts: &'info [AccountInfo<'info>],
) -> Result<(
    Vec<&'info AccountInfo<'info>>,
    Vec<&'info AccountInfo<'info>>,
    Vec<&'info AccountInfo<'info>>,
)> {
    let mut stake_accounts = Vec::new();
    let mut marinade_tickets = Vec::new();
    let mut accounts_for_pricing = Vec::new();

    // Iterate through the remaining accounts and categorize them by owner program
    for account in remaining_accounts.iter() {
        let owner = account.owner;
        let size = account.data.borrow().len();

        // marinade ticket account size need to include the anchor discriminator
        if *owner == marinade::ID && size == std::mem::size_of::<TicketAccountData>() + 8 {
            marinade_tickets.push(account);
        } else if *owner == solana_program::stake::program::ID
            && size == std::mem::size_of::<StakeAccount>()
        {
            stake_accounts.push(account);
        } else {
            accounts_for_pricing.push(account);
        }
    }

    #[cfg(not(feature = "mainnet"))]
    msg!(
        "stake_accounts={:?}, marinade_tickets={:?}, accounts_for_pricing={:?}",
        stake_accounts.iter().map(|a| a.key()).collect::<Vec<_>>(),
        marinade_tickets.iter().map(|a| a.key()).collect::<Vec<_>>(),
        accounts_for_pricing
            .iter()
            .map(|a| a.key())
            .collect::<Vec<_>>()
    );

    Ok((stake_accounts, marinade_tickets, accounts_for_pricing))
}

pub fn get_epoch_progress<'info>() -> Result<f64> {
    let clock = Clock::get()?;

    // Retrieve the EpochSchedule sysvar and get first slot in epoch & slots per epoch
    let epoch_schedule = EpochSchedule::get()?;
    let first_slot_in_epoch = epoch_schedule.get_first_slot_in_epoch(clock.epoch);
    let slots_in_epoch = epoch_schedule.get_slots_in_epoch(clock.epoch);

    // Calculate epoch progress as a percentage
    let slot_index = clock.slot - first_slot_in_epoch;
    let epoch_progress = (slot_index as f64 / slots_in_epoch as f64) * 100.0;

    #[cfg(not(feature = "mainnet"))]
    msg!(
        "Epoch: {}, Slot: {}, Progress: {:.2}%",
        clock.epoch,
        clock.slot,
        epoch_progress
    );

    Ok(epoch_progress)
}
