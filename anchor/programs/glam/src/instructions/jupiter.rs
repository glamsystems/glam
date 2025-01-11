use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};
use glam_macros::vault_signer_seeds;

use solana_program::{instruction::Instruction, program::invoke_signed};

use jup_locked_voter::cpi::{
    accounts::{
        CastVote as JupCastVote, IncreaseLockedAmount as StakeJup, MergePartialUnstaking,
        NewEscrow, OpenPartialUnstaking, ToggleMaxLock as JupToggleMaxLock, Withdraw,
        WithdrawPartialUnstaking as JupWithdrawPartialUnstaking,
    },
    cast_vote as jup_cast_vote, increase_locked_amount as stake_jup,
    merge_partial_unstaking as jup_merge_partial_unstaking, new_escrow,
    open_partial_unstaking as jup_open_partial_unstaking, toggle_max_lock as jup_toggle_max_lock,
    withdraw, withdraw_partial_unstaking as jup_partial_withdraw,
};
use jup_locked_voter::program::LockedVoter;
use jup_locked_voter::state::{Escrow, Locker, PartialUnstaking as PartialUnstakeAccount};

use crate::error::SwapError;
use crate::instructions::stake_pool::StakePoolProgramInterface;
use crate::{constants::*, state::*};

use jup_governance::cpi::{accounts::NewVote as JupNewVote, new_vote as jup_new_vote};
use jup_governance::program::Govern;
use jup_governance::state::{Governor, Proposal, Vote};

use anchor_lang::Ids;

#[derive(Clone)]
pub struct Jupiter;

impl anchor_lang::Id for Jupiter {
    fn id() -> Pubkey {
        pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4")
    }
}

#[derive(Accounts)]
pub struct JupiterSwap<'info> {
    #[account(mut)]
    pub state: Box<Account<'info, StateAccount>>,
    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    /// CHECK: no need to deser because we transfer_checked from
    ///        input_vault_ata to input_signer_ata
    #[account(mut)]
    pub input_vault_ata: UncheckedAccount<'info>,
    #[account(
        mut,
        associated_token::mint = input_mint,
        associated_token::authority = signer,
        associated_token::token_program = input_token_program
    )]
    pub input_signer_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// TODO: Do we really need output_signer_ata?
    /// CHECK: no need deser, trust Jupiter
    #[account(mut)]
    pub output_signer_ata: UncheckedAccount<'info>,
    #[account(
        mut,
        associated_token::mint = output_mint,
        associated_token::authority = vault,
        associated_token::token_program = output_token_program
    )]
    pub output_vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub input_mint: Box<InterfaceAccount<'info, Mint>>,
    pub output_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: manually check in handler
    pub input_stake_pool: Option<AccountInfo<'info>>,
    /// CHECK: manually check in handler
    pub output_stake_pool: Option<AccountInfo<'info>>,

    // programs
    pub system_program: Program<'info, System>,
    pub jupiter_program: Program<'info, Jupiter>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub input_token_program: Interface<'info, TokenInterface>,
    pub output_token_program: Interface<'info, TokenInterface>,
}

fn parse_route(ctx: &Context<JupiterSwap>) -> (bool, usize) {
    let mut res = true;
    res &= ctx.remaining_accounts.len() > 9;

    res &= ctx.remaining_accounts[0].key() == ctx.accounts.output_token_program.key();
    res &= ctx.remaining_accounts[1].key() == ctx.accounts.signer.key();
    res &= ctx.remaining_accounts[2].key() == ctx.accounts.input_signer_ata.key();
    res &= ctx.remaining_accounts[3].key() == ctx.accounts.output_signer_ata.key();
    res &= ctx.remaining_accounts[4].key() == Jupiter::id(); // null key - overwritten later
    res &= ctx.remaining_accounts[5].key() == ctx.accounts.output_mint.key();
    res &= ctx.remaining_accounts[6].key() == Jupiter::id(); // null key

    // res &= ctx.remaining_accounts[7].key() - eventAuthority ignored
    res &= ctx.remaining_accounts[8].key() == Jupiter::id();

    (res, 4)
}

