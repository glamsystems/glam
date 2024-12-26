import { BN } from "@coral-xyz/anchor";

import { createFundForTest, sleep } from "./setup";
import { GlamClient } from "../src";
import { PublicKey } from "@solana/web3.js";

const JITO_STAKE_POOL = new PublicKey(
  "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb",
);
const BONK_STAKE_POOL = new PublicKey(
  "ArAQfbzsdotoKB5jJcZa3ajQrrPcWr2YQoDAEAiFxJAC",
);

const PHASE_LABS_STAKE_POOL = new PublicKey(
  "phasejkG1akKgqkLvfWzWY17evnH6mSWznnUspmpyeG",
);

describe("glam_staking", () => {
  const glamClient = new GlamClient();
  const connection = glamClient.provider.connection;

  let defaultVote; // the test validator's default vote account
  let fundPDA;

  beforeAll(async () => {
    const voteAccountStatus = await connection.getVoteAccounts();
    const vote = voteAccountStatus.current.sort(
      (a, b) => b.activatedStake - a.activatedStake,
    )[0].votePubkey;
    defaultVote = new PublicKey(vote);
  });

  it("Create fund with 100 SOL in treasury", async () => {
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const txSig = await glamClient.fund.updateFund(fundPDA, {
      integrationAcls: [
        { name: { nativeStaking: {} }, features: [] },
        { name: { splStakePool: {} }, features: [] },
        { name: { sanctumStakePool: {} }, features: [] },
      ],
    });

    const airdropTx = await connection.requestAirdrop(
      fundData.treasuryPDA,
      100_000_000_000,
    );
    await connection.confirmTransaction({
      ...(await connection.getLatestBlockhash()),
      signature: airdropTx,
    });
  });

  it("Initialize stake with 10 SOL and delegate to a validator", async () => {
    try {
      const txSig = await glamClient.staking.initializeAndDelegateStake(
        fundPDA,
        defaultVote,
        new BN(10_000_000_000),
      );
      console.log("initializeAndDelegateStake tx:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const stakeAccounts = await glamClient.staking.getStakeAccounts(
      glamClient.getTreasuryPDA(fundPDA),
    );
    expect(stakeAccounts.length).toEqual(1);
  });

  it("Redelegate stake", async () => {
    // wait for the stake account to become active
    await sleep(75_000);

    let stakeAccounts = await glamClient.staking.getStakeAccountsWithStates(
      glamClient.getTreasuryPDA(fundPDA),
    );
    expect(stakeAccounts.length).toEqual(1);

    // redelegate the stake account
    try {
      const { txSig } = await glamClient.staking.redelegateStake(
        fundPDA,
        stakeAccounts[0].address,
        new PublicKey("GJQjnyhSG9jN1AdMHTSyTxUR44hJHEGCmNzkidw9z3y8"),
      );
      console.log("redelegateStake tx:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }

    // 2 stake accounts after re-delegation
    // the existing stake account is not closed by default
    stakeAccounts = await glamClient.staking.getStakeAccountsWithStates(
      glamClient.getTreasuryPDA(fundPDA),
    );
    expect(stakeAccounts.length).toEqual(2);
  }, 90_000);

  it("Spilt stake account", async () => {
    let stakeAccounts = await glamClient.staking.getStakeAccountsWithStates(
      glamClient.getTreasuryPDA(fundPDA),
    );

    try {
      const { newStake, txSig } = await glamClient.staking.splitStakeAccount(
        fundPDA,
        stakeAccounts[0].address,
        new BN(2_000_000_000),
      );
      console.log("splitStakeAccount tx:", txSig);

      stakeAccounts = await glamClient.staking.getStakeAccountsWithStates(
        glamClient.getTreasuryPDA(fundPDA),
      );
      expect(stakeAccounts.length).toEqual(3);
      expect(
        stakeAccounts.some((account) => account.address.equals(newStake)),
      ).toBeTruthy();
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Merge stake accounts", async () => {
    let stakeAccounts = await glamClient.staking.getStakeAccountsWithStates(
      glamClient.getTreasuryPDA(fundPDA),
    );
    expect(stakeAccounts.length).toEqual(3);

    try {
      const txId = await glamClient.staking.mergeStakeAccounts(
        fundPDA,
        stakeAccounts[0].address,
        stakeAccounts[1].address,
      );
      console.log("mergeStakeAccounts tx:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    // Only 1 stake account should be left after merging
    stakeAccounts = await glamClient.staking.getStakeAccountsWithStates(
      glamClient.getTreasuryPDA(fundPDA),
    );
    expect(stakeAccounts.length).toEqual(2);
  });

  it("[spl-stake-pool] Deposit stake account to jito stake pool", async () => {
    try {
      let stakeAccounts = await glamClient.staking.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA),
      );
      const txSig = await glamClient.staking.stakePoolDepositStake(
        fundPDA,
        JITO_STAKE_POOL,
        stakeAccounts[0],
      );
      console.log("stakePoolDepositStake tx:", txSig);

      stakeAccounts = await glamClient.staking.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA),
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
        new BN(10_000_000_000),
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
        new BN(1_000_000_000),
      );
      console.log("stakePoolWithdrawStake tx:", txSig);

      const stakeAccounts = await glamClient.staking.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA),
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
        new BN(10_000_000_000),
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
        new BN(1_000_000_000),
      );
      console.log("stakePoolWithdrawStake tx:", txSig);

      // Now we should have 2 stake accounts: 1 from jito and 1 from bonk
      const stakeAccounts = await glamClient.staking.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA),
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
        new BN(10_000_000_000),
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
        new BN(1_000_000_000),
      );
      console.log("stakePoolWithdrawStake tx:", txSig);

      const stakeAccounts = await glamClient.staking.getStakeAccounts(
        glamClient.getTreasuryPDA(fundPDA),
      );
      expect(stakeAccounts.length).toEqual(3);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Deactivate stake accounts", async () => {
    const stakeAccounts = await glamClient.staking.getStakeAccounts(
      glamClient.getTreasuryPDA(fundPDA),
    );
    try {
      const txSig = await glamClient.staking.deactivateStakeAccounts(
        fundPDA,
        stakeAccounts,
      );
      console.log("deactivateStakeAccounts tx:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Withdraw from stake accounts", async () => {
    const stakeAccounts = await glamClient.staking.getStakeAccounts(
      glamClient.getTreasuryPDA(fundPDA),
    );

    let lamportsInStakeAccounts = 0;
    for (const account of stakeAccounts) {
      lamportsInStakeAccounts += (await connection.getAccountInfo(account))!
        .lamports;
    }

    const treasuryLamportsBefore = (await connection.getAccountInfo(
      glamClient.getTreasuryPDA(fundPDA),
    ))!.lamports;

    try {
      const txSig = await glamClient.staking.withdrawFromStakeAccounts(
        fundPDA,
        stakeAccounts,
      );
      console.log("withdrawFromStakeAccounts tx:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const treasuryLamportsAfter = (await connection.getAccountInfo(
      glamClient.getTreasuryPDA(fundPDA),
    ))!.lamports;
    expect(treasuryLamportsAfter).toEqual(
      treasuryLamportsBefore + lamportsInStakeAccounts,
    );

    const stakeAccountsAfter = await glamClient.staking.getStakeAccounts(
      glamClient.getTreasuryPDA(fundPDA),
    );
    expect(stakeAccountsAfter.length).toEqual(0);
  });
});
