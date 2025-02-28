use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use solana_program::{instruction::Instruction, program::invoke_signed};

use crate::error::GlamError;
use crate::instructions::stake_pool::StakePoolProgramInterface;
use crate::{constants::*, state::*};

use anchor_lang::Ids;

trait StateAccountExt {
    fn max_swap_slippage(&self) -> Option<u64>;
    fn set_max_swap_slippage(&mut self, slippage: u64);
}

impl StateAccountExt for StateAccount {
    fn max_swap_slippage(&self) -> Option<u64> {
        self.params.get(0).and_then(|params| {
            params
                .iter()
                .find(|field| matches!(field.name, EngineFieldName::MaxSwapSlippageBps))
                .and_then(|field| match &field.value {
                    EngineFieldValue::U64 { val } => Some(*val),
                    _ => None,
                })
        })
    }

    fn set_max_swap_slippage(&mut self, slippage: u64) {
        if let Some(params) = self.params.get_mut(0) {
            match params
                .iter_mut()
                .find(|f| f.name == EngineFieldName::MaxSwapSlippageBps)
            {
                Some(field) => {
                    field.value = EngineFieldValue::U64 { val: slippage };
                }
                None => {
                    params.push(EngineField {
                        name: EngineFieldName::MaxSwapSlippageBps,
                        value: EngineFieldValue::U64 { val: slippage },
                    });
                }
            }
        } else {
            // Initialize params[0] if it doesn't exist
            self.params.push(vec![EngineField {
                name: EngineFieldName::MaxSwapSlippageBps,
                value: EngineFieldValue::U64 { val: slippage },
            }]);
        }
    }
}

#[derive(Clone)]
pub struct Jupiter;

impl anchor_lang::Id for Jupiter {
    fn id() -> Pubkey {
        pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4")
    }
}
impl Jupiter {
    fn event_authority() -> Pubkey {
        pubkey!("D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf")
    }
    fn platform_fee_account() -> Pubkey {
        pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4")
    }
    fn parse_slippage_bps(data: Vec<u8>) -> u64 {
        // last byte is fee bps, 2 bytes before it is the slippage in bps
        let slippage_bytes = &data[data.len() - 3..data.len() - 1];
        u16::from_le_bytes([slippage_bytes[0], slippage_bytes[1]]) as u64
    }
}

#[derive(Accounts)]
pub struct JupiterSetMaxSwapSlippage<'info> {
    #[account(mut, constraint = glam_state.owner == glam_signer.key() @ GlamError::NotAuthorized)]
    pub glam_state: Account<'info, StateAccount>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,
}

pub fn set_max_swap_slippage_handler(
    ctx: Context<JupiterSetMaxSwapSlippage>,
    slippage: u64,
) -> Result<()> {
    let state = &mut ctx.accounts.glam_state;
    state.set_max_swap_slippage(slippage);
    Ok(())
}

#[derive(Accounts)]
pub struct JupiterSwap<'info> {
    #[account(mut)]
    pub glam_state: Box<Account<'info, StateAccount>>,

    #[account(mut, seeds = [SEED_VAULT.as_bytes(), glam_state.key().as_ref()], bump)]
    pub glam_vault: SystemAccount<'info>,

    #[account(mut)]
    pub glam_signer: Signer<'info>,

    pub cpi_program: Program<'info, Jupiter>,

    #[account(
        mut,
        associated_token::mint = input_mint,
        associated_token::authority = glam_vault,
        associated_token::token_program = input_token_program
    )]
    pub input_vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = output_mint,
        associated_token::authority = glam_vault,
        associated_token::token_program = output_token_program
    )]
    pub output_vault_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub input_mint: Box<InterfaceAccount<'info, Mint>>,
    pub output_mint: Box<InterfaceAccount<'info, Mint>>,

    /// CHECK: manually check in handler
    pub input_stake_pool: Option<AccountInfo<'info>>,
    /// CHECK: manually check in handler
    pub output_stake_pool: Option<AccountInfo<'info>>,

    // programs
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub input_token_program: Interface<'info, TokenInterface>,
    pub output_token_program: Interface<'info, TokenInterface>,
}

