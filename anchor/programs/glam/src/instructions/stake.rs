use crate::{constants::*, state::*};
use anchor_lang::{prelude::*, system_program};
use anchor_spl::stake::{
    deactivate_stake, withdraw, DeactivateStake, Stake, StakeAccount, Withdraw,
};

#[derive(Accounts)]
pub struct InitializeAndDelegateStake<'info> {
    #[account(mut)]
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

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
    acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::Stake)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::NativeStaking)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn initialize_and_delegate_stake_handler<'c: 'info, 'info>(
    ctx: Context<InitializeAndDelegateStake>,
    lamports: u64,
) -> Result<()> {
    // Fund the stake account with lamports from the vault
    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.glam_vault.to_account_info(),
                to: ctx.accounts.vault_stake_account.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        lamports,
    )?;

    // Initialize the stake account
    let init_stake_ix = solana_program::stake::instruction::initialize(
        ctx.accounts.vault_stake_account.key,
        &solana_program::stake::state::Authorized {
            staker: *ctx.accounts.glam_vault.key,
            withdrawer: *ctx.accounts.glam_vault.key,
        },
        &solana_program::stake::state::Lockup {
            unix_timestamp: 0,
            epoch: 0,
            custodian: Pubkey::default(),
        },
    );
    solana_program::program::invoke(
        &init_stake_ix,
        &[
            ctx.accounts.vault_stake_account.clone(),
            ctx.accounts.rent.to_account_info(),
        ],
    )?;

    // Delegate the stake account
    let delegate_stake_ix = solana_program::stake::instruction::delegate_stake(
        ctx.accounts.vault_stake_account.key,
        ctx.accounts.glam_vault.key,
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
            ctx.accounts.glam_vault.to_account_info(),
        ],
        glam_vault_signer_seeds,
    )?;

    // Add the stake account to the state params
    let state = &mut ctx.accounts.glam_state;
    state.add_to_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.vault_stake_account.key(),
    );

    Ok(())
}

#[derive(Accounts)]
pub struct DeactivateStakeAccounts<'info> {
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

    /// CHECK: checked by stake program
    pub stake: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub stake_program: Program<'info, Stake>,
}

#[access_control(
    acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::Unstake)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::NativeStaking)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn deactivate_stake_accounts_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, DeactivateStakeAccounts<'info>>,
) -> Result<()> {
    // Deactivate the stake account
    deactivate_stake(CpiContext::new_with_signer(
        ctx.accounts.stake_program.to_account_info(),
        DeactivateStake {
            stake: ctx.accounts.stake.clone(),
            staker: ctx.accounts.glam_vault.to_account_info(),
            clock: ctx.accounts.clock.to_account_info(),
        },
        glam_vault_signer_seeds,
    ))?;

    // Deactivate the remaining stake accounts
    ctx.remaining_accounts.iter().for_each(|stake_account| {
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.stake_program.to_account_info(),
            DeactivateStake {
                stake: stake_account.clone(),
                staker: ctx.accounts.glam_vault.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
            },
            glam_vault_signer_seeds,
        );
        let _ = deactivate_stake(cpi_ctx);
    });
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawFromStakeAccounts<'info> {
    #[account(mut)]
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

    /// CHECK: checked by stake program
    pub stake: AccountInfo<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub stake_history: Sysvar<'info, StakeHistory>,
    pub stake_program: Program<'info, Stake>,
}

#[access_control(
    acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::Unstake)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::NativeStaking)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn withdraw_from_stake_accounts_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, WithdrawFromStakeAccounts<'info>>,
) -> Result<()> {
    let state = &mut ctx.accounts.glam_state;

    // Withdraw from the stake account
    let lamports = ctx.accounts.stake.get_lamports();
    withdraw(
        CpiContext::new_with_signer(
            ctx.accounts.stake_program.to_account_info(),
            Withdraw {
                stake: ctx.accounts.stake.clone(),
                withdrawer: ctx.accounts.glam_vault.to_account_info(),
                to: ctx.accounts.glam_vault.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
                stake_history: ctx.accounts.stake_history.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        lamports,
        None,
    )?;
    state.delete_from_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.stake.key(),
    );

    // Withdraw from the remaining stake accounts
    ctx.remaining_accounts.iter().for_each(|stake_account| {
        let lamports = stake_account.get_lamports();
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.stake_program.to_account_info(),
            Withdraw {
                stake: stake_account.clone(),
                withdrawer: ctx.accounts.glam_vault.to_account_info(),
                to: ctx.accounts.glam_vault.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
                stake_history: ctx.accounts.stake_history.to_account_info(),
            },
            glam_vault_signer_seeds,
        );
        let _ = withdraw(cpi_ctx, lamports, None);
        state.delete_from_engine_field(EngineFieldName::ExternalVaultAccounts, stake_account.key());
    });

    Ok(())
}

