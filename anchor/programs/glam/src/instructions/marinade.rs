use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use marinade::cpi::accounts::{Claim, Deposit, LiquidUnstake, OrderUnstake};
use marinade::cpi::{claim, deposit, liquid_unstake, order_unstake};
use marinade::program::MarinadeFinance;
use marinade::state::delayed_unstake_ticket::TicketAccountData;
use marinade::State as MarinadeState;

use crate::state::*;

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::Stake)
)]
pub fn marinade_deposit<'c: 'info, 'info>(
    ctx: Context<MarinadeDeposit>,
    sol_amount: u64,
) -> Result<()> {
    msg!(
        "mSol will be mint to ATA: {:?} owned by {:?}",
        ctx.accounts.mint_to.key(),
        ctx.accounts.treasury.key()
    );

    msg!(
        "transfer_from lamports: {:?}",
        ctx.accounts.treasury.lamports()
    );

    require_gte!(ctx.accounts.treasury.lamports(), sol_amount);

    let cpi_program = ctx.accounts.marinade_program.to_account_info();
    let cpi_accounts = Deposit {
        state: ctx.accounts.marinade_state.to_account_info(),
        msol_mint: ctx.accounts.msol_mint.to_account_info(),
        liq_pool_sol_leg_pda: ctx.accounts.liq_pool_sol_leg_pda.to_account_info(),
        liq_pool_msol_leg: ctx.accounts.liq_pool_msol_leg.to_account_info(),
        liq_pool_msol_leg_authority: ctx.accounts.liq_pool_msol_leg_authority.to_account_info(),
        reserve_pda: ctx.accounts.reserve_pda.to_account_info(),
        transfer_from: ctx.accounts.treasury.to_account_info(),
        mint_to: ctx.accounts.mint_to.to_account_info(),
        msol_mint_authority: ctx.accounts.msol_mint_authority.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };

    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        b"treasury".as_ref(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    let _ = deposit(cpi_ctx, sol_amount);
    Ok(())
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::Unstake)
)]
pub fn marinade_delayed_unstake<'c: 'info, 'info>(
    ctx: Context<MarinadeDelayedUnstake>,
    msol_amount: u64,
    ticket_bump: u8,
    ticket_id: String,
) -> Result<()> {
    let rent = Rent::get()?;
    let lamports = rent.minimum_balance(500); // Minimum balance to make the account rent-exempt

    msg!("ticket id: {}, ticket bump: {}", ticket_id, ticket_bump);

    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        b"ticket".as_ref(),
        ticket_id.as_bytes(),
        fund_key.as_ref(),
        &[ticket_bump],
    ];
    let signer_seeds = &[&seeds[..]];
    let space = std::mem::size_of::<TicketAccountData>() as u64 + 8;

    msg!(
        "Creating ticket account with address {}",
        ctx.accounts.ticket.key()
    );

    system_program::create_account(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::CreateAccount {
                from: ctx.accounts.manager.to_account_info(), // treasury PDA
                to: ctx.accounts.ticket.to_account_info().clone(),
            },
            signer_seeds,
        ),
        lamports,
        space,
        &ctx.accounts.marinade_program.key(),
    )?;

    let cpi_program = ctx.accounts.marinade_program.to_account_info();
    let cpi_accounts = OrderUnstake {
        state: ctx.accounts.marinade_state.to_account_info(),
        msol_mint: ctx.accounts.msol_mint.to_account_info(),
        burn_msol_from: ctx.accounts.burn_msol_from.to_account_info(),
        burn_msol_authority: ctx.accounts.treasury.to_account_info(),
        new_ticket_account: ctx.accounts.ticket.to_account_info(),
        clock: ctx.accounts.clock.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };

    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        b"treasury".as_ref(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    let _ = order_unstake(cpi_ctx, msol_amount);

    Ok(())
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::Unstake)
)]
pub fn marinade_claim<'info>(ctx: Context<'_, '_, '_, 'info, MarinadeClaim<'info>>) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        b"treasury".as_ref(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];

    ctx.remaining_accounts
        .iter()
        .for_each(|ticket_account_info| {
            // Call claim for each ticket account
            let cpi_accounts = Claim {
                state: ctx.accounts.marinade_state.to_account_info(),
                ticket_account: ticket_account_info.clone(),
                transfer_sol_to: ctx.accounts.treasury.to_account_info(),
                reserve_pda: ctx.accounts.reserve_pda.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                clock: ctx.accounts.clock.to_account_info(),
            };

            let cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.marinade_program.to_account_info(),
                cpi_accounts,
                signer_seeds,
            );
            let _ = claim(cpi_ctx);
        });

    Ok(())
}

#[access_control(
    acl::check_access(&ctx.accounts.fund, &ctx.accounts.manager.key, Permission::LiquidUnstake)
)]
pub fn marinade_liquid_unstake<'c: 'info, 'info>(
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
        transfer_sol_to: ctx.accounts.treasury.to_account_info(),
        treasury_msol_account: ctx.accounts.treasury_msol_account.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };

    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        b"treasury".as_ref(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    let _ = liquid_unstake(cpi_ctx, msol_amount);
    Ok(())
}

#[derive(Accounts)]
pub struct MarinadeDeposit<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    /// CHECK: skip
    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: AccountInfo<'info>,

    #[account(mut)]
    pub marinade_state: Account<'info, MarinadeState>,

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
        payer = manager,
        associated_token::mint = msol_mint,
        associated_token::authority = treasury,
    )]
    pub mint_to: Account<'info, TokenAccount>,

    pub marinade_program: Program<'info, MarinadeFinance>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
// #[instruction(ticket_id: String)]
pub struct MarinadeDelayedUnstake<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    /// CHECK: skip
    // #[account(mut, seeds = [b"ticket".as_ref(), ticket_id.as_bytes(), fund.key().as_ref()], bump)]
    // The line above wll cause "Error: memory allocation failed, out of memory"
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
pub struct MarinadeClaim<'info> {
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

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
    pub manager: Signer<'info>,

    #[account(has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

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
