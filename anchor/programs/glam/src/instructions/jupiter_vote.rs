use anchor_lang::prelude::*;

use crate::cpi_autogen::jupiter_vote::{jupiter_vote_cast_vote, JupiterVote, JupiterVoteCastVote};
use jupiter_gov::state::Vote;

use crate::error::GlamError;
use crate::state::*;

#[derive(Accounts)]
pub struct JupiterVoteToggleMaxLock<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, JupiterVote>,
    /// CHECK: should be validated by target program
    pub locker: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub escrow: AccountInfo<'info>,
}

pub fn jupiter_vote_toggle_max_lock_pre_checks(
    ctx: &Context<JupiterVoteToggleMaxLock>,
    is_max_lock: bool,
) -> Result<()> {
    let accepted_permissions = if is_max_lock {
        vec![Permission::StakeJup]
    } else {
        vec![Permission::UnstakeJup]
    };
    acl::check_access_any(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key(),
        accepted_permissions,
    )
}

#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::JupiterVote)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn jupiter_vote_toggle_max_lock(
    ctx: Context<JupiterVoteToggleMaxLock>,
    is_max_lock: bool,
) -> Result<()> {
    jupiter_vote_toggle_max_lock_pre_checks(&ctx, is_max_lock)?;

    jupiter_vote::cpi::toggle_max_lock(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            jupiter_vote::cpi::accounts::ToggleMaxLock {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                escrow_owner: ctx.accounts.glam_vault.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        is_max_lock,
    )
}

pub fn jupiter_vote_cast_vote_checked(
    ctx: Context<JupiterVoteCastVote>,
    side: u8,
    existing_side: u8,
) -> Result<()> {
    {
        // Client side should check vote and get current_side
        // If actual side is different, it means the vote has changed and this side change is invalid
        let data = ctx.accounts.vote.try_borrow_data()?;
        let vote = Vote::try_deserialize(&mut &data[..])?;
        require!(existing_side == vote.side, GlamError::InvalidVoteSide);
    }

    jupiter_vote_cast_vote(ctx, side)
}