#[derive(Accounts)]
pub struct MergeStakeAccounts<'info> {
    #[account(mut)]
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

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
    acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::Stake)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::NativeStaking)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn merge_stake_accounts_handler<'c: 'info, 'info>(
    ctx: Context<MergeStakeAccounts>,
) -> Result<()> {
    let ix = solana_program::stake::instruction::merge(
        &ctx.accounts.to_stake.key(),
        &ctx.accounts.from_stake.key(),
        ctx.accounts.glam_vault.key,
    );
    let account_infos = &[
        ctx.accounts.to_stake.to_account_info(),
        ctx.accounts.from_stake.to_account_info(),
        ctx.accounts.glam_vault.to_account_info(),
        ctx.accounts.clock.to_account_info(),
        ctx.accounts.stake_history.to_account_info(),
    ];
    solana_program::program::invoke_signed(&ix[0], account_infos, glam_vault_signer_seeds)?;

    // Remove the from_stake account from the state params
    let state = &mut ctx.accounts.glam_state;
    state.delete_from_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.from_stake.key(),
    );

    Ok(())
}

#[derive(Accounts)]
pub struct SplitStakeAccount<'info> {
    #[account(mut)]
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

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
    acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::Unstake)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::NativeStaking)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn split_stake_account_handler<'c: 'info, 'info>(
    ctx: Context<SplitStakeAccount>,
    lamports: u64,
) -> Result<()> {
    let instructions = solana_program::stake::instruction::split(
        &ctx.accounts.existing_stake.key(),
        &ctx.accounts.glam_vault.key(),
        lamports,
        ctx.accounts.new_stake.key,
    );

    // Client side should handle the creation of an empty new stake
    // account (e.g., as a pre-instruction of this instruction).
    // We ignore instructions #0 and #1 - only need to call call stake_program's
    // split instruction at index #2
    solana_program::program::invoke_signed(
        &instructions[2],
        &[
            ctx.accounts.existing_stake.to_account_info(),
            ctx.accounts.new_stake.to_account_info(),
            ctx.accounts.glam_vault.to_account_info(),
            ctx.accounts.clock.to_account_info(),
        ],
        glam_vault_signer_seeds,
    )?;

    // Add the new stake account to the state params
    let state = &mut ctx.accounts.glam_state;
    state.add_to_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.new_stake.key(),
    );

    Ok(())
}

#[derive(Accounts)]
pub struct RedelegateStake<'info> {
    #[account(mut)]
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

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
    acl::check_access(&ctx.accounts.glam_state, &ctx.accounts.glam_signer.key, Permission::Stake)
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::NativeStaking)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn redelegate_stake_handler<'c: 'info, 'info>(ctx: Context<RedelegateStake>) -> Result<()> {
    let instructions = solana_program::stake::instruction::redelegate(
        &ctx.accounts.existing_stake.key(),
        ctx.accounts.glam_vault.key,
        ctx.accounts.vote.key,
        ctx.accounts.new_stake.key,
    );

    // Client side should handle the creation of an empty new stake
    // account (e.g., as a pre-instruction of this instruction).
    // We ignore instructions #0 and #1 - only need to call call stake_program's
    // redelegate instruction at index #2
    solana_program::program::invoke_signed(
        &instructions[2],
        &[
            ctx.accounts.existing_stake.to_account_info(),
            ctx.accounts.new_stake.to_account_info(),
            ctx.accounts.glam_vault.to_account_info(),
            ctx.accounts.stake_config.clone(),
            ctx.accounts.vote.clone(),
            ctx.accounts.clock.to_account_info(),
        ],
        glam_vault_signer_seeds,
    )?;

    // Remove existing stake account from the state params and add the new one
    let state = &mut ctx.accounts.glam_state;
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
