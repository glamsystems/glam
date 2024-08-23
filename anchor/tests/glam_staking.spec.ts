import { BN } from "@coral-xyz/anchor";

import { createFundForTest } from "./setup";
import { GlamClient } from "../src";
import {
  PublicKey,
  StakeProgram,
  SYSVAR_STAKE_HISTORY_PUBKEY,
} from "@solana/web3.js";

const JITO_STAKE_POOL = new PublicKey(
  "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb"
);
const BONK_STAKE_POOL = new PublicKey(
  "ArAQfbzsdotoKB5jJcZa3ajQrrPcWr2YQoDAEAiFxJAC"
);

const PHASE_LABS_STAKE_POOL = new PublicKey(
  "phasejkG1akKgqkLvfWzWY17evnH6mSWznnUspmpyeG"
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

  it("Stake 10 SOL to a validator", async () => {
    try {
      // The same stake account will be used later on for depositing stake to jito
      // So the vote account must match jito validator stake account's vote
      const txSig = await glamClient.staking.initializeAndDelegateStake(
        fundPDA,
        new PublicKey("StepeLdhJ2znRjHcZdjwMWsC4nTRURNKQY8Nca82LJp"),
        new BN(10_000_000_000)
      );
      console.log("initializeAndDelegateStake tx:", txSig);

      const stakeAccounts = await glamClient.staking.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA)
      );
      expect(stakeAccounts.length).toEqual(1);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Stake 5 SOL to a validator", async () => {
    try {
      const txSig = await glamClient.staking.initializeAndDelegateStake(
        fundPDA,
        new PublicKey("StepeLdhJ2znRjHcZdjwMWsC4nTRURNKQY8Nca82LJp"),
        new BN(5_000_000_000)
      );

      const stakeAccounts = await glamClient.staking.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA)
      );
      expect(stakeAccounts.length).toEqual(2);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let stakeAccounts = await glamClient.staking.getStakeAccounts(
      glamClient.getTreasuryPDA(fundPDA)
    );
    expect(stakeAccounts.length).toEqual(2);

    try {
      const txId = await glamClient.staking.mergeStakeAccounts(
        fundPDA,
        stakeAccounts[0],
        stakeAccounts[1]
      );
      console.log("mergeStakeAccounts tx:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    // Only 1 stake account should be left after merging
    stakeAccounts = await glamClient.staking.getStakeAccounts(
      glamClient.getTreasuryPDA(fundPDA)
    );
    expect(stakeAccounts.length).toEqual(1);
  });

  it("[spl-stake-pool] Deposit stake account to jito stake pool", async () => {
    try {
      let stakeAccounts = await glamClient.staking.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA)
      );
      const txSig = await glamClient.staking.stakePoolDepositStake(
        fundPDA,
        JITO_STAKE_POOL,
        stakeAccounts[0]
      );
      console.log("stakePoolDepositStake tx:", txSig);

      stakeAccounts = await glamClient.staking.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA)
      );
      expect(stakeAccounts.length).toEqual(0);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("[spl-stake-pool] Deposit 10 SOL to jito stake pool", async () => {
    try {
      const txSig = await glamClient.staking.stakePoolDepositSol(
        fundPDA,
        JITO_STAKE_POOL,
        new BN(10_000_000_000)
      );
      console.log("stakePoolDepositSol tx:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("[spl-stake-pool] Withdraw 1 jitoSOL to stake account", async () => {
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
      expect(stakeAccounts.length).toEqual(1);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("[sanctum-single-valiator] Deposit 10 SOL to bonk stake pool", async () => {
    try {
      const txSig = await glamClient.staking.stakePoolDepositSol(
        fundPDA,
        BONK_STAKE_POOL,
        new BN(10_000_000_000)
      );
      console.log("stakePoolDepositSol tx:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("[sanctum-single-valiator] Withdraw 1 bonkSOL to stake account", async () => {
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
      expect(stakeAccounts.length).toEqual(2);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("[sanctum-multi-valiator] Deposit 10 SOL to phase labs stake pool", async () => {
    try {
      const txSig = await glamClient.staking.stakePoolDepositSol(
        fundPDA,
        PHASE_LABS_STAKE_POOL,
        new BN(10_000_000_000)
      );
      console.log("stakePoolDepositSol tx:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("[sanctum-multi-valiator] Withdraw 1 phaseSOL to stake account", async () => {
    try {
      const txSig = await glamClient.staking.stakePoolWithdrawStake(
        fundPDA,
        PHASE_LABS_STAKE_POOL,
        new BN(1_000_000_000)
      );
      console.log("stakePoolWithdrawStake tx:", txSig);

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
