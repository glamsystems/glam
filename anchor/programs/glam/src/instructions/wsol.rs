use anchor_lang::prelude::*;

use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{
    close_account, sync_native, CloseAccount, Mint, SyncNative, Token, TokenAccount,
};
use glam_macros::vault_signer_seeds;

use crate::{constants::*, state::*};

#[derive(Accounts)]
pub struct WSolWrap<'info> {
    #[account()]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = wsol_mint,
        associated_token::authority = vault)]
    pub vault_wsol_ata: Account<'info, TokenAccount>,

    #[account(address = WSOL)]
    pub wsol_mint: Account<'info, Mint>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::WSolWrap)
)]
#[vault_signer_seeds]
pub fn wrap_handler(ctx: Context<WSolWrap>, lamports: u64) -> Result<()> {
    // Transfer SOL to token account
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.vault_wsol_ata.to_account_info(),
            },
            vault_signer_seeds,
        ),
        lamports,
    )?;

    // Sync the native token to reflect the new SOL balance as wSOL
    sync_native(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        SyncNative {
            account: ctx.accounts.vault_wsol_ata.to_account_info(),
        },
        vault_signer_seeds,
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct WSolUnwrap<'info> {
    #[account()]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        associated_token::mint = wsol_mint,
        associated_token::authority = vault)]
    pub vault_wsol_ata: Account<'info, TokenAccount>,

    #[account(address = WSOL)]
    pub wsol_mint: Account<'info, Mint>,

    #[account(mut)]
    pub signer: Signer<'info>,

    // programs
    pub token_program: Program<'info, Token>,
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::WSolUnwrap)
)]
#[vault_signer_seeds]
pub fn unwrap_handler(ctx: Context<WSolUnwrap>) -> Result<()> {
    close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.vault_wsol_ata.to_account_info(),
            destination: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        vault_signer_seeds,
    ))?;

    Ok(())
}
