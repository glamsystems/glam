import { BN } from "@coral-xyz/anchor";

import { createFundForTest } from "./setup";
import { GlamClient } from "../src";
import { PublicKey } from "@solana/web3.js";

const JITO_STAKE_POOL = new PublicKey(
  "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb"
);
const BONK_STAKE_POOL = new PublicKey(
  "ArAQfbzsdotoKB5jJcZa3ajQrrPcWr2YQoDAEAiFxJAC"
);

describe("glam_stakepool", () => {
  const glamClient = new GlamClient();
  const connection = glamClient.provider.connection;

  let fundPDA;

  it("Create fund with 100 SOL in treasury", async () => {
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const airdropTx = await connection.requestAirdrop(
      fundData.treasuryPDA,
      100_000_000_000
    );
    await connection.confirmTransaction({
      ...(await connection.getLatestBlockhash()),
      signature: airdropTx,
    });
  });

  it("Deposit 10 SOL to jito stake pool", async () => {
    try {
      const txSig = await glamClient.stakePool.depositSol(
        fundPDA,
        JITO_STAKE_POOL,
        new BN(10_000_000_000)
      );
      console.log("stakePoolDeposit tx:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Withdraw 1 jitoSOL to stake account", async () => {
    try {
      const txSig = await glamClient.stakePool.withdrawStake(
        fundPDA,
        JITO_STAKE_POOL,
        new BN(1_000_000_000)
      );
      console.log("stakePoolWithdrawStake tx:", txSig);

      const stakeAccounts = await glamClient.stakePool.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA)
      );
      expect(stakeAccounts.length).toEqual(1);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Deposit 10 SOL to bonk stake pool", async () => {
    try {
      const txSig = await glamClient.stakePool.depositSol(
        fundPDA,
        BONK_STAKE_POOL,
        new BN(10_000_000_000)
      );
      console.log("stakePoolDeposit tx:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Withdraw 1 bonkSOL to stake account", async () => {
    try {
      const txSig = await glamClient.stakePool.withdrawStake(
        fundPDA,
        BONK_STAKE_POOL,
        new BN(1_000_000_000)
      );
      console.log("stakePoolWithdrawStake tx:", txSig);

      const stakeAccounts = await glamClient.stakePool.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA)
      );
      // Now we should have 2 stake accounts: 1 from jito and 1 from bonk
      expect(stakeAccounts.length).toEqual(2);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});

// let txSig = await glamClient.program.methods
//   .stakePoolWithdrawSol(new BN(1_000_000_000))
//   .accounts({
//     fund: fundPDA,
//     treasury: glamClient.getTreasuryPDA(fundPDA),
//     manager: glamClient.getManager(),
//     poolMint: stakePoolData.poolMint,
//     poolTokenAta: glamClient.getTreasuryAta(
//       fundPDA,
//       stakePoolData.poolMint
//     ),
//     feeAccount: stakePoolData.managerFeeAccount,
//     stakePool: JITO_STAKE_POOL,
//     reserveStake: stakePoolData.reserveStake,
//     withdrawAuthority,
//     sysvarClock: SYSVAR_CLOCK_PUBKEY,
//     sysvarStakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
//     nativeStakeProgram: StakeProgram.programId,
//     tokenProgram: TOKEN_PROGRAM_ID,
//     stakePoolProgram: STAKE_POOL_PROGRAM_ID,
//   })
//   .rpc();
// console.log("stakePoolWithdrawSol tx:", txSig);
