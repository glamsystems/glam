use crate::state::*;
use anchor_lang::{prelude::*, system_program};
use anchor_spl::stake::{
    deactivate_stake, withdraw, DeactivateStake, Stake, StakeAccount, Withdraw,
};

#[derive(Accounts)]
pub struct InitializeAndDelegateStake<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    /// CHECK: will be initialized in the instruction
    #[account(mut)]
    pub treasury_stake_account: AccountInfo<'info>,

    /// CHECK: skip
    pub vote: AccountInfo<'info>,

    /// CHECK: skip
    pub stake_config: AccountInfo<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,
    pub stake_history: Sysvar<'info, StakeHistory>,

    pub stake_program: Program<'info, Stake>,
    pub system_program: Program<'info, System>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::Stake)
)]
pub fn initialize_and_delegate_stake<'c: 'info, 'info>(
    ctx: Context<InitializeAndDelegateStake>,
    lamports: u64,
    stake_account_id: String,
    stake_account_bump: u8,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let stake_account_seeds = &[
        b"stake_account".as_ref(),
        stake_account_id.as_bytes(),
        fund_key.as_ref(),
        &[stake_account_bump],
    ];
    let treasury_seeds = &[
        b"treasury".as_ref(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&stake_account_seeds[..], &treasury_seeds[..]];

    // Create the stake account
    system_program::create_account(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::CreateAccount {
                from: ctx.accounts.treasury.to_account_info(),
                to: ctx
                    .accounts
                    .treasury_stake_account
                    .to_account_info()
                    .clone(),
            },
            signer_seeds,
        ),
        lamports,
        std::mem::size_of::<StakeAccount>() as u64, // no +8
        &ctx.accounts.stake_program.key(),
    )?;

    // Initialize the stake account
    let init_stake_ix = solana_program::stake::instruction::initialize(
        ctx.accounts.treasury_stake_account.key,
        &solana_program::stake::state::Authorized {
            staker: *ctx.accounts.treasury.key,
            withdrawer: *ctx.accounts.treasury.key,
        },
        &solana_program::stake::state::Lockup {
            unix_timestamp: 0,
            epoch: 0,
            custodian: Pubkey::default(),
        },
    );
    solana_program::program::invoke_signed(
        &init_stake_ix,
        &[
            ctx.accounts.treasury_stake_account.clone(),
            ctx.accounts.rent.to_account_info(),
        ],
        signer_seeds,
    )?;

    // Delegate the stake account
    let delegate_stake_ix = solana_program::stake::instruction::delegate_stake(
        ctx.accounts.treasury_stake_account.key,
        ctx.accounts.treasury.key,
        ctx.accounts.vote.key,
    );
    solana_program::program::invoke_signed(
        &delegate_stake_ix,
        &[
            ctx.accounts.treasury_stake_account.clone(),
            ctx.accounts.vote.clone(),
            ctx.accounts.clock.to_account_info(),
            ctx.accounts.stake_history.to_account_info(),
            ctx.accounts.stake_config.clone(),
            ctx.accounts.treasury.to_account_info(),
        ],
        &[&treasury_seeds[..]],
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct DeactivateStakeAccounts<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_program: Program<'info, Stake>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::Unstake)
)]
pub fn deactivate_stake_accounts<'info>(
    ctx: Context<'_, '_, '_, 'info, DeactivateStakeAccounts<'info>>,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        b"treasury".as_ref(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    ctx.remaining_accounts.iter().for_each(|stake_account| {
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.stake_program.to_account_info(),
            DeactivateStake {
                stake: stake_account.clone(),
                staker: ctx.accounts.treasury.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
            },
            signer_seeds,
        );
        let _ = deactivate_stake(cpi_ctx);
    });
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawFromStakeAccounts<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_history: Sysvar<'info, StakeHistory>,
    pub stake_program: Program<'info, Stake>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::Unstake)
)]
pub fn withdraw_from_stake_accounts<'info>(
    ctx: Context<'_, '_, '_, 'info, WithdrawFromStakeAccounts<'info>>,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        b"treasury".as_ref(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    ctx.remaining_accounts.iter().for_each(|stake_account| {
        let lamports = stake_account.get_lamports();
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.stake_program.to_account_info(),
            Withdraw {
                stake: stake_account.clone(),
                withdrawer: ctx.accounts.treasury.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
                stake_history: ctx.accounts.stake_history.to_account_info(),
            },
            signer_seeds,
        );

        let _ = withdraw(cpi_ctx, lamports, None);
    });

    Ok(())
}
