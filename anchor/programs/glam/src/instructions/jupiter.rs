use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{sync_native, Mint, SyncNative, Token, TokenAccount},
};
use solana_program::{instruction::Instruction, program::invoke_signed};

use crate::state::*;

mod jupiter {
    use anchor_lang::declare_id;
    declare_id!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");
}

#[derive(Clone)]
pub struct Jupiter;

impl anchor_lang::Id for Jupiter {
    fn id() -> Pubkey {
        jupiter::id()
    }
}

#[derive(Accounts)]
pub struct JupiterSwap<'info> {
    // Manager
    #[account(mut)]
    pub manager: Signer<'info>,
    #[account(
        init_if_needed,
        payer = manager,
        associated_token::mint = wsol_mint,
        associated_token::authority = manager)]
    pub manager_wsol_ata: Account<'info, TokenAccount>,

    // Fund and treasury
    #[account(has_one = manager, has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,
    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,
    #[account(
        init_if_needed,
        payer = manager,
        associated_token::mint = msol_mint,
        associated_token::authority = treasury)]
    pub treasury_msol_ata: Account<'info, TokenAccount>,

    pub wsol_mint: Account<'info, Mint>,
    pub msol_mint: Account<'info, Mint>,

    pub jupiter_program: Program<'info, Jupiter>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn jupiter_swap(ctx: Context<JupiterSwap>, amount: u64, data: Vec<u8>) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        "treasury".as_bytes(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];
    //
    // Transfer sol from treasury to manager wsol ata
    //
    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.treasury.to_account_info(),
                to: ctx.accounts.manager_wsol_ata.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;
    sync_native(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        SyncNative {
            account: ctx.accounts.manager_wsol_ata.to_account_info(),
        },
        &[],
    ))?;

    //
    // Jupiter swap
    //
    let accounts: Vec<AccountMeta> = ctx
        .remaining_accounts
        .iter()
        .map(|acc| AccountMeta {
            pubkey: *acc.key,
            is_signer: acc.is_signer,
            is_writable: acc.is_writable,
        })
        .collect();

    let accounts_infos: Vec<AccountInfo> = ctx
        .remaining_accounts
        .iter()
        .map(|acc| AccountInfo { ..acc.clone() })
        .collect();

    let _ = invoke_signed(
        &Instruction {
            program_id: *ctx.accounts.jupiter_program.key,
            accounts,
            data,
        },
        &accounts_infos,
        &[],
    );

    Ok(())
}
