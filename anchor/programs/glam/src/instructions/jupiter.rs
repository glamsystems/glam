use anchor_lang::prelude::*;
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
    #[account(mut)]
    pub manager: Signer<'info>,

    #[account(mut, seeds = [b"treasury".as_ref(), fund.key().as_ref()], bump)]
    pub treasury: SystemAccount<'info>,

    #[account(has_one = manager, has_one = treasury)]
    pub fund: Box<Account<'info, FundAccount>>,

    pub jupiter_program: Program<'info, Jupiter>,
    pub system_program: Program<'info, System>,
}

pub fn jupiter_swap(ctx: Context<JupiterSwap>, data: Vec<u8>) -> Result<()> {
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

    let fund_key = ctx.accounts.fund.key();
    let seeds = &[
        b"treasury".as_ref(),
        fund_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer_seeds = &[&seeds[..]];
    let _ = invoke_signed(
        &Instruction {
            program_id: *ctx.accounts.jupiter_program.key,
            accounts,
            data,
        },
        &accounts_infos,
        signer_seeds,
    );

    Ok(())
}
