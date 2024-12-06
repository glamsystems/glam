use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::Token;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};
use glam_macros::treasury_signer_seeds;

use solana_program::{instruction::Instruction, program::invoke_signed};

use jup_locked_voter::cpi::{
    accounts::{
        CastVote as JupCastVote, IncreaseLockedAmount as StakeJup, NewEscrow, ToggleMaxLock,
    },
    cast_vote as jup_cast_vote, increase_locked_amount as stake_jup, new_escrow, toggle_max_lock,
};
use jup_locked_voter::program::LockedVoter;
use jup_locked_voter::state::{Escrow, Locker};

use jup_governance::cpi::{accounts::NewVote as JupNewVote, new_vote as jup_new_vote};
use jup_governance::program::Govern;
use jup_governance::state::{Governor, Proposal, Vote};

use crate::error::ManagerError;
use crate::state::*;

#[derive(Clone)]
pub struct Jupiter;

impl anchor_lang::Id for Jupiter {
    fn id() -> Pubkey {
        pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4")
    }
}

#[derive(Accounts)]
pub struct JupiterSwap<'info> {
    // fund can mutate: output_mint can be added to assets
    #[account(mut)]
    pub fund: Box<Account<'info, FundAccount>>,
    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    /// CHECK: no need to deser because we transfer_checked from
    ///        input_treasury_ata to input_signer_ata
    #[account(mut)]
    pub input_treasury_ata: UncheckedAccount<'info>,
    #[account(
        mut,
        associated_token::mint = input_mint,
        associated_token::authority = signer,
        associated_token::token_program = input_token_program
    )]
    pub input_signer_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// CHECK: no need deser, trust Jupiter
    #[account(mut)]
    pub output_signer_ata: UncheckedAccount<'info>,
    #[account(
        mut,
        associated_token::mint = output_mint,
        associated_token::authority = treasury,
        associated_token::token_program = output_token_program
    )]
    pub output_treasury_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub input_mint: Box<InterfaceAccount<'info, Mint>>,
    pub output_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut)]
    pub signer: Signer<'info>,

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

#[access_control(
    acl::check_access_any(
        &ctx.accounts.fund,
        &ctx.accounts.signer.key,
        vec![Permission::JupiterSwapFundAssets, Permission::JupiterSwapAnyAsset]
    )
)]
#[treasury_signer_seeds]
pub fn jupiter_swap<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, JupiterSwap<'info>>,
    amount: u64,
    data: Vec<u8>,
) -> Result<()> {
    // Check if swap is among assets that belong to the funds, or possibly new
    // assets. swap_any tells if either the input or output is not part of the fund
    let fund = ctx.accounts.fund.clone();
    let assets = ctx.accounts.fund.assets_mut().unwrap();
    let output_in_assets = assets.contains(&ctx.accounts.output_mint.key());
    let input_in_assets = assets.contains(&ctx.accounts.input_mint.key());
    let swap_any = !(output_in_assets && input_in_assets);

    // Manager is currently always allowed to swap_any
    if swap_any && fund.manager != *ctx.accounts.signer.key {
        // Delegate must have JupiterSwapAnyAsset perm
        if let Some(acls) = fund.delegate_acls() {
            // Check if the signer is allowed to swap any asset
            let can_swap_any_asset = acls.iter().any(|acl| {
                acl.pubkey == *ctx.accounts.signer.key
                    && acl.permissions.contains(&Permission::JupiterSwapAnyAsset)
            });
            require!(can_swap_any_asset, ManagerError::InvalidAssetForSwap);
        }
    }

    // Add output mint to fund assets
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
    require!(parse_result, ManagerError::InvalidSwap);

    //
    // Transfer treasury -> signer
    //
    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.input_token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.input_treasury_ata.to_account_info(),
                mint: ctx.accounts.input_mint.to_account_info(),
                to: ctx.accounts.input_signer_ata.to_account_info(),
                authority: ctx.accounts.treasury.to_account_info(),
            },
            treasury_signer_seeds,
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
        pubkey: ctx.accounts.output_treasury_ata.key(),
        is_signer: false,
        is_writable: true,
    };

    // Include output_treasury_ata in accounts_infos (add it to remaining_accounts)
    let accounts_infos = &[
        ctx.remaining_accounts,
        &[ctx.accounts.output_treasury_ata.to_account_info()],
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
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

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

/**
 * Initialize voter escrow
 * Create JUP token accountowned by the escrow
 */
#[treasury_signer_seeds]
pub fn init_locked_voter_escrow<'info>(ctx: Context<InitLockedVoterEscrow>) -> Result<()> {
    new_escrow(CpiContext::new_with_signer(
        ctx.accounts.locked_voter_program.to_account_info(),
        NewEscrow {
            locker: ctx.accounts.locker.to_account_info(),
            escrow: ctx.accounts.escrow.to_account_info(),
            escrow_owner: ctx.accounts.treasury.to_account_info(),
            payer: ctx.accounts.treasury.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        },
        treasury_signer_seeds,
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct IncreaseLockedAmount<'info> {
    #[account()]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: does the voter program check it?
    #[account(mut)]
    pub locker: AccountInfo<'info>,

    #[account(mut)]
    pub escrow_jup_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub treasury_jup_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut, constraint = escrow.owner == treasury.key())]
    pub escrow: Box<Account<'info, Escrow>>,

    pub locked_voter_program: Program<'info, LockedVoter>,
    pub token_program: Program<'info, Token>,
}

