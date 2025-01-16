use crate::constants::*;
use crate::state::{
    acl::{self, *},
    StateAccount,
};
use anchor_lang::prelude::*;
use kamino_lending::program::KaminoLending;
use kamino_lending::typedefs::*;
#[derive(Accounts)]
pub struct KaminoLendingInitUserMetadata<'info> {
    #[account(mut)]
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, KaminoLending>,
    /// CHECK: should be validated by target program
    pub owner: AccountInfo<'info>,
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    #[account(mut)]
    /// CHECK: should be validated by target program
    pub user_metadata: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub referrer_user_metadata: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::InitKamino
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::KaminoLending)
)]
pub fn kamino_lending_init_user_metadata(
    ctx: Context<KaminoLendingInitUserMetadata>,
    user_lookup_table: Pubkey,
) -> Result<()> {
    let state_key = ctx.accounts.glam_state.key();
    let seeds = [
        "vault".as_ref(),
        state_key.as_ref(),
        &[ctx.bumps.glam_vault],
    ];
    let vault_signer_seeds = &[&seeds[..]];
    kamino_lending::cpi::init_user_metadata(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            kamino_lending::cpi::accounts::InitUserMetadata {
                owner: ctx.accounts.owner.to_account_info(),
                fee_payer: ctx.accounts.fee_payer.to_account_info(),
                user_metadata: ctx.accounts.user_metadata.to_account_info(),
                referrer_user_metadata: ctx.accounts.referrer_user_metadata.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            vault_signer_seeds,
        ),
        user_lookup_table,
    )
}