fn parse_route(ctx: &Context<JupiterSwap>) -> bool {
    let mut res = true;
    res &= ctx.remaining_accounts.len() > 9;

    res &= ctx.remaining_accounts[0].key() == ctx.accounts.output_token_program.key()
        || ctx.remaining_accounts[0].key() == ctx.accounts.input_token_program.key();
    res &= ctx.remaining_accounts[1].key() == ctx.accounts.glam_vault.key();
    res &= ctx.remaining_accounts[2].key() == ctx.accounts.input_vault_ata.key();
    res &= ctx.remaining_accounts[3].key() == ctx.accounts.output_vault_ata.key();
    res &= ctx.remaining_accounts[4].key() == Jupiter::id(); // null key
    res &= ctx.remaining_accounts[5].key() == ctx.accounts.output_mint.key();
    res &= ctx.remaining_accounts[6].key() == Jupiter::platform_fee_account();
    res &= ctx.remaining_accounts[7].key() == Jupiter::event_authority();
    res &= ctx.remaining_accounts[8].key() == Jupiter::id();

    res
}

fn parse_exact_out_route(ctx: &Context<JupiterSwap>) -> bool {
    let mut res = true;
    res &= ctx.remaining_accounts.len() > 11;

    res &= ctx.remaining_accounts[0].key() == ctx.accounts.output_token_program.key()
        || ctx.remaining_accounts[0].key() == ctx.accounts.input_token_program.key();
    res &= ctx.remaining_accounts[1].key() == ctx.accounts.glam_vault.key();
    res &= ctx.remaining_accounts[2].key() == ctx.accounts.input_vault_ata.key();
    res &= ctx.remaining_accounts[3].key() == ctx.accounts.output_vault_ata.key();
    res &= ctx.remaining_accounts[4].key() == Jupiter::id(); // null key
    res &= ctx.remaining_accounts[5].key() == ctx.accounts.input_mint.key();
    res &= ctx.remaining_accounts[6].key() == ctx.accounts.output_mint.key();
    res &= ctx.remaining_accounts[7].key() == Jupiter::id(); // null key
    res &= ctx.remaining_accounts[8].key() == ctx.accounts.input_token_program.key()
        || ctx.remaining_accounts[8].key() == ctx.accounts.output_token_program.key()
        || ctx.remaining_accounts[8].key() == Jupiter::id(); // token program or null key
    res &= ctx.remaining_accounts[9].key() == Jupiter::event_authority();
    res &= ctx.remaining_accounts[10].key() == Jupiter::id();

    res
}

fn parse_shared_accounts_route(ctx: &Context<JupiterSwap>) -> bool {
    let mut res = true;
    res &= ctx.remaining_accounts.len() > 13;

    res &= ctx.remaining_accounts[0].key() == ctx.accounts.output_token_program.key()
        || ctx.remaining_accounts[0].key() == ctx.accounts.input_token_program.key();
    // res &= ctx.remaining_accounts[1].key() - programAuthority ignored

    res &= ctx.remaining_accounts[2].key() == ctx.accounts.glam_vault.key();
    res &= ctx.remaining_accounts[3].key() == ctx.accounts.input_vault_ata.key();
    // res &= ctx.remaining_accounts[4].key() - programSourceTokenAccount ignored
    // res &= ctx.remaining_accounts[5].key() - programDestinationTokenAccount ignored

    res &= ctx.remaining_accounts[6].key() == ctx.accounts.output_vault_ata.key();
    res &= ctx.remaining_accounts[7].key() == ctx.accounts.input_mint.key();
    res &= ctx.remaining_accounts[8].key() == ctx.accounts.output_mint.key();
    res &= ctx.remaining_accounts[9].key() == Jupiter::id(); // null key
    res &= ctx.remaining_accounts[10].key() == ctx.accounts.input_token_program.key()
        || ctx.remaining_accounts[10].key() == ctx.accounts.output_token_program.key()
        || ctx.remaining_accounts[10].key() == Jupiter::id(); // token program or null key
    res &= ctx.remaining_accounts[11].key() == Jupiter::event_authority();
    res &= ctx.remaining_accounts[12].key() == Jupiter::id();

    res
}

