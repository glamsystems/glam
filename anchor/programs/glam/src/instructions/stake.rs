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

#[derive(Accounts)]
pub struct MergeStakeAccounts<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(mut)]
    pub to_stake: Account<'info, StakeAccount>,

    #[account(mut)]
    pub from_stake: Account<'info, StakeAccount>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_history: Sysvar<'info, StakeHistory>,

    pub stake_program: Program<'info, Stake>,
    pub system_program: Program<'info, System>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::Stake)
)]
pub fn merge_stake_accounts<'c: 'info, 'info>(ctx: Context<MergeStakeAccounts>) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let treasury_seeds = &[
        b"treasury".as_ref(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&treasury_seeds[..]];

    let ix = solana_program::stake::instruction::merge(
        &ctx.accounts.to_stake.key(),
        &ctx.accounts.from_stake.key(),
        ctx.accounts.treasury.key,
    );
    let account_infos = &[
        ctx.accounts.to_stake.to_account_info(),
        ctx.accounts.from_stake.to_account_info(),
        ctx.accounts.treasury.to_account_info(),
        ctx.accounts.clock.to_account_info(),
        ctx.accounts.stake_history.to_account_info(),
    ];
    let _ = solana_program::program::invoke_signed(&ix[0], account_infos, signer_seeds);

    Ok(())
}

#[derive(Accounts)]
pub struct SplitStakeAccount<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(mut)]
    pub existing_stake: Account<'info, StakeAccount>,

    /// CHECK: will be initialized in the instruction
    #[account(mut)]
    pub new_stake: UncheckedAccount<'info>,

    pub clock: Sysvar<'info, Clock>,

    pub stake_program: Program<'info, Stake>,
    pub system_program: Program<'info, System>,
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::Stake)
)]
pub fn split_stake_account<'c: 'info, 'info>(
    ctx: Context<SplitStakeAccount>,
    lamports: u64,
    new_stake_account_id: String,
    new_stake_account_bump: u8,
) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let stake_account_seeds = &[
        b"stake_account".as_ref(),
        new_stake_account_id.as_bytes(),
        fund_key.as_ref(),
        &[new_stake_account_bump],
    ];

    let instructions = solana_program::stake::instruction::split(
        &ctx.accounts.existing_stake.key(),
        &ctx.accounts.treasury.key(),
        lamports,
        ctx.accounts.new_stake.key,
    );

    // allocate
    solana_program::program::invoke_signed(
        &instructions[0],
        &[
            ctx.accounts.new_stake.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[&stake_account_seeds[..]],
    )?;

    // assign
    solana_program::program::invoke_signed(
        &instructions[1],
        &[
            ctx.accounts.new_stake.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
        &[&stake_account_seeds[..]],
    )?;

    // split
    let treasury_seeds = &[
        b"treasury".as_ref(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    solana_program::program::invoke_signed(
        &instructions[2],
        &[
            ctx.accounts.existing_stake.to_account_info(),
            ctx.accounts.new_stake.to_account_info(),
            ctx.accounts.treasury.to_account_info(),
            ctx.accounts.clock.to_account_info(),
        ],
        &[&treasury_seeds[..]],
    )?;

    Ok(())
}