/**
 * Toggle max lock
 * Increase locked amount
 */
#[treasury_signer_seeds]
pub fn increase_locked_amount<'info>(
    ctx: Context<IncreaseLockedAmount>,
    amount: u64,
) -> Result<()> {
    toggle_max_lock(
        CpiContext::new_with_signer(
            ctx.accounts.locked_voter_program.to_account_info(),
            ToggleMaxLock {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                escrow_owner: ctx.accounts.treasury.to_account_info(),
            },
            treasury_signer_seeds,
        ),
        true,
    )?;

    stake_jup(
        CpiContext::new_with_signer(
            ctx.accounts.locked_voter_program.to_account_info(),
            StakeJup {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                escrow_tokens: ctx.accounts.escrow_jup_ata.to_account_info(),
                payer: ctx.accounts.treasury.to_account_info(),
                source_tokens: ctx.accounts.treasury_jup_ata.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            treasury_signer_seeds,
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct NewVote<'info> {
    #[account()]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

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

#[treasury_signer_seeds]
pub fn new_vote<'info>(ctx: Context<NewVote>) -> Result<()> {
    jup_new_vote(
        CpiContext::new_with_signer(
            ctx.accounts.governance_program.to_account_info(),
            JupNewVote {
                proposal: ctx.accounts.proposal.to_account_info(),
                vote: ctx.accounts.vote.to_account_info(),
                payer: ctx.accounts.treasury.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            treasury_signer_seeds,
        ),
        ctx.accounts.treasury.key(), // voter
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

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

pub fn cast_vote<'info>(ctx: Context<CastVote>, side: u8) -> Result<()> {
    jup_cast_vote(
        CpiContext::new(
            ctx.accounts.governance_program.to_account_info(),
            JupCastVote {
                locker: ctx.accounts.locker.to_account_info(),
                escrow: ctx.accounts.escrow.to_account_info(),
                vote_delegate: ctx.accounts.treasury.to_account_info(),
                proposal: ctx.accounts.proposal.to_account_info(),
                vote: ctx.accounts.vote.to_account_info(),
                governor: ctx.accounts.governor.to_account_info(),
                govern_program: ctx.accounts.governance_program.to_account_info(),
            },
        ),
        side,
    )?;
    Ok(())
}
