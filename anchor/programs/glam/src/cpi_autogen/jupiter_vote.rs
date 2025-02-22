use crate::state::{
    acl::{self, *},
    StateAccount,
};
use anchor_lang::prelude::*;
pub use jupiter_vote::program::LockedVoter as JupiterVote;
use jupiter_vote::typedefs::*;
#[derive(Accounts)]
pub struct JupiterVoteNewEscrow<'info> {
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
    #[account(mut)]
    pub locker: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub escrow: AccountInfo<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct JupiterVoteIncreaseLockedAmount<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        mut,
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, JupiterVote>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub locker: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub escrow: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub escrow_tokens: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub source_tokens: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct JupiterVoteWithdraw<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        mut,
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, JupiterVote>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub locker: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub escrow: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub escrow_tokens: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub destination_tokens: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct JupiterVoteCastVote<'info> {
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
    pub escrow: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub proposal: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub vote: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub governor: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub govern_program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct JupiterVoteOpenPartialUnstaking<'info> {
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
    #[account(mut)]
    pub locker: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub escrow: AccountInfo<'info>,
    #[account(mut)]
    pub partial_unstake: Signer<'info>,
    pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct JupiterVoteMergePartialUnstaking<'info> {
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
    #[account(mut)]
    pub locker: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub escrow: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub partial_unstake: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct JupiterVoteWithdrawPartialUnstaking<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,
    #[account(
        mut,
        seeds = [crate::constants::SEED_VAULT.as_bytes(),
        glam_state.key().as_ref()],
        bump
    )]
    pub glam_vault: SystemAccount<'info>,
    #[account(mut)]
    pub glam_signer: Signer<'info>,
    pub cpi_program: Program<'info, JupiterVote>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub locker: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub escrow: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub partial_unstake: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub escrow_tokens: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub destination_tokens: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub token_program: AccountInfo<'info>,
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::StakeJup
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::JupiterVote)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn jupiter_vote_new_escrow(ctx: Context<JupiterVoteNewEscrow>) -> Result<()> {
    jupiter_vote::cpi::new_escrow(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            jupiter_vote::cpi::accounts::NewEscrow {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                escrow_owner: ctx.accounts.glam_vault.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
    )
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
pub fn jupiter_vote_increase_locked_amount(
    ctx: Context<JupiterVoteIncreaseLockedAmount>,
    amount: u64,
) -> Result<()> {
    jupiter_vote::cpi::increase_locked_amount(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            jupiter_vote::cpi::accounts::IncreaseLockedAmount {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                escrow_tokens: ctx.accounts.escrow_tokens.to_account_info(),
                payer: ctx.accounts.glam_vault.to_account_info(),
                source_tokens: ctx.accounts.source_tokens.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        amount,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::UnstakeJup
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::JupiterVote)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn jupiter_vote_withdraw(ctx: Context<JupiterVoteWithdraw>) -> Result<()> {
    jupiter_vote::cpi::withdraw(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            jupiter_vote::cpi::accounts::Withdraw {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                escrow_owner: ctx.accounts.glam_vault.to_account_info(),
                escrow_tokens: ctx.accounts.escrow_tokens.to_account_info(),
                destination_tokens: ctx.accounts.destination_tokens.to_account_info(),
                payer: ctx.accounts.glam_vault.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
    )
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
pub fn jupiter_vote_cast_vote(
    ctx: Context<JupiterVoteCastVote>,
    side: u8,
) -> Result<()> {
    jupiter_vote::cpi::cast_vote(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            jupiter_vote::cpi::accounts::CastVote {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                vote_delegate: ctx.accounts.glam_vault.to_account_info(),
                proposal: ctx.accounts.proposal.to_account_info(),
                vote: ctx.accounts.vote.to_account_info(),
                governor: ctx.accounts.governor.to_account_info(),
                govern_program: ctx.accounts.govern_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        side,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::UnstakeJup
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::JupiterVote)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn jupiter_vote_open_partial_unstaking(
    ctx: Context<JupiterVoteOpenPartialUnstaking>,
    amount: u64,
    memo: String,
) -> Result<()> {
    jupiter_vote::cpi::open_partial_unstaking(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            jupiter_vote::cpi::accounts::OpenPartialUnstaking {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                partial_unstake: ctx.accounts.partial_unstake.to_account_info(),
                owner: ctx.accounts.glam_vault.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        amount,
        memo,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::UnstakeJup
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::JupiterVote)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn jupiter_vote_merge_partial_unstaking(
    ctx: Context<JupiterVoteMergePartialUnstaking>,
) -> Result<()> {
    jupiter_vote::cpi::merge_partial_unstaking(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            jupiter_vote::cpi::accounts::MergePartialUnstaking {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                partial_unstake: ctx.accounts.partial_unstake.to_account_info(),
                owner: ctx.accounts.glam_vault.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::UnstakeJup
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::JupiterVote)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn jupiter_vote_withdraw_partial_unstaking(
    ctx: Context<JupiterVoteWithdrawPartialUnstaking>,
) -> Result<()> {
    jupiter_vote::cpi::withdraw_partial_unstaking(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            jupiter_vote::cpi::accounts::WithdrawPartialUnstaking {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                partial_unstake: ctx.accounts.partial_unstake.to_account_info(),
                owner: ctx.accounts.glam_vault.to_account_info(),
                escrow_tokens: ctx.accounts.escrow_tokens.to_account_info(),
                destination_tokens: ctx.accounts.destination_tokens.to_account_info(),
                payer: ctx.accounts.glam_vault.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
    )
}
