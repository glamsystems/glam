use anchor_lang::prelude::*;

use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{
    close_account, sync_native, CloseAccount, Mint, SyncNative, Token, TokenAccount,
};

use crate::constants::WSOL;
use crate::state::*;

#[derive(Accounts)]
pub struct WSolWrap<'info> {
    #[account()]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        rent_exempt = skip,
        associated_token::mint = wsol_mint,
        associated_token::authority = treasury)]
    pub treasury_wsol_ata: Account<'info, TokenAccount>,

    #[account(address = WSOL)]
    pub wsol_mint: Account<'info, Mint>,

    #[account(mut)]
    pub signer: Signer<'info>,

    // programs
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.signer.key, Permission::WSolWrap)
)]
pub fn wsol_wrap(ctx: Context<WSolWrap>, lamports: u64) -> Result<()> {
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
        lamports,
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
    #[account()]
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
    pub signer: Signer<'info>,

    // programs
    pub token_program: Program<'info, Token>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.signer.key, Permission::WSolUnwrap)
)]
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
