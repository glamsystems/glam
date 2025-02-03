use crate::state::{
    acl::{self, *},
    StateAccount,
};
use anchor_lang::prelude::*;
use kamino_lending::program::KaminoLending;
use kamino_lending::typedefs::*;
#[derive(Accounts)]
pub struct KaminoLendingInitUserMetadata<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, KaminoLending>,
    /// CHECK: should be validated by target program
    #[account(address = glam_state.vault)]
    pub owner: AccountInfo<'info>,
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
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
#[glam_macros::glam_vault_signer_seeds]
pub fn kamino_lending_init_user_metadata(
    ctx: Context<KaminoLendingInitUserMetadata>,
    user_lookup_table: Pubkey,
) -> Result<()> {
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
            glam_vault_signer_seeds,
        ),
        user_lookup_table,
    )
}

#[derive(Accounts)]
pub struct KaminoLendingInitObligation<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, KaminoLending>,
    /// CHECK: should be validated by target program
    #[account(address = glam_state.vault)]
    pub obligation_owner: AccountInfo<'info>,
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub obligation: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub lending_market: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub seed1_account: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub seed2_account: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub owner_user_metadata: AccountInfo<'info>,
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
#[glam_macros::glam_vault_signer_seeds]
pub fn kamino_lending_init_obligation(
    ctx: Context<KaminoLendingInitObligation>,
    args: InitObligationArgs,
) -> Result<()> {
    kamino_lending::cpi::init_obligation(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            kamino_lending::cpi::accounts::InitObligation {
                obligation_owner: ctx.accounts.obligation_owner.to_account_info(),
                fee_payer: ctx.accounts.fee_payer.to_account_info(),
                obligation: ctx.accounts.obligation.to_account_info(),
                lending_market: ctx.accounts.lending_market.to_account_info(),
                seed1_account: ctx.accounts.seed1_account.to_account_info(),
                seed2_account: ctx.accounts.seed2_account.to_account_info(),
                owner_user_metadata: ctx.accounts.owner_user_metadata.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        args,
    )
}