fn parse_exact_out_route(ctx: &Context<JupiterSwap>) -> (bool, usize) {
    let mut res = true;
    res &= ctx.remaining_accounts.len() > 11;

    res &= ctx.remaining_accounts[0].key() == ctx.accounts.output_token_program.key();
    res &= ctx.remaining_accounts[1].key() == ctx.accounts.signer.key();
    res &= ctx.remaining_accounts[2].key() == ctx.accounts.input_signer_ata.key();
    res &= ctx.remaining_accounts[3].key() == ctx.accounts.output_signer_ata.key();
    res &= ctx.remaining_accounts[4].key() == Jupiter::id(); // null key - overwritten later
    res &= ctx.remaining_accounts[5].key() == ctx.accounts.input_mint.key();
    res &= ctx.remaining_accounts[6].key() == ctx.accounts.output_mint.key();
    res &= ctx.remaining_accounts[7].key() == Jupiter::id(); // null key
    res &= ctx.remaining_accounts[8].key() == ctx.accounts.input_token_program.key()
        || ctx.remaining_accounts[8].key() == ctx.accounts.output_token_program.key()
        || ctx.remaining_accounts[8].key() == Jupiter::id(); // token program or null key

    // res &= ctx.remaining_accounts[9].key() - eventAuthority ignored
    res &= ctx.remaining_accounts[10].key() == Jupiter::id();

    (res, 4)
}

fn parse_shared_accounts_route(ctx: &Context<JupiterSwap>) -> (bool, usize) {
    let mut res = true;
    res &= ctx.remaining_accounts.len() > 13;

    res &= ctx.remaining_accounts[0].key() == ctx.accounts.output_token_program.key();
    // res &= ctx.remaining_accounts[1].key() - programAuthority ignored

    res &= ctx.remaining_accounts[2].key() == ctx.accounts.signer.key();
    res &= ctx.remaining_accounts[3].key() == ctx.accounts.input_signer_ata.key();
    // res &= ctx.remaining_accounts[4].key() - programSourceTokenAccount ignored
    // res &= ctx.remaining_accounts[5].key() - programDestinationTokenAccount ignored

    res &= ctx.remaining_accounts[6].key() == ctx.accounts.output_signer_ata.key();
    res &= ctx.remaining_accounts[7].key() == ctx.accounts.input_mint.key();
    res &= ctx.remaining_accounts[8].key() == ctx.accounts.output_mint.key();
    res &= ctx.remaining_accounts[9].key() == Jupiter::id(); // null key
    res &= ctx.remaining_accounts[10].key() == ctx.accounts.input_token_program.key()
        || ctx.remaining_accounts[10].key() == ctx.accounts.output_token_program.key()
        || ctx.remaining_accounts[10].key() == Jupiter::id(); // token program or null key

    // res &= ctx.remaining_accounts[11].key() - eventAuthority ignored
    res &= ctx.remaining_accounts[12].key() == Jupiter::id();

    (res, 6)
}

fn is_lst<'info>(mint: &Pubkey, stake_pool_account: Option<&AccountInfo<'info>>) -> Result<bool> {
    // Check if the mint is MSOL
    if mint == &MSOL {
        return Ok(true);
    }

    // Return false if no stake pool account is provided
    let stake_pool_account = match stake_pool_account {
        Some(account) => account,
        None => return Ok(false),
    };

    // Check if the stake pool account owner is valid
    if !StakePoolProgramInterface::ids().contains(stake_pool_account.owner) {
        return Ok(false);
    }

    // Validate pool mint matches the provided mint
    let buf = stake_pool_account.try_borrow_data()?;
    let pool_mint_bytes = &buf[POOL_MINT_OFFSET..POOL_MINT_OFFSET + 32];
    let pool_mint =
        Pubkey::try_from(pool_mint_bytes).map_err(|_| SwapError::InvalidAssetForSwap)?;
    require_keys_eq!(pool_mint, *mint, SwapError::InvalidAssetForSwap);

    Ok(true)
}

