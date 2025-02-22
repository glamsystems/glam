use crate::state::{
    acl::{self, *},
    StateAccount,
};
use anchor_lang::prelude::*;
pub use jupiter_gov::program::Govern as JupiterGov;
use jupiter_gov::typedefs::*;
#[derive(Accounts)]
pub struct JupiterGovNewVote<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, JupiterGov>,
    /// CHECK: should be validated by target program
    pub proposal: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub vote: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::VoteOnProposal
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::JupiterVote)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn jupiter_gov_new_vote(
    ctx: Context<JupiterGovNewVote>,
    voter: Pubkey,
) -> Result<()> {
    jupiter_gov::cpi::new_vote(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            jupiter_gov::cpi::accounts::NewVote {
                proposal: ctx.accounts.proposal.to_account_info(),
                vote: ctx.accounts.vote.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        voter,
    )
}
