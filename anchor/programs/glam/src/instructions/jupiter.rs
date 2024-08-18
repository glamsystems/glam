use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;
use anchor_spl::token_interface::{
    transfer_checked, Mint, Token2022, TokenAccount, TransferChecked,
};
use solana_program::{instruction::Instruction, program::invoke_signed};

use crate::error::ManagerError;
use crate::state::*;

mod jupiter {
    use anchor_lang::declare_id;
    declare_id!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");
}

#[derive(Clone)]
pub struct Jupiter;

impl anchor_lang::Id for Jupiter {
    fn id() -> Pubkey {
        jupiter::id()
    }
}

#[derive(Accounts)]
pub struct JupiterSwap<'info> {
    #[account()]
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
        associated_token::authority = signer)]
    pub input_signer_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: no need deser, trust Jupiter
    #[account(mut)]
    pub output_signer_ata: UncheckedAccount<'info>,
    #[account(
        mut,
        associated_token::mint = output_mint,
        associated_token::authority = treasury)]
    pub output_treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub input_mint: Box<InterfaceAccount<'info, Mint>>,
    pub output_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    // programs
    pub system_program: Program<'info, System>,
    pub jupiter_program: Program<'info, Jupiter>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
}

fn parse_route(ctx: &Context<JupiterSwap>) -> (bool, usize) {
    let mut res = true;
    res &= ctx.remaining_accounts.len() > 9;

    res &= ctx.remaining_accounts[0].key() == ctx.accounts.token_program.key();
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

    res &= ctx.remaining_accounts[0].key() == ctx.accounts.token_program.key();
    res &= ctx.remaining_accounts[1].key() == ctx.accounts.signer.key();
    res &= ctx.remaining_accounts[2].key() == ctx.accounts.input_signer_ata.key();
    res &= ctx.remaining_accounts[3].key() == ctx.accounts.output_signer_ata.key();
    res &= ctx.remaining_accounts[4].key() == Jupiter::id(); // null key - overwritten later
    res &= ctx.remaining_accounts[5].key() == ctx.accounts.input_mint.key();
    res &= ctx.remaining_accounts[6].key() == ctx.accounts.output_mint.key();
    res &= ctx.remaining_accounts[7].key() == Jupiter::id(); // null key
    res &= ctx.remaining_accounts[8].key() == ctx.accounts.token_2022_program.key()
        || ctx.remaining_accounts[8].key() == Jupiter::id(); // token2022 or null key

    // res &= ctx.remaining_accounts[9].key() - eventAuthority ignored
    res &= ctx.remaining_accounts[10].key() == Jupiter::id();

    (res, 4)
}

fn parse_shared_accounts_route(ctx: &Context<JupiterSwap>) -> (bool, usize) {
    let mut res = true;
    res &= ctx.remaining_accounts.len() > 13;

    res &= ctx.remaining_accounts[0].key() == ctx.accounts.token_program.key();
    // res &= ctx.remaining_accounts[1].key() - programAuthority ignored

    res &= ctx.remaining_accounts[2].key() == ctx.accounts.signer.key();
    res &= ctx.remaining_accounts[3].key() == ctx.accounts.input_signer_ata.key();
    // res &= ctx.remaining_accounts[4].key() - programSourceTokenAccount ignored
    // res &= ctx.remaining_accounts[5].key() - programDestinationTokenAccount ignored

    res &= ctx.remaining_accounts[6].key() == ctx.accounts.output_signer_ata.key();
    res &= ctx.remaining_accounts[7].key() == ctx.accounts.input_mint.key();
    res &= ctx.remaining_accounts[8].key() == ctx.accounts.output_mint.key();
    res &= ctx.remaining_accounts[9].key() == Jupiter::id(); // null key
    res &= ctx.remaining_accounts[10].key() == ctx.accounts.token_2022_program.key()
        || ctx.remaining_accounts[10].key() == Jupiter::id(); // token2022 or null key

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
    if let Some(acls) = ctx.accounts.fund.delegate_acls() {
        // Check if the signer is allowed to swap any asset
        let can_swap_any_asset = acls.iter().any(|acl| {
            acl.pubkey == *ctx.accounts.signer.key
                && acl.permissions.contains(&Permission::JupiterSwapAnyAsset)
        });

        // If the signer doesn't have permission to swap any asset, check the input and output mints
        if !can_swap_any_asset {
            if let Some(assets) = ctx.accounts.fund.assets() {
                require!(
                    assets.contains(&ctx.accounts.input_mint.key())
                        && assets.contains(&ctx.accounts.output_mint.key()),
                    ManagerError::InvalidAssetForSwap
                );
            }
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
    let input_program = if ctx.accounts.input_signer_ata.owner == Token2022::id() {
        ctx.accounts.token_2022_program.to_account_info()
    } else {
        ctx.accounts.token_program.to_account_info()
    };
    transfer_checked(
        CpiContext::new_with_signer(
            input_program,
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
