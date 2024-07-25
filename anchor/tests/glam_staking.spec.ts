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

describe("glam_staking", () => {
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

  it("Natively stake 10 SOL to a validator", async () => {
    try {
      const txSig = await glamClient.staking.nativeStakeDeposit(
        fundPDA,
        new PublicKey("J2nUHEAgZFRyuJbFjdqPrAa9gyWDuc7hErtDQHPhsYRp"),
        new BN(10_000_000_000)
      );
      console.log("nativeStakeDeposit tx:", txSig);

      const stakeAccounts = await glamClient.staking.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA)
      );
      expect(stakeAccounts.length).toEqual(1);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Deposit 10 SOL to jito stake pool", async () => {
    try {
      const txSig = await glamClient.staking.stakePoolDepositSol(
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
      const txSig = await glamClient.staking.stakePoolWithdrawStake(
        fundPDA,
        JITO_STAKE_POOL,
        new BN(1_000_000_000)
      );
      console.log("stakePoolWithdrawStake tx:", txSig);

      const stakeAccounts = await glamClient.staking.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA)
      );
      expect(stakeAccounts.length).toEqual(2);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Deposit 10 SOL to bonk stake pool", async () => {
    try {
      const txSig = await glamClient.staking.stakePoolDepositSol(
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
      const txSig = await glamClient.staking.stakePoolWithdrawStake(
        fundPDA,
        BONK_STAKE_POOL,
        new BN(1_000_000_000)
      );
      console.log("stakePoolWithdrawStake tx:", txSig);

      // Now we should have 2 stake accounts: 1 from jito and 1 from bonk
      const stakeAccounts = await glamClient.staking.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA)
      );
      expect(stakeAccounts.length).toEqual(3);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Deactivate stake accounts", async () => {
    const stakeAccounts = await glamClient.staking.getStakeAccounts(
      glamClient.getTreasuryPDA(fundPDA)
    );
    try {
      const txSig = await glamClient.staking.deactivateStakeAccounts(
        fundPDA,
        stakeAccounts
      );
      console.log("deactivateStakeAccounts tx:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Withdraw from stake accounts", async () => {
    const stakeAccounts = await glamClient.staking.getStakeAccounts(
      glamClient.getTreasuryPDA(fundPDA)
    );

    let lamportsInStakeAccounts = 0;
    for (const account of stakeAccounts) {
      lamportsInStakeAccounts += (await connection.getAccountInfo(account))!
        .lamports;
    }

    const treasuryLamportsBefore = (await connection.getAccountInfo(
      glamClient.getTreasuryPDA(fundPDA)
    ))!.lamports;

    try {
      const txSig = await glamClient.staking.withdrawFromStakeAccounts(
        fundPDA,
        stakeAccounts
      );
      console.log("withdrawFromStakeAccounts tx:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const treasuryLamportsAfter = (await connection.getAccountInfo(
      glamClient.getTreasuryPDA(fundPDA)
    ))!.lamports;
    expect(treasuryLamportsAfter).toEqual(
      treasuryLamportsBefore + lamportsInStakeAccounts
    );

    const stakeAccountsAfter = await glamClient.staking.getStakeAccounts(
      glamClient.getTreasuryPDA(fundPDA)
    );
    expect(stakeAccountsAfter.length).toEqual(0);
  });
});
