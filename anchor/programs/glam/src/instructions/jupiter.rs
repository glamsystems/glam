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
    #[account(has_one = manager @ ManagerError::NotAuthorizedError)]
    pub fund: Box<Account<'info, FundAccount>>,
    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    /// CHECK: no need to create because input ata should exist to swap,
    ///        and no need to deser because we transfer_checked from
    ///        input_treasury_ata to input_signer_ata
    #[account(mut)]
    pub input_treasury_ata: UncheckedAccount<'info>,
    #[account(
        mut,
        associated_token::mint = input_mint,
        associated_token::authority = manager)]
    pub input_signer_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = output_mint,
        associated_token::authority = manager)]
    pub output_signer_ata: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = output_mint,
        associated_token::authority = treasury)]
    pub output_treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub input_mint: Box<InterfaceAccount<'info, Mint>>,
    pub output_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut)]
    pub manager: Signer<'info>,

    // programs
    pub system_program: Program<'info, System>,
    pub jupiter_program: Program<'info, Jupiter>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub token_2022_program: Program<'info, Token2022>,
}

pub fn jupiter_swap<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, JupiterSwap<'info>>,
    amount: u64,
    data: Vec<u8>,
) -> Result<()> {
    // Check if the input and output mint are allowed
    if let Some(assets) = ctx.accounts.fund.assets() {
        require!(
            assets.iter().any(|&k| k == ctx.accounts.input_mint.key())
                && assets.iter().any(|&k| k == ctx.accounts.output_mint.key()),
            ManagerError::InvalidAssetForSwap
        );
    }

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
    let mut accounts: Vec<AccountMeta> = ctx
        .remaining_accounts
        .iter()
        .map(|acc| AccountMeta {
            pubkey: *acc.key,
            is_signer: acc.is_signer,
            is_writable: acc.is_writable,
        })
        .collect();

    // We now validate the accounts, according to Jupiter v6 route ix.
    // Note: we assume that Jupiter is doing its own validation, so we
    // only check the first 9 accounts (skipping eventAuthority)
    require!(ctx.remaining_accounts.len() > 9, ManagerError::InvalidSwap);
    // Jupiter uses its own program as null key
    let null_key = ctx.accounts.jupiter_program.key();
    let check_accounts = &[
        ctx.accounts.token_program.key(), // tokenProgram (explicitly checked)
        ctx.accounts.manager.key(),       // userTransferAuthority
        ctx.accounts.input_signer_ata.key(), // userSourceTokenAccount
        ctx.accounts.output_signer_ata.key(), // userDestinationTokenAccount
        null_key,                         // destinationTokenAccount
        ctx.accounts.output_mint.key(),   // destinationMint
        null_key,                         // platformFeeAccount
                                          // eventAuthority (ignored)
                                          // program (explicitly checked)
    ];
    // program == Jupiter
    require!(
        *ctx.remaining_accounts[8].key == ctx.accounts.jupiter_program.key(),
        ManagerError::InvalidSwap
    );
    // tokenProgaram == either token or token2022
    require!(
        *ctx.remaining_accounts[0].key == ctx.accounts.token_program.key()
            || *ctx.remaining_accounts[0].key == ctx.accounts.token_2022_program.key(),
        ManagerError::InvalidSwap
    );
    // check all other accounts
    for (&expected, to_check) in check_accounts.iter().zip(ctx.remaining_accounts).skip(1) {
        require!(to_check.key() == expected, ManagerError::InvalidSwap);
    }

    accounts[4] = AccountMeta {
        pubkey: ctx.accounts.output_treasury_ata.key(),
        is_signer: false,
        is_writable: true,
    };
    let _ = invoke_signed(
        &Instruction {
            program_id: *ctx.accounts.jupiter_program.key,
            accounts,
            data,
        },
        &[
            ctx.remaining_accounts,
            &[ctx.accounts.output_treasury_ata.to_account_info()],
        ]
        .concat(),
        &[],
    );

    Ok(())
}