#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::JupiterSwap)
)]
#[vault_signer_seeds]
pub fn swap_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, JupiterSwap<'info>>,
    amount: u64,
    data: Vec<u8>,
) -> Result<()> {
    let state = ctx.accounts.state.clone();
    let assets = ctx.accounts.state.assets_mut().unwrap();

    // Check if input and output mints are in the assets allowlist
    let input_in_assets = assets.contains(&ctx.accounts.input_mint.key());
    let output_in_assets = assets.contains(&ctx.accounts.output_mint.key());

    let input_is_lst = is_lst(
        &ctx.accounts.input_mint.key(),
        ctx.accounts.input_stake_pool.as_ref(),
    )?;
    let output_is_lst = is_lst(
        &ctx.accounts.output_mint.key(),
        ctx.accounts.output_stake_pool.as_ref(),
    )?;

    // Build the list of accepted permissions and check access
    let mut accepted_permissions = vec![Permission::JupiterSwapAny];
    if input_in_assets && output_in_assets {
        accepted_permissions.push(Permission::JupiterSwapAllowlisted);
    }
    if input_is_lst && (output_is_lst || output_in_assets)
        || output_is_lst && (input_is_lst || input_in_assets)
    {
        accepted_permissions.push(Permission::JupiterSwapLst);
    }
    acl::check_access_any(&state, &ctx.accounts.signer.key, accepted_permissions)?;

    // TODO: should we add missing assets to the list after permission check?
    // This will gradually expand the assets allowlist and auto escalate JupiterSwapAllowlisted privilege over time
    if !input_in_assets {
        assets.push(ctx.accounts.input_mint.key());
    }
    if !output_in_assets {
        assets.push(ctx.accounts.output_mint.key());
    }

    // Parse Jupiter Swap accounts
    let ix_disc = u64::from_be_bytes(data[..8].try_into().unwrap());
    let (parse_result, dst_ata_idx) = match ix_disc {
        0xe517cb977ae3ad2a => parse_route(&ctx),           // route
        0xd033ef977b2bed5c => parse_exact_out_route(&ctx), // exactOutRoute
        0xc1209b3341d69c81 => parse_shared_accounts_route(&ctx), // sharedAccountsRoute
        0xb0d169a89a7d453e => parse_shared_accounts_route(&ctx), // sharedAccountsExactOutRoute (same)
        _ => panic!("Jupiter instruction not supported"),
    };
    require!(parse_result, SwapError::InvalidSwap);

    //
    // Transfer vault -> signer
    //
    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.input_token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.input_vault_ata.to_account_info(),
                mint: ctx.accounts.input_mint.to_account_info(),
                to: ctx.accounts.input_signer_ata.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            vault_signer_seeds,
        ),
        amount,
        ctx.accounts.input_mint.decimals,
    )?;

    //
    // Jupiter swap
    //

    // Map remaining_accounts -> AccountMeta
    let mut accounts: Vec<AccountMeta> = ctx
        .remaining_accounts
        .iter()
        .map(|acc| AccountMeta {
            pubkey: *acc.key,
            is_signer: acc.is_signer,
            is_writable: acc.is_writable,
        })
        .collect();

    // Override destinationTokenAccount
    accounts[dst_ata_idx] = AccountMeta {
        pubkey: ctx.accounts.output_vault_ata.key(),
        is_signer: false,
        is_writable: true,
    };

    // Include output_vault_ata in accounts_infos (add it to remaining_accounts)
    let accounts_infos = &[
        ctx.remaining_accounts,
        &[ctx.accounts.output_vault_ata.to_account_info()],
    ]
    .concat();

    // Swap
    let _ = invoke_signed(
        &Instruction {
            program_id: Jupiter::id(),
            accounts,
            data,
        },
        accounts_infos,
        &[],
    );

    Ok(())
}

