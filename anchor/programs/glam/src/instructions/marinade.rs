use crate::{constants::*, state::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    stake::{Stake, StakeAccount},
    token::{Mint, Token, TokenAccount},
};
use glam_macros::vault_signer_seeds;
use marinade::cpi::accounts::{Claim, Deposit, DepositStakeAccount, LiquidUnstake, OrderUnstake};
use marinade::cpi::{claim, deposit, deposit_stake_account, liquid_unstake, order_unstake};
use marinade::program::MarinadeFinance;

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::Stake)
)]
#[access_control(acl::check_integration(&ctx.accounts.state, Integration::Marinade))]
#[vault_signer_seeds]
pub fn marinade_deposit_sol_handler<'c: 'info, 'info>(
    ctx: Context<MarinadeDepositSol>,
    lamports: u64,
) -> Result<()> {
    require_gte!(ctx.accounts.vault.lamports(), lamports);

    let cpi_program = ctx.accounts.marinade_program.to_account_info();
    let cpi_accounts = Deposit {
        state: ctx.accounts.marinade_state.to_account_info(),
        msol_mint: ctx.accounts.msol_mint.to_account_info(),
        liq_pool_sol_leg_pda: ctx.accounts.liq_pool_sol_leg_pda.to_account_info(),
        liq_pool_msol_leg: ctx.accounts.liq_pool_msol_leg.to_account_info(),
        liq_pool_msol_leg_authority: ctx.accounts.liq_pool_msol_leg_authority.to_account_info(),
        reserve_pda: ctx.accounts.reserve_pda.to_account_info(),
        transfer_from: ctx.accounts.vault.to_account_info(),
        mint_to: ctx.accounts.mint_to.to_account_info(),
        msol_mint_authority: ctx.accounts.msol_mint_authority.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, vault_signer_seeds);
    let _ = deposit(cpi_ctx, lamports);
    Ok(())
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::Stake)
)]
#[access_control(acl::check_integration(&ctx.accounts.state, Integration::Marinade))]
#[vault_signer_seeds]
pub fn marinade_deposit_stake_handler<'c: 'info, 'info>(
    ctx: Context<MarinadeDepositStake>,
    validator_idx: u32,
) -> Result<()> {
    let cpi_program = ctx.accounts.marinade_program.to_account_info();
    let cpi_accounts = DepositStakeAccount {
        state: ctx.accounts.marinade_state.to_account_info(),
        validator_list: ctx.accounts.validator_list.to_account_info(),
        stake_list: ctx.accounts.stake_list.to_account_info(),
        stake_account: ctx.accounts.vault_stake_account.to_account_info(),
        stake_authority: ctx.accounts.vault.to_account_info(),
        duplication_flag: ctx.accounts.duplication_flag.to_account_info(),
        rent_payer: ctx.accounts.vault.to_account_info(),
        msol_mint: ctx.accounts.msol_mint.to_account_info(),
        mint_to: ctx.accounts.mint_to.to_account_info(),
        msol_mint_authority: ctx.accounts.msol_mint_authority.to_account_info(),
        clock: ctx.accounts.clock.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        stake_program: ctx.accounts.stake_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, vault_signer_seeds);
    let _ = deposit_stake_account(cpi_ctx, validator_idx);
    Ok(())
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::Unstake)
)]
#[access_control(acl::check_integration(&ctx.accounts.state, Integration::Marinade))]
#[vault_signer_seeds]
pub fn delayed_unstake_handler<'c: 'info, 'info>(
    ctx: Context<MarinadeDelayedUnstake>,
    msol_amount: u64,
) -> Result<()> {
    // Order unstake
    let cpi_program = ctx.accounts.marinade_program.to_account_info();
    let cpi_accounts = OrderUnstake {
        state: ctx.accounts.marinade_state.to_account_info(),
        msol_mint: ctx.accounts.msol_mint.to_account_info(),
        burn_msol_from: ctx.accounts.burn_msol_from.to_account_info(),
        burn_msol_authority: ctx.accounts.vault.to_account_info(),
        new_ticket_account: ctx.accounts.ticket.to_account_info(),
        clock: ctx.accounts.clock.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, vault_signer_seeds);
    let _ = order_unstake(cpi_ctx, msol_amount);

    // Add new ticket account to the state param
    let state = &mut ctx.accounts.state;
    state.add_to_engine_field(
        EngineFieldName::ExternalVaultAccounts,
        ctx.accounts.ticket.key(),
    );

    Ok(())
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::Unstake)
)]
#[access_control(acl::check_integration(&ctx.accounts.state, Integration::Marinade))]
#[vault_signer_seeds]
pub fn claim_tickets_handler<'info>(
    ctx: Context<'_, '_, '_, 'info, MarinadeClaimTickets<'info>>,
) -> Result<()> {
    let state = &mut ctx.accounts.state;
    ctx.remaining_accounts
        .iter()
        .for_each(|ticket_account_info| {
            // Call claim for each ticket account
            let cpi_accounts = Claim {
                state: ctx.accounts.marinade_state.to_account_info(),
                ticket_account: ticket_account_info.clone(),
                transfer_sol_to: ctx.accounts.vault.to_account_info(),
                reserve_pda: ctx.accounts.reserve_pda.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
            };

            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.marinade_program.to_account_info(),
                cpi_accounts,
                vault_signer_seeds,
            );
            let _ = claim(cpi_ctx);

            state.delete_from_engine_field(
                EngineFieldName::ExternalVaultAccounts,
                ticket_account_info.key(),
            );
        });

    Ok(())
}

