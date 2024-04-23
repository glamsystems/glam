use anchor_lang::{prelude::*, system_program};
use anchor_spl::token_2022;
use anchor_spl::token_interface::{Mint, Token2022};
use spl_token_2022::{extension::ExtensionType, state::Mint as StateMint};

use crate::error::ManagerError;
use crate::state::fund::*;

#[derive(Accounts)]
#[instruction(fund_model: FundModel)]
pub struct InitializeFundV2<'info> {
    #[account(init, seeds = [b"fund".as_ref(), manager.key().as_ref(), fund_model.created.as_ref().unwrap().key.as_ref()], bump, payer = manager, space = FundAccount::INIT_SIZE)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(init, seeds = [b"openfund".as_ref(), fund.key().as_ref()], bump, payer = manager, space = FundMetadataAccount::INIT_SIZE)]
    pub openfund: Box<Account<'info, FundMetadataAccount>>,

    // #[account(seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump, seeds::program = engine)]
    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    /// CHECK: we'll create the account later on with metadata
    #[account(mut)]
    pub share: AccountInfo<'info>,

    #[account(mut)]
    pub manager: Signer<'info>,

    // pub engine: Program<'info, TODO>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize_fund_v2_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, InitializeFundV2<'info>>,
    fund_model: FundModel,
) -> Result<()> {
    //
    // Validate the input
    //
    /*
    require!(
        fund.name.as_bytes().len() <= MAX_FUND_NAME,
        ManagerError::InvalidFundName
    );
    require!(
        fund_symbol.as_bytes().len() <= MAX_FUND_SYMBOL,
        ManagerError::InvalidFundSymbol
    );
    require!(
        fund_uri.as_bytes().len() <= MAX_FUND_URI,
        ManagerError::InvalidFundUri
    );

    let assets_len = ctx.remaining_accounts.len();
    require!(
        asset_weights.len() == assets_len,
        ManagerError::InvalidAssetsLen
    );
    */

    //
    // Initialize the fund
    //
    let fund = &mut ctx.accounts.fund;
    let treasury = &mut ctx.accounts.treasury;
    let share = &mut ctx.accounts.share;
    let openfund = &mut ctx.accounts.openfund;

    // fund.name = fund_name;
    // fund.uri = fund_uri;
    fund.treasury = treasury.key();
    fund.share_class = vec![share.key()];
    fund.openfund = openfund.key();
    // fund.openfund_uri = openfund_uri;
    fund.manager = ctx.accounts.manager.key();

    fund.params = vec![vec![
        // GlamParam {
        //     key: OFKey::Symbol,
        //     val: OFValue::String { val: fund_symbol },
        // },
        // GlamParam {
        //     key: OFKey::TimeCreated,
        //     val: OFValue::Timestamp {
        //         val: Clock::get()?.unix_timestamp,
        //     },
        // },
        // GlamParam {
        //     key: OFKey::Active,
        //     val: OFValue::Boolean { val: activate },
        // },
    ]];
    // fund.symbol = fund_symbol;
    // fund.bump_fund = ctx.bumps.fund;
    // fund.bump_treasury = ctx.bumps.treasury;
    // fund.time_created = Clock::get()?.unix_timestamp;
    // fund.share_classes_len = 1;
    // fund.share_classes[0] = ctx.accounts.share.key();
    // fund.share_classes_metadata[0] = share_class_metadata.clone();
    // fund.share_classes_bumps[0] = ctx.bumps.share;

    // fund.assets_len = assets_len as u8;
    // for (i, account) in ctx.remaining_accounts.iter().enumerate() {
    //     let asset = InterfaceAccount::<Mint>::try_from(account).expect("invalid asset");
    //     fund.assets[i] = asset.key();
    // }
    // for (i, &w) in asset_weights.iter().enumerate() {
    //     fund.assets_weights[i] = w;
    // }
    // fund.is_active = activate;

    msg!("Fund created: {}", ctx.accounts.fund.key());
    Ok(())
}