#[derive(Accounts)]
pub struct InitLockedVoterEscrow<'info> {
    #[account()]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub locker: Box<Account<'info, Locker>>,

    /// CHECK: to be initialized
    #[account(mut)]
    pub escrow: AccountInfo<'info>,

    pub locked_voter_program: Program<'info, LockedVoter>,
    pub system_program: Program<'info, System>,
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::StakeJup)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::JupiterVote)
)]
#[vault_signer_seeds]
pub fn init_locked_voter_escrow_handler<'info>(ctx: Context<InitLockedVoterEscrow>) -> Result<()> {
    new_escrow(CpiContext::new_with_signer(
        ctx.accounts.locked_voter_program.to_account_info(),
        NewEscrow {
            locker: ctx.accounts.locker.to_account_info(),
            escrow: ctx.accounts.escrow.to_account_info(),
            escrow_owner: ctx.accounts.vault.to_account_info(),
            payer: ctx.accounts.vault.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        },
        vault_signer_seeds,
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct ToogleMaxLock<'info> {
    #[account()]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub locker: Box<Account<'info, Locker>>,

    #[account(mut, constraint = escrow.owner == vault.key())]
    pub escrow: Box<Account<'info, Escrow>>,

    pub locked_voter_program: Program<'info, LockedVoter>,
    pub token_program: Program<'info, Token>,
}

#[access_control(
    acl::check_access_any(
        &ctx.accounts.state,
        &ctx.accounts.signer.key,
        vec![Permission::StakeJup, Permission::UnstakeJup])
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::JupiterVote)
)]
#[vault_signer_seeds]
pub fn toggle_max_lock_handler<'info>(ctx: Context<ToogleMaxLock>, value: bool) -> Result<()> {
    jup_toggle_max_lock(
        CpiContext::new_with_signer(
            ctx.accounts.locked_voter_program.to_account_info(),
            JupToggleMaxLock {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                escrow_owner: ctx.accounts.vault.to_account_info(),
            },
            vault_signer_seeds,
        ),
        value,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct IncreaseLockedAmount<'info> {
    #[account()]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub locker: Box<Account<'info, Locker>>,

    #[account(mut)]
    pub escrow_jup_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub vault_jup_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut, constraint = escrow.owner == vault.key())]
    pub escrow: Box<Account<'info, Escrow>>,

    pub locked_voter_program: Program<'info, LockedVoter>,
    pub token_program: Program<'info, Token>,
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::StakeJup)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::JupiterVote)
)]
#[vault_signer_seeds]
pub fn increase_locked_amount_handler<'info>(
    ctx: Context<IncreaseLockedAmount>,
    amount: u64,
) -> Result<()> {
    stake_jup(
        CpiContext::new_with_signer(
            ctx.accounts.locked_voter_program.to_account_info(),
            StakeJup {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                escrow_tokens: ctx.accounts.escrow_jup_ata.to_account_info(),
                payer: ctx.accounts.vault.to_account_info(),
                source_tokens: ctx.accounts.vault_jup_ata.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            vault_signer_seeds,
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct PartialUnstaking<'info> {
    #[account()]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: to be initialized
    #[account(mut)]
    pub partial_unstake: AccountInfo<'info>,

    #[account(mut)]
    pub locker: Box<Account<'info, Locker>>,

    #[account(mut)]
    pub escrow: Box<Account<'info, Escrow>>,

    pub locked_voter_program: Program<'info, LockedVoter>,
    pub system_program: Program<'info, System>,
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::UnstakeJup)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::JupiterVote)
)]
#[vault_signer_seeds]
pub fn open_partial_unstaking_handler<'info>(
    ctx: Context<PartialUnstaking>,
    amount: u64,
    memo: String,
) -> Result<()> {
    jup_open_partial_unstaking(
        CpiContext::new_with_signer(
            ctx.accounts.locked_voter_program.to_account_info(),
            OpenPartialUnstaking {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                partial_unstake: ctx.accounts.partial_unstake.to_account_info(),
                owner: ctx.accounts.vault.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            vault_signer_seeds,
        ),
        amount,
        memo,
    )?;
    Ok(())
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::UnstakeJup)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::JupiterVote)
)]
#[vault_signer_seeds]
pub fn merge_partial_unstaking_handler<'info>(ctx: Context<PartialUnstaking>) -> Result<()> {
    jup_merge_partial_unstaking(CpiContext::new_with_signer(
        ctx.accounts.locked_voter_program.to_account_info(),
        MergePartialUnstaking {
            locker: ctx.accounts.locker.to_account_info(),
            escrow: ctx.accounts.escrow.to_account_info(),
            partial_unstake: ctx.accounts.partial_unstake.to_account_info(),
            owner: ctx.accounts.vault.to_account_info(),
        },
        vault_signer_seeds,
    ))?;
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawAllStakedJup<'info> {
    #[account()]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub locker: Box<Account<'info, Locker>>,

    #[account(mut)]
    pub escrow: Box<Account<'info, Escrow>>,

    #[account(mut)]
    pub escrow_jup_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub vault_jup_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub locked_voter_program: Program<'info, LockedVoter>,
    pub token_program: Program<'info, Token>,
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::UnstakeJup)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::JupiterVote)
)]
#[vault_signer_seeds]
pub fn withdraw_all_staked_jup_handler<'info>(ctx: Context<WithdrawAllStakedJup>) -> Result<()> {
    withdraw(CpiContext::new_with_signer(
        ctx.accounts.locked_voter_program.to_account_info(),
        Withdraw {
            locker: ctx.accounts.locker.to_account_info(),
            escrow: ctx.accounts.escrow.to_account_info(),
            escrow_owner: ctx.accounts.vault.to_account_info(),
            escrow_tokens: ctx.accounts.escrow_jup_ata.to_account_info(),
            destination_tokens: ctx.accounts.vault_jup_ata.to_account_info(),
            payer: ctx.accounts.vault.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        },
        vault_signer_seeds,
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawPartialUnstaking<'info> {
    #[account()]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub partial_unstake: Box<Account<'info, PartialUnstakeAccount>>,

    #[account(mut)]
    pub locker: Box<Account<'info, Locker>>,

    #[account(mut)]
    pub escrow: Box<Account<'info, Escrow>>,

    #[account(mut)]
    pub escrow_jup_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub vault_jup_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub locked_voter_program: Program<'info, LockedVoter>,
    pub token_program: Program<'info, Token>,
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::UnstakeJup)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::JupiterVote)
)]
#[vault_signer_seeds]
pub fn withdraw_partial_unstaking_handler<'info>(
    ctx: Context<WithdrawPartialUnstaking>,
) -> Result<()> {
    jup_partial_withdraw(CpiContext::new_with_signer(
        ctx.accounts.locked_voter_program.to_account_info(),
        JupWithdrawPartialUnstaking {
            locker: ctx.accounts.locker.to_account_info(),
            escrow: ctx.accounts.escrow.to_account_info(),
            owner: ctx.accounts.vault.to_account_info(),
            partial_unstake: ctx.accounts.partial_unstake.to_account_info(),
            escrow_tokens: ctx.accounts.escrow_jup_ata.to_account_info(),
            destination_tokens: ctx.accounts.vault_jup_ata.to_account_info(),
            payer: ctx.accounts.vault.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        },
        vault_signer_seeds,
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct NewVote<'info> {
    #[account()]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub proposal: Box<Account<'info, Proposal>>,

    /// CHECK: to be initialized
    #[account(mut)]
    pub vote: AccountInfo<'info>,

    pub governance_program: Program<'info, Govern>,
    pub system_program: Program<'info, System>,
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::VoteOnProposal)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::JupiterVote)
)]
#[vault_signer_seeds]
pub fn new_vote_handler<'info>(ctx: Context<NewVote>) -> Result<()> {
    jup_new_vote(
        CpiContext::new_with_signer(
            ctx.accounts.governance_program.to_account_info(),
            JupNewVote {
                proposal: ctx.accounts.proposal.to_account_info(),
                vote: ctx.accounts.vote.to_account_info(),
                payer: ctx.accounts.vault.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            vault_signer_seeds,
        ),
        ctx.accounts.vault.key(), // voter
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    #[account()]
    pub locker: Box<Account<'info, Locker>>,

    #[account()]
    pub escrow: Box<Account<'info, Escrow>>,

    #[account(mut)]
    pub proposal: Box<Account<'info, Proposal>>,

    #[account(mut)]
    pub vote: Box<Account<'info, Vote>>,

    #[account()]
    pub governor: Box<Account<'info, Governor>>,

    pub locked_voter_program: Program<'info, LockedVoter>,
    pub governance_program: Program<'info, Govern>,
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::VoteOnProposal)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::JupiterVote)
)]
#[vault_signer_seeds]
pub fn cast_vote_handler<'info>(ctx: Context<CastVote>, side: u8) -> Result<()> {
    jup_cast_vote(
        CpiContext::new_with_signer(
            ctx.accounts.locked_voter_program.to_account_info(),
            JupCastVote {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                vote_delegate: ctx.accounts.vault.to_account_info(),
                proposal: ctx.accounts.proposal.to_account_info(),
                vote: ctx.accounts.vote.to_account_info(),
                governor: ctx.accounts.governor.to_account_info(),
                govern_program: ctx.accounts.governance_program.to_account_info(),
            },
            vault_signer_seeds,
        ),
        side,
    )?;
    Ok(())
}
