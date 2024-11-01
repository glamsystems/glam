use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};
use solana_program::{instruction::Instruction, program::invoke_signed};

use crate::error::ManagerError;
use crate::state::*;

#[derive(Clone)]
pub struct Jupiter;

impl anchor_lang::Id for Jupiter {
    fn id() -> Pubkey {
        pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4")
    }
}

#[derive(Accounts)]
pub struct JupiterSwap<'info> {
    // fund can mutate: output_mint can be added to assets
    #[account(mut)]
    pub fund: Box<Account<'info, FundAccount>>,
    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    /// CHECK: no need to deser because we transfer_checked from
    ///        input_treasury_ata to input_signer_ata
    #[account(mut)]
    pub input_treasury_ata: UncheckedAccount<'info>,
    #[account(
        mut,
        associated_token::mint = input_mint,
        associated_token::authority = signer,
        associated_token::token_program = input_token_program
    )]
    pub input_signer_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: no need deser, trust Jupiter
    #[account(mut)]
    pub output_signer_ata: UncheckedAccount<'info>,
    #[account(
        mut,
        associated_token::mint = output_mint,
        associated_token::authority = treasury,
        associated_token::token_program = output_token_program
    )]
    pub output_treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub input_mint: Box<InterfaceAccount<'info, Mint>>,
    pub output_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    // programs
    pub system_program: Program<'info, System>,
    pub jupiter_program: Program<'info, Jupiter>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub input_token_program: Interface<'info, TokenInterface>,
    pub output_token_program: Interface<'info, TokenInterface>,
}

fn parse_route(ctx: &Context<JupiterSwap>) -> (bool, usize) {
    let mut res = true;
    res &= ctx.remaining_accounts.len() > 9;

    res &= ctx.remaining_accounts[0].key() == ctx.accounts.output_token_program.key();
    res &= ctx.remaining_accounts[1].key() == ctx.accounts.signer.key();
    res &= ctx.remaining_accounts[2].key() == ctx.accounts.input_signer_ata.key();
    res &= ctx.remaining_accounts[3].key() == ctx.accounts.output_signer_ata.key();
    res &= ctx.remaining_accounts[4].key() == Jupiter::id(); // null key - overwritten later
    res &= ctx.remaining_accounts[5].key() == ctx.accounts.output_mint.key();
    res &= ctx.remaining_accounts[6].key() == Jupiter::id(); // null key

    // res &= ctx.remaining_accounts[7].key() - eventAuthority ignored
    res &= ctx.remaining_accounts[8].key() == Jupiter::id();

    (res, 4)
}

fn parse_exact_out_route(ctx: &Context<JupiterSwap>) -> (bool, usize) {
    let mut res = true;
    res &= ctx.remaining_accounts.len() > 11;

    res &= ctx.remaining_accounts[0].key() == ctx.accounts.output_token_program.key();
    res &= ctx.remaining_accounts[1].key() == ctx.accounts.signer.key();
    res &= ctx.remaining_accounts[2].key() == ctx.accounts.input_signer_ata.key();
    res &= ctx.remaining_accounts[3].key() == ctx.accounts.output_signer_ata.key();
    res &= ctx.remaining_accounts[4].key() == Jupiter::id(); // null key - overwritten later
    res &= ctx.remaining_accounts[5].key() == ctx.accounts.input_mint.key();
    res &= ctx.remaining_accounts[6].key() == ctx.accounts.output_mint.key();
    res &= ctx.remaining_accounts[7].key() == Jupiter::id(); // null key
    res &= ctx.remaining_accounts[8].key() == ctx.accounts.input_token_program.key()
        || ctx.remaining_accounts[8].key() == ctx.accounts.output_token_program.key()
        || ctx.remaining_accounts[8].key() == Jupiter::id(); // token program or null key

    // res &= ctx.remaining_accounts[9].key() - eventAuthority ignored
    res &= ctx.remaining_accounts[10].key() == Jupiter::id();

    (res, 4)
}

