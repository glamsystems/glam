pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;

declare_id!("Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc");

#[program]
pub mod glam {
    use super::*;

    pub fn initialize(ctx: Context<InitializeFund>, name: String) -> Result<()> {
        manager::initialize_fund_handler(ctx, name)
    }
    pub fn close(ctx: Context<CloseFund>) -> Result<()> {
        manager::close_handler(ctx)
    }
}
