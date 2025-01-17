use crate::{constants::*, state::*};
use anchor_lang::{prelude::*, system_program};
use anchor_spl::stake::{
    deactivate_stake, withdraw, DeactivateStake, Stake, StakeAccount, Withdraw,
};
use glam_macros::vault_signer_seeds;

#[derive(Accounts)]
pub struct InitializeAndDelegateStake<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    /// CHECK: will be initialized in the instruction
    #[account(mut)]
    pub vault_stake_account: AccountInfo<'info>,

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
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::Stake)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::NativeStaking)
)]
#[vault_signer_seeds]
pub fn initialize_and_delegate_stake_handler<'c: 'info, 'info>(
    ctx: Context<InitializeAndDelegateStake>,
    lamports: u64,
    stake_account_id: String,
    stake_account_bump: u8,
) -> Result<()> {
    let state_key = ctx.accounts.state.key();
    let stake_account_seeds = &[
        b"stake_account".as_ref(),
        stake_account_id.as_bytes(),
        state_key.as_ref(),
        &[stake_account_bump],
    ];
    let signer_seeds = &[&stake_account_seeds[..], (*vault_signer_seeds)[0]];

    // Create the stake account
    system_program::create_account(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::CreateAccount {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.vault_stake_account.to_account_info().clone(),
            },
            signer_seeds,
        ),
        lamports,
        std::mem::size_of::<StakeAccount>() as u64, // no +8
        &ctx.accounts.stake_program.key(),
    )?;

    // Initialize the stake account
    let init_stake_ix = solana_program::stake::instruction::initialize(
        ctx.accounts.vault_stake_account.key,
        &solana_program::stake::state::Authorized {
            staker: *ctx.accounts.vault.key,
            withdrawer: *ctx.accounts.vault.key,
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
            ctx.accounts.vault_stake_account.clone(),
            ctx.accounts.rent.to_account_info(),
        ],
        signer_seeds,
    )?;

    // Delegate the stake account
    let delegate_stake_ix = solana_program::stake::instruction::delegate_stake(
        ctx.accounts.vault_stake_account.key,
        ctx.accounts.vault.key,
        ctx.accounts.vote.key,
    );
    solana_program::program::invoke_signed(
        &delegate_stake_ix,
        &[
            ctx.accounts.vault_stake_account.clone(),
            ctx.accounts.vote.clone(),
            ctx.accounts.clock.to_account_info(),
            ctx.accounts.stake_history.to_account_info(),
            ctx.accounts.stake_config.clone(),
            ctx.accounts.vault.to_account_info(),
        ],
        vault_signer_seeds,
    )?;

    // Add the stake account to the state params
    let state = &mut ctx.accounts.state;
    state.add_to_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.vault_stake_account.key(),
    );

    Ok(())
}

#[derive(Accounts)]
pub struct DeactivateStakeAccounts<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_program: Program<'info, Stake>,
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::Unstake)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::NativeStaking)
)]
#[vault_signer_seeds]
pub fn deactivate_stake_accounts_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, DeactivateStakeAccounts<'info>>,
) -> Result<()> {
    ctx.remaining_accounts.iter().for_each(|stake_account| {
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.stake_program.to_account_info(),
            DeactivateStake {
                stake: stake_account.clone(),
                staker: ctx.accounts.vault.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
            },
            vault_signer_seeds,
        );
        let _ = deactivate_stake(cpi_ctx);
    });
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawFromStakeAccounts<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    pub clock: Sysvar<'info, Clock>,
    pub stake_history: Sysvar<'info, StakeHistory>,
    pub stake_program: Program<'info, Stake>,
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::Unstake)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::NativeStaking)
)]
#[vault_signer_seeds]
pub fn withdraw_from_stake_accounts_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, WithdrawFromStakeAccounts<'info>>,
) -> Result<()> {
    let state = &mut ctx.accounts.state;
    ctx.remaining_accounts.iter().for_each(|stake_account| {
        let lamports = stake_account.get_lamports();
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.stake_program.to_account_info(),
            Withdraw {
                stake: stake_account.clone(),
                withdrawer: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
                stake_history: ctx.accounts.stake_history.to_account_info(),
            },
            vault_signer_seeds,
        );

        let _ = withdraw(cpi_ctx, lamports, None);

        state.delete_from_engine_field(EngineFieldName::ExternalVaultAccounts, stake_account.key());
    });

    Ok(())
}