#[access_control(
    acl::check_access(&ctx.accounts.state, &ctx.accounts.signer.key, Permission::LiquidUnstake)
)]
#[access_control(acl::check_integration(&ctx.accounts.state, Integration::Marinade))]
#[vault_signer_seeds]
pub fn liquid_unstake_handler<'c: 'info, 'info>(
    ctx: Context<MarinadeLiquidUnstake>,
    msol_amount: u64,
) -> Result<()> {
    let cpi_program = ctx.accounts.marinade_program.to_account_info();
    let cpi_accounts = LiquidUnstake {
        state: ctx.accounts.marinade_state.to_account_info(),
        msol_mint: ctx.accounts.msol_mint.to_account_info(),
        liq_pool_sol_leg_pda: ctx.accounts.liq_pool_sol_leg_pda.to_account_info(),
        liq_pool_msol_leg: ctx.accounts.liq_pool_msol_leg.to_account_info(),
        get_msol_from: ctx.accounts.get_msol_from.to_account_info(),
        get_msol_from_authority: ctx.accounts.get_msol_from_authority.to_account_info(),
        transfer_sol_to: ctx.accounts.vault.to_account_info(),
        treasury_msol_account: ctx.accounts.treasury_msol_account.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };

    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, vault_signer_seeds);
    let _ = liquid_unstake(cpi_ctx, msol_amount);
    Ok(())
}

#[derive(Accounts)]
pub struct MarinadeDepositSol<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub marinade_state: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub reserve_pda: AccountInfo<'info>,

    #[account(mut)]
    pub msol_mint: Account<'info, Mint>,

    /// CHECK: skip
    #[account(mut)]
    pub msol_mint_authority: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub liq_pool_msol_leg: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub liq_pool_msol_leg_authority: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub liq_pool_sol_leg_pda: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = msol_mint,
        associated_token::authority = vault,
    )]
    pub mint_to: Account<'info, TokenAccount>,

    pub marinade_program: Program<'info, MarinadeFinance>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MarinadeDepositStake<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub marinade_state: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub validator_list: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub stake_list: AccountInfo<'info>,

    #[account(mut)]
    pub vault_stake_account: Box<Account<'info, StakeAccount>>,

    /// CHECK: skip
    #[account(mut)]
    pub duplication_flag: UncheckedAccount<'info>,

    #[account(mut)]
    pub msol_mint: Account<'info, Mint>,

    /// CHECK: marinade checks it
    pub msol_mint_authority: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = msol_mint,
        associated_token::authority = vault,
    )]
    pub mint_to: Box<Account<'info, TokenAccount>>,

    pub clock: Sysvar<'info, Clock>,
    pub rent: Sysvar<'info, Rent>,

    pub marinade_program: Program<'info, MarinadeFinance>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub stake_program: Program<'info, Stake>,
}

#[derive(Accounts)]
pub struct MarinadeDelayedUnstake<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub ticket: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub msol_mint: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub burn_msol_from: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub marinade_state: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub reserve_pda: AccountInfo<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

#[derive(Accounts)]
pub struct MarinadeClaimTickets<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub marinade_state: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub reserve_pda: AccountInfo<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub marinade_program: Program<'info, MarinadeFinance>,
}

#[derive(Accounts)]
pub struct MarinadeLiquidUnstake<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    pub state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), state.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub marinade_state: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub msol_mint: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub liq_pool_sol_leg_pda: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub liq_pool_msol_leg: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub treasury_msol_account: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub get_msol_from: AccountInfo<'info>,

    /// CHECK: skip
    #[account(mut)]
    pub get_msol_from_authority: AccountInfo<'info>,

    pub marinade_program: Program<'info, MarinadeFinance>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