fn parse_shared_accounts_route(ctx: &Context<JupiterSwap>) -> (bool, usize) {
    let mut res = true;
    res &= ctx.remaining_accounts.len() > 13;

    res &= ctx.remaining_accounts[0].key() == ctx.accounts.output_token_program.key();
    // res &= ctx.remaining_accounts[1].key() - programAuthority ignored

    res &= ctx.remaining_accounts[2].key() == ctx.accounts.signer.key();
    res &= ctx.remaining_accounts[3].key() == ctx.accounts.input_signer_ata.key();
    // res &= ctx.remaining_accounts[4].key() - programSourceTokenAccount ignored
    // res &= ctx.remaining_accounts[5].key() - programDestinationTokenAccount ignored

    res &= ctx.remaining_accounts[6].key() == ctx.accounts.output_signer_ata.key();
    res &= ctx.remaining_accounts[7].key() == ctx.accounts.input_mint.key();
    res &= ctx.remaining_accounts[8].key() == ctx.accounts.output_mint.key();
    res &= ctx.remaining_accounts[9].key() == Jupiter::id(); // null key
    res &= ctx.remaining_accounts[10].key() == ctx.accounts.input_token_program.key()
        || ctx.remaining_accounts[10].key() == ctx.accounts.output_token_program.key()
        || ctx.remaining_accounts[10].key() == Jupiter::id(); // token program or null key

    // res &= ctx.remaining_accounts[11].key() - eventAuthority ignored
    res &= ctx.remaining_accounts[12].key() == Jupiter::id();

    (res, 6)
}

#[access_control(
    acl::check_access_any(
        &ctx.accounts.fund,
        &ctx.accounts.signer.key,
        vec![Permission::JupiterSwapFundAssets, Permission::JupiterSwapAnyAsset]
    )
)]
pub fn jupiter_swap<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, JupiterSwap<'info>>,
    amount: u64,
    data: Vec<u8>,
) -> Result<()> {
    // Check if swap is among assets that belong to the funds, or possibly new
    // assets. swap_any tells if either the input or output is not part of the fund
    let fund = ctx.accounts.fund.clone();
    let assets = ctx.accounts.fund.assets_mut().unwrap();
    let output_in_assets = assets.contains(&ctx.accounts.output_mint.key());
    let input_in_assets = assets.contains(&ctx.accounts.input_mint.key());
    let swap_any = !(output_in_assets && input_in_assets);

    // Manager is currently always allowed to swap_any
    if swap_any && fund.manager != *ctx.accounts.signer.key {
        // Delegate must have JupiterSwapAnyAsset perm
        if let Some(acls) = fund.delegate_acls() {
            // Check if the signer is allowed to swap any asset
            let can_swap_any_asset = acls.iter().any(|acl| {
                acl.pubkey == *ctx.accounts.signer.key
                    && acl.permissions.contains(&Permission::JupiterSwapAnyAsset)
            });
            require!(can_swap_any_asset, ManagerError::InvalidAssetForSwap);
        }

        // Add output mint to fund assets
        if !output_in_assets {
            assets.push(ctx.accounts.output_mint.key());
        }
    }

    // Parse Jupiter Swap accounts
    let ix_disc = u64::from_be_bytes(data[..8].try_into().unwrap());
    let (parse_result, dst_ata_idx) = match ix_disc {
        0xe517cb977ae3ad2a => parse_route(&ctx),           // route
        0xd033ef977b2bed5c => parse_exact_out_route(&ctx), // exactOutRoute
        0xc1209b3341d69c81 => parse_shared_accounts_route(&ctx), // sharedAccountsRoute
        0xb0d169a89a7d453e => parse_shared_accounts_route(&ctx), // sharedAccountsExactOutRoute (same)
        _ => panic!("Jupiter instruction not supported"),
    };
    require!(parse_result, ManagerError::InvalidSwap);

    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    //
    // Transfer treasury -> signer
    //
    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.input_token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.input_treasury_ata.to_account_info(),
                mint: ctx.accounts.input_mint.to_account_info(),
                to: ctx.accounts.input_signer_ata.to_account_info(),
                authority: ctx.accounts.treasury.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
        ctx.accounts.input_mint.decimals,
    )?;

    //
    // Jupiter swap
    //

    // Map remaining_accounts -> AccountMeta
    let mut accounts: Vec<AccountMeta> = ctx
        .remaining_accounts
        .iter()
        .map(|acc| AccountMeta {
            pubkey: *acc.key,
            is_signer: acc.is_signer,
            is_writable: acc.is_writable,
        })
        .collect();

    // Override destinationTokenAccount
    accounts[dst_ata_idx] = AccountMeta {
        pubkey: ctx.accounts.output_treasury_ata.key(),
        is_signer: false,
        is_writable: true,
    };

    // Include output_treasury_ata in accounts_infos (add it to remaining_accounts)
    let accounts_infos = &[
        ctx.remaining_accounts,
        &[ctx.accounts.output_treasury_ata.to_account_info()],
    ]
    .concat();

    // Swap
    let _ = invoke_signed(
        &Instruction {
            program_id: Jupiter::id(),
            accounts,
            data,
        },
        accounts_infos,
        &[],
    );

    Ok(())
}
