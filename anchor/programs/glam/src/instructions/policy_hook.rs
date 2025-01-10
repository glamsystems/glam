use {
    crate::{error::PolicyError, state::*},
    anchor_lang::{prelude::*, system_program},
    anchor_spl::{
        token_2022::{
            spl_token_2022::{
                extension::{
                    transfer_hook::TransferHookAccount, BaseStateWithExtensions,
                    StateWithExtensions,
                },
                state::Account as Token2022Account,
            },
            ID as TOKEN_2022_PROGRAM_ID,
        },
        token_interface::{Mint, TokenAccount},
    },
    spl_tlv_account_resolution::state::ExtraAccountMetaList,
    spl_transfer_hook_interface::{
        error::TransferHookError,
        instruction::{ExecuteInstruction, TransferHookInstruction},
    },
};

pub const TRANSFER_HOOK_EXTRA_ACCOUNTS: usize = 3;

pub fn execute(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
    let src_account = &ctx.accounts.src_account;
    let dst_account = &ctx.accounts.dst_account;

    assert_token_account_is_transferring(&src_account.to_account_info().try_borrow_data()?)?;
    assert_token_account_is_transferring(&dst_account.to_account_info().try_borrow_data()?)?;

    let data = ctx.accounts.extra_account_meta_list.try_borrow_data()?;
    ExtraAccountMetaList::check_account_infos::<ExecuteInstruction>(
        &ctx.accounts.to_account_infos(),
        &TransferHookInstruction::Execute { amount }.pack(),
        &ctx.program_id,
        &data,
    )?;

    // It's responsibility of subscribe() to create the policy account
    // with the proper lock-up timestamp.
    // If a user doesn't have a policy account, it means that his tokens
    // are not subject to lock-up period for whatever reason, so from the
    // perspective of this check an unitialized account means lock-up
    // timestamp set to 0.
    // All other deserialize errors must be thrown.
    let locked_until_ts = match PolicyAccount::try_from(&ctx.accounts.src_account_policy) {
        Ok(src_account_policy) => Ok(src_account_policy.locked_until_ts),
        Err(ProgramError::UninitializedAccount) => Ok(0),
        Err(err) => Err(err),
    }?;

    let cur_timestamp = Clock::get()?.unix_timestamp;
    if cur_timestamp < locked_until_ts {
        return err!(PolicyError::LockUp);
    }

    Ok(())
}

fn assert_token_account_is_transferring(account_data: &[u8]) -> Result<()> {
    let token_account = StateWithExtensions::<Token2022Account>::unpack(account_data)?;
    let extension = token_account.get_extension::<TransferHookAccount>()?;
    if bool::from(extension.transferring) {
        Ok(())
    } else {
        Err(Into::<ProgramError>::into(
            TransferHookError::ProgramCalledOutsideOfTransfer,
        ))?
    }
}

// Order of accounts matters for this struct.
// The first 4 accounts are the accounts required for token transfer (source, mint, destination, owner)
// Remaining accounts are the extra accounts required from the ExtraAccountMetaList account
// These accounts are provided via CPI to this program from the token2022 program
#[derive(Accounts)]
pub struct TransferHook<'info> {
    #[account(
        token::mint = mint,
        token::authority = owner,
        token::token_program = TOKEN_2022_PROGRAM_ID,
    )]
    pub src_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mint::token_program = TOKEN_2022_PROGRAM_ID,
    )]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        token::mint = mint,
        token::token_program = TOKEN_2022_PROGRAM_ID,
    )]
    pub dst_account: Box<InterfaceAccount<'info, TokenAccount>>,

    //TODO: Change to unchecked if we want to allow PDAs to transfer
    pub owner: SystemAccount<'info>,

    /// CHECK: ExtraAccountMetaList Account
    #[account(
        seeds = [b"extra-account-metas", mint.key().as_ref()], 
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    pub state: Box<Account<'info, StateAccount>>,

    /// CHECK: PolicyAccount, handled explicitly, may or may not exist
    #[account(
        seeds = [
          b"account-policy".as_ref(),
          src_account.key().as_ref()
        ],
        bump
      )]
    pub src_account_policy: UncheckedAccount<'info>,

    /// CHECK: PolicyAccount, currently not used
    #[account(
        seeds = [
          b"account-policy".as_ref(),
          dst_account.key().as_ref()
        ],
        bump
      )]
    pub dst_account_policy: UncheckedAccount<'info>,
}

#[account]
pub struct PolicyAccount {
    pub locked_until_ts: i64, // unix timestamp, in seconds
}
impl<'info> TryFrom<&UncheckedAccount<'info>> for PolicyAccount {
    type Error = ProgramError;

    fn try_from(maybe_account: &UncheckedAccount<'info>) -> std::result::Result<Self, Self::Error> {
        if maybe_account.owner == &system_program::ID && maybe_account.lamports() == 0 {
            return Err(ProgramError::UninitializedAccount);
        }
        if maybe_account.owner != &Self::owner() {
            return Err(ProgramError::InvalidAccountOwner);
        }
        let mut data = &maybe_account.try_borrow_mut_data()?[..];
        match Self::try_deserialize(&mut data) {
            Ok(account) => Ok(account),
            Err(err) => Err(err.into()),
        }
    }
}