fn is_lst<'info>(mint: &Pubkey, stake_pool_account: Option<&AccountInfo<'info>>) -> Result<bool> {
    // Check if the mint is WSOL or MSOL
    if mint == &WSOL || mint == &MSOL {
        return Ok(true);
    }

    // Return false if no stake pool account is provided
    let stake_pool_account = match stake_pool_account {
        Some(account) => account,
        None => return Ok(false),
    };

    // Check if the stake pool account owner is valid
    if !StakePoolProgramInterface::ids().contains(stake_pool_account.owner) {
        return Ok(false);
    }

    // Validate pool mint matches the provided mint
    let buf = stake_pool_account.try_borrow_data()?;
    let pool_mint_bytes = &buf[POOL_MINT_OFFSET..POOL_MINT_OFFSET + 32];
    let pool_mint =
        Pubkey::try_from(pool_mint_bytes).map_err(|_| GlamError::InvalidAssetForSwap)?;
    require_keys_eq!(pool_mint, *mint, GlamError::InvalidAssetForSwap);

    Ok(true)
}

#[access_control(
    acl::check_integration(&ctx.accounts.glam_state, Integration::JupiterSwap)
)]
#[glam_macros::glam_vault_signer_seeds]
pub fn swap_handler<'c: 'info, 'info>(
    ctx: Context<'_, '_, 'c, 'info, JupiterSwap<'info>>,
    _amount: u64,
    data: Vec<u8>,
) -> Result<()> {
    let state = &mut ctx.accounts.glam_state;

    // Check slippage limit
    if let Some(max_slippage) = state.max_swap_slippage() {
        let slippage = Jupiter::parse_slippage_bps(data.clone());
        msg!(
            "Slippage: {}, max slippage allowed: {}",
            slippage,
            max_slippage
        );
        require!(slippage <= max_slippage, GlamError::InvalidSwap);
    }

    // Check if input and output mints are in the assets allowlist
    let input_in_assets = state.assets.contains(&ctx.accounts.input_mint.key());
    let output_in_assets = state.assets.contains(&ctx.accounts.output_mint.key());

    let input_is_lst = is_lst(
        &ctx.accounts.input_mint.key(),
        ctx.accounts.input_stake_pool.as_ref(),
    )?;
    let output_is_lst = is_lst(
        &ctx.accounts.output_mint.key(),
        ctx.accounts.output_stake_pool.as_ref(),
    )?;

    // Build the list of accepted permissions and check access
    let mut accepted_permissions = vec![Permission::JupiterSwapAny];
    if input_in_assets && output_in_assets {
        accepted_permissions.push(Permission::JupiterSwapAllowlisted);
    }
    if input_is_lst && output_is_lst {
        accepted_permissions.push(Permission::JupiterSwapLst);
    }
    acl::check_access_any(&state, &ctx.accounts.glam_signer.key, accepted_permissions)?;

    // TODO: should we add missing assets to the list after permission check?
    // This will gradually expand the assets allowlist and auto escalate JupiterSwapAllowlisted privilege over time
    if !input_in_assets {
        state.assets.push(ctx.accounts.input_mint.key());
    }
    if !output_in_assets {
        state.assets.push(ctx.accounts.output_mint.key());
    }

    // Parse Jupiter Swap accounts
    let ix_disc = u64::from_be_bytes(data[..8].try_into().unwrap());
    let parse_result = match ix_disc {
        0xe517cb977ae3ad2a => parse_route(&ctx),           // route
        0xd033ef977b2bed5c => parse_exact_out_route(&ctx), // exactOutRoute
        0xc1209b3341d69c81 => parse_shared_accounts_route(&ctx), // sharedAccountsRoute
        0xb0d169a89a7d453e => parse_shared_accounts_route(&ctx), // sharedAccountsExactOutRoute (same)
        _ => panic!("Jupiter instruction not supported"),
    };
    require!(parse_result, GlamError::InvalidSwap);

    //
    // Jupiter swap
    //

    // Map remaining_accounts -> AccountMeta
    let vault_key = ctx.accounts.glam_vault.key();
    let accounts: Vec<AccountMeta> = ctx
        .remaining_accounts
        .iter()
        .map(|acc| AccountMeta {
            pubkey: *acc.key,
            is_signer: acc.is_signer || *acc.key == vault_key,
            is_writable: acc.is_writable,
        })
        .collect();

    // Swap
    invoke_signed(
        &Instruction {
            program_id: Jupiter::id(),
            accounts,
            data,
        },
        ctx.remaining_accounts,
        glam_vault_signer_seeds,
    )?;

    Ok(())
}
