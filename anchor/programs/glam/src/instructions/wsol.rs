use anchor_lang::prelude::*;

use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{
    close_account, sync_native, CloseAccount, Mint, SyncNative, Token, TokenAccount,
};
use solana_program::pubkey;

use crate::error::ManagerError;
use crate::state::*;

pub const WSOL: Pubkey = pubkey!("So11111111111111111111111111111111111111112");

#[derive(Accounts)]
pub struct WSolWrap<'info> {
    #[account(has_one = manager @ ManagerError::NotAuthorizedError)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = manager,
        associated_token::mint = wsol_mint,
        associated_token::authority = treasury)]
    pub treasury_wsol_ata: Account<'info, TokenAccount>,

    #[account(address = WSOL)]
    pub wsol_mint: Account<'info, Mint>,

    #[account(mut)]
    pub manager: Signer<'info>,

    // programs
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn wsol_wrap(ctx: Context<WSolWrap>, amount: u64) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    // Transfer SOL to token account
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.treasury.to_account_info(),
                to: ctx.accounts.treasury_wsol_ata.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    // Sync the native token to reflect the new SOL balance as wSOL
    sync_native(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        SyncNative {
            account: ctx.accounts.treasury_wsol_ata.to_account_info(),
        },
        signer_seeds,
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct WSolUnwrap<'info> {
    #[account(has_one = manager @ ManagerError::NotAuthorizedError)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(
        mut,
        associated_token::mint = wsol_mint,
        associated_token::authority = treasury)]
    pub treasury_wsol_ata: Account<'info, TokenAccount>,

    #[account(address = WSOL)]
    pub wsol_mint: Account<'info, Mint>,

    #[account(mut)]
    pub manager: Signer<'info>,

    // programs
    pub token_program: Program<'info, Token>,
}

pub fn wsol_unwrap(ctx: Context<WSolUnwrap>) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.treasury_wsol_ata.to_account_info(),
            destination: ctx.accounts.treasury.to_account_info(),
            authority: ctx.accounts.treasury.to_account_info(),
        },
        signer_seeds,
    ))?;

    Ok(())
}
