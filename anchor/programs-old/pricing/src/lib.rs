pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;

declare_id!("Gpr1WZZXAty2L9eiMwZPC7ra69vMFojhdqDuiRHkQQQp");

#[program]
pub mod pricing {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn pay_usd(ctx: Context<PayUsd>, amount: u64) -> Result<()> {
        pay_usd::handler(ctx, amount)
    }
}
