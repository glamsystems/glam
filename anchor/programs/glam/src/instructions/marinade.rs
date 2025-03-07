use crate::state::*;
use anchor_lang::prelude::*;
use marinade::program::MarinadeFinance as Marinade;

#[derive(Accounts)]
pub struct MarinadeDeposit<'info> {
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
    pub cpi_program: Program<'info, Marinade>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub state: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub msol_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub liq_pool_sol_leg_pda: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub liq_pool_msol_leg: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub liq_pool_msol_leg_authority: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_pda: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub mint_to: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub msol_mint_authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: should be validated by target program
    pub token_program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MarinadeDepositStakeAccount<'info> {
    #[account(mut)]
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
    pub cpi_program: Program<'info, Marinade>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub state: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub validator_list: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub stake_list: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub stake_account: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub duplication_flag: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub msol_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub mint_to: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub msol_mint_authority: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub clock: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    /// CHECK: should be validated by target program
    pub token_program: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub stake_program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MarinadeLiquidUnstake<'info> {
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
    pub cpi_program: Program<'info, Marinade>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub state: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub msol_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub liq_pool_sol_leg_pda: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub liq_pool_msol_leg: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub treasury_msol_account: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub get_msol_from: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: should be validated by target program
    pub token_program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MarinadeOrderUnstake<'info> {
    #[account(mut)]
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
    pub cpi_program: Program<'info, Marinade>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub state: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub msol_mint: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub burn_msol_from: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub new_ticket_account: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub clock: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: should be validated by target program
    pub token_program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MarinadeClaim<'info> {
    #[account(mut)]
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
    pub cpi_program: Program<'info, Marinade>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub state: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub reserve_pda: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    #[account(mut)]
    pub ticket_account: AccountInfo<'info>,
    /// CHECK: should be validated by target program
    pub clock: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::Stake
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::Marinade)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn marinade_deposit(ctx: Context<MarinadeDeposit>, lamports: u64) -> Result<()> {
    marinade::cpi::deposit(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            marinade::cpi::accounts::Deposit {
                state: ctx.accounts.state.to_account_info(),
                msol_mint: ctx.accounts.msol_mint.to_account_info(),
                liq_pool_sol_leg_pda: ctx.accounts.liq_pool_sol_leg_pda.to_account_info(),
                liq_pool_msol_leg: ctx.accounts.liq_pool_msol_leg.to_account_info(),
                liq_pool_msol_leg_authority: ctx
                    .accounts
                    .liq_pool_msol_leg_authority
                    .to_account_info(),
                reserve_pda: ctx.accounts.reserve_pda.to_account_info(),
                transfer_from: ctx.accounts.glam_vault.to_account_info(),
                mint_to: ctx.accounts.mint_to.to_account_info(),
                msol_mint_authority: ctx.accounts.msol_mint_authority.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        lamports,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::Stake
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::Marinade)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn marinade_deposit_stake_account(
    ctx: Context<MarinadeDepositStakeAccount>,
    validator_index: u32,
) -> Result<()> {
    let glam_state = &mut ctx.accounts.glam_state;
    glam_state.delete_from_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.stake_account.key(),
    );

    marinade::cpi::deposit_stake_account(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            marinade::cpi::accounts::DepositStakeAccount {
                state: ctx.accounts.state.to_account_info(),
                validator_list: ctx.accounts.validator_list.to_account_info(),
                stake_list: ctx.accounts.stake_list.to_account_info(),
                stake_account: ctx.accounts.stake_account.to_account_info(),
                stake_authority: ctx.accounts.glam_vault.to_account_info(),
                duplication_flag: ctx.accounts.duplication_flag.to_account_info(),
                rent_payer: ctx.accounts.glam_vault.to_account_info(),
                msol_mint: ctx.accounts.msol_mint.to_account_info(),
                mint_to: ctx.accounts.mint_to.to_account_info(),
                msol_mint_authority: ctx.accounts.msol_mint_authority.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                stake_program: ctx.accounts.stake_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        validator_index,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::Unstake
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::Marinade)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn marinade_liquid_unstake(
    ctx: Context<MarinadeLiquidUnstake>,
    msol_amount: u64,
) -> Result<()> {
    marinade::cpi::liquid_unstake(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            marinade::cpi::accounts::LiquidUnstake {
                state: ctx.accounts.state.to_account_info(),
                msol_mint: ctx.accounts.msol_mint.to_account_info(),
                liq_pool_sol_leg_pda: ctx.accounts.liq_pool_sol_leg_pda.to_account_info(),
                liq_pool_msol_leg: ctx.accounts.liq_pool_msol_leg.to_account_info(),
                treasury_msol_account: ctx.accounts.treasury_msol_account.to_account_info(),
                get_msol_from: ctx.accounts.get_msol_from.to_account_info(),
                get_msol_from_authority: ctx.accounts.glam_vault.to_account_info(),
                transfer_sol_to: ctx.accounts.glam_vault.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        msol_amount,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::Unstake
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::Marinade)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn marinade_order_unstake(ctx: Context<MarinadeOrderUnstake>, msol_amount: u64) -> Result<()> {
    let glam_state = &mut ctx.accounts.glam_state;
    glam_state.add_to_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.new_ticket_account.key(),
    );

    marinade::cpi::order_unstake(
        CpiContext::new_with_signer(
            ctx.accounts.cpi_program.to_account_info(),
            marinade::cpi::accounts::OrderUnstake {
                state: ctx.accounts.state.to_account_info(),
                msol_mint: ctx.accounts.msol_mint.to_account_info(),
                burn_msol_from: ctx.accounts.burn_msol_from.to_account_info(),
                burn_msol_authority: ctx.accounts.glam_vault.to_account_info(),
                new_ticket_account: ctx.accounts.new_ticket_account.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            glam_vault_signer_seeds,
        ),
        msol_amount,
    )
}
#[access_control(
    acl::check_access(
        &ctx.accounts.glam_state,
        &ctx.accounts.glam_signer.key,
        Permission::Unstake
    )
)]
#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::Marinade)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn marinade_claim<'info>(ctx: Context<'_, '_, '_, 'info, MarinadeClaim<'info>>) -> Result<()> {
    let glam_state = &mut ctx.accounts.glam_state;

    // Process the main ticket account
    glam_state.delete_from_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.ticket_account.key(),
    );
    marinade::cpi::claim(CpiContext::new_with_signer(
        ctx.accounts.cpi_program.to_account_info(),
        marinade::cpi::accounts::Claim {
            state: ctx.accounts.state.to_account_info(),
            reserve_pda: ctx.accounts.reserve_pda.to_account_info(),
            ticket_account: ctx.accounts.ticket_account.to_account_info(),
            transfer_sol_to: ctx.accounts.glam_vault.to_account_info(),
            clock: ctx.accounts.clock.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        },
        glam_vault_signer_seeds,
    ))?;

    // Process any remaining ticket accounts
    ctx.remaining_accounts
        .iter()
        .try_for_each(|remaining_ticket| {
            glam_state.delete_from_engine_field(
                EngineFieldName::ExternalVaultAccounts,
                remaining_ticket.key(),
            );

            marinade::cpi::claim(CpiContext::new_with_signer(
                ctx.accounts.cpi_program.to_account_info(),
                marinade::cpi::accounts::Claim {
                    state: ctx.accounts.state.to_account_info(),
                    reserve_pda: ctx.accounts.reserve_pda.to_account_info(),
                    ticket_account: remaining_ticket.clone(),
                    transfer_sol_to: ctx.accounts.glam_vault.to_account_info(),
                    clock: ctx.accounts.clock.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                glam_vault_signer_seeds,
            ))
        })
}
