use anchor_lang::prelude::*;

use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{
    close_account, sync_native, CloseAccount, Mint, SyncNative, Token, TokenAccount,
};

use crate::{constants::*, state::*};

#[derive(Accounts)]
pub struct WSolWrap<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = glam_signer,
        associated_token::mint = wsol_mint,
        associated_token::authority = glam_vault)]
    pub vault_wsol_ata: Account<'info, TokenAccount>,

    pub wsol_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[access_control(
    acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::WSolWrap)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn wrap_handler(ctx: Context<WSolWrap>, lamports: u64) -> Result<()> {
    // Transfer SOL to token account
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.glam_vault.to_account_info(),
                to: ctx.accounts.vault_wsol_ata.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        lamports,
    )?;

    // Sync the native token to reflect the new SOL balance as wSOL
    sync_native(CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        SyncNative {
            account: ctx.accounts.vault_wsol_ata.to_account_info(),
        },
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct WSolUnwrap<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

    #[account(mut, associated_token::mint = WSOL, associated_token::authority = glam_vault)]
    pub vault_wsol_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[access_control(
    acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::WSolUnwrap)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn unwrap_handler(ctx: Context<WSolUnwrap>) -> Result<()> {
    close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.vault_wsol_ata.to_account_info(),
            destination: ctx.accounts.glam_vault.to_account_info(),
            authority: ctx.accounts.glam_vault.to_account_info(),
        },
        glam_vault_signer_seeds,
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct SolToWSol<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

    #[account(mut, associated_token::mint = WSOL, associated_token::authority = glam_vault)]
    pub to: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[access_control(
    acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::WSolWrap)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn sol_to_wsol_handler(ctx: Context<SolToWSol>, lamports: u64) -> Result<()> {
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.glam_vault.to_account_info(),
                to: ctx.accounts.to.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        lamports,
    )
}