#[derive(Accounts)]
pub struct MergeStakeAccounts<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

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
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::Stake)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::NativeStaking)
)]
#[vault_signer_seeds]
pub fn merge_stake_accounts_handler<'c: 'info, 'info>(
    ctx: Context<MergeStakeAccounts>,
) -> Result<()> {
    let ix = solana_program::stake::instruction::merge(
        &ctx.accounts.to_stake.key(),
        &ctx.accounts.from_stake.key(),
        ctx.accounts.vault.key,
    );
    let account_infos = &[
        ctx.accounts.to_stake.to_account_info(),
        ctx.accounts.from_stake.to_account_info(),
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.clock.to_account_info(),
        ctx.accounts.stake_history.to_account_info(),
    ];
    solana_program::program::invoke_signed(&ix[0], account_infos, vault_signer_seeds)?;

    // Remove the from_stake account from the state params
    let state = &mut ctx.accounts.state;
    state.delete_from_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.from_stake.key(),
    );

    Ok(())
}

#[derive(Accounts)]
pub struct SplitStakeAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

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
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::Unstake)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::NativeStaking)
)]
#[vault_signer_seeds]
pub fn split_stake_account_handler<'c: 'info, 'info>(
    ctx: Context<SplitStakeAccount>,
    lamports: u64,
    new_stake_account_id: String,
    new_stake_account_bump: u8,
) -> Result<()> {
    let state_key = ctx.accounts.state.key();
    let stake_account_seeds = &[
        b"stake_account".as_ref(),
        new_stake_account_id.as_bytes(),
        state_key.as_ref(),
        &[new_stake_account_bump],
    ];

    let instructions = solana_program::stake::instruction::split(
        &ctx.accounts.existing_stake.key(),
        &ctx.accounts.vault.key(),
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

    solana_program::program::invoke_signed(
        &instructions[2],
        &[
            ctx.accounts.existing_stake.to_account_info(),
            ctx.accounts.new_stake.to_account_info(),
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.clock.to_account_info(),
        ],
        vault_signer_seeds,
    )?;

    // Add the new stake account to the state params
    let state = &mut ctx.accounts.state;
    state.add_to_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.new_stake.key(),
    );

    Ok(())
}

#[derive(Accounts)]
pub struct RedelegateStake<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    #[account(mut)]
    pub existing_stake: Account<'info, StakeAccount>,

    /// CHECK: will be initialized in the instruction
    #[account(mut)]
    pub new_stake: AccountInfo<'info>,

    /// CHECK: skip
    pub vote: AccountInfo<'info>,

    /// CHECK: skip
    pub stake_config: AccountInfo<'info>,

    pub clock: Sysvar<'info, Clock>,

    pub stake_program: Program<'info, Stake>,
    pub system_program: Program<'info, System>,
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::Stake)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.state, IntegrationName::NativeStaking)
)]
#[vault_signer_seeds]
pub fn redelegate_stake_handler<'c: 'info, 'info>(
    ctx: Context<RedelegateStake>,
    new_stake_account_id: String,
    new_stake_account_bump: u8,
) -> Result<()> {
    let state_key = ctx.accounts.state.key();

    let stake_account_seeds = &[
        b"stake_account".as_ref(),
        new_stake_account_id.as_bytes(),
        state_key.as_ref(),
        &[new_stake_account_bump],
    ];

    // 3 instructions: allocate, assign, redelegate
    let instructions = solana_program::stake::instruction::redelegate(
        &ctx.accounts.existing_stake.key(),
        ctx.accounts.vault.key,
        ctx.accounts.vote.key,
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

    // redelegate
    solana_program::program::invoke_signed(
        &instructions[2],
        &[
            ctx.accounts.existing_stake.to_account_info(),
            ctx.accounts.new_stake.to_account_info(),
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.stake_config.clone(),
            ctx.accounts.vote.clone(),
            ctx.accounts.clock.to_account_info(),
        ],
        vault_signer_seeds,
    )?;

    // Remove existing stake account from the state params and add the new one
    let state = &mut ctx.accounts.state;
    state.delete_from_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.existing_stake.key(),
    );
    state.add_to_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.new_stake.key(),
    );

    Ok(())
}
