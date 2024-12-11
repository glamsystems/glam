import * as anchor from "@coral-xyz/anchor";

import { createFundForTest, sleep } from "./setup";
import { GlamClient } from "../src";
import { PublicKey } from "@solana/web3.js";

describe("glam_marinade", () => {
  const glamClient = new GlamClient();
  let fundPDA;

  it("Create fund with 100 SOLs in treasury", async () => {
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const connection = glamClient.provider.connection;
    const airdropTx = await connection.requestAirdrop(
      fundData.treasuryPDA,
      100_000_000_000,
    );
    await connection.confirmTransaction({
      ...(await connection.getLatestBlockhash()),
      signature: airdropTx,
    });
  });

  it("Marinade desposit: stake 20 SOL", async () => {
    try {
      const tx = await glamClient.marinade.depositSol(
        fundPDA,
        new anchor.BN(2e10),
      );
      console.log("Stake 20 SOL:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 15_000);

  it("Liquid unstake 1 mSOL", async () => {
    try {
      const tx = await glamClient.marinade.liquidUnstake(
        fundPDA,
        new anchor.BN(1e9),
      );
      console.log("Liquid unstake:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });

  it("Order unstake 1 mSOL x5", async () => {
    try {
      for (let i = 0; i < 5; i++) {
        const tx = await glamClient.marinade.delayedUnstake(
          fundPDA,
          new anchor.BN(1e9),
        );
        console.log(`Delayed unstake #${i}:`, tx);
      }
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 20_000);

  it("Check tickets before claim", async () => {
    const tickets = await glamClient.marinade.getExistingTickets(fundPDA);
    console.log(
      "Tickets:",
      tickets.map((t) => t.toBase58()),
    );
    expect(tickets.length).toBe(5);

    const fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.externalTreasuryAccounts.length).toBe(tickets.length);
    expect(fundModel.externalTreasuryAccounts.sort()).toEqual(tickets.sort());
  });

  it("Claim tickets", async () => {
    // wait for 30s so that the ticket is ready to be claimed
    await sleep(30_000);
    const tickets = await glamClient.marinade.getExistingTickets(fundPDA);
    try {
      const tx = await glamClient.marinade.claimTickets(fundPDA, tickets);
      console.log("Claim tickets:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 45_000);

  it("Check tickets after claim", async () => {
    const tickets = await glamClient.marinade.getExistingTickets(fundPDA);
    expect(tickets.length).toBe(0);

    const fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.externalTreasuryAccounts.length).toBe(tickets.length);
    expect(fundModel.externalTreasuryAccounts.sort()).toEqual(tickets.sort());
  });

  // FIXME: For some reason, depositStake test must be run after the claimTickets test
  // Otherwise, cliamTickets test hangs forever
  it("Natively stake 10 SOL to a validator", async () => {
    try {
      const txSig = await glamClient.staking.initializeAndDelegateStake(
        fundPDA,
        new PublicKey("GJQjnyhSG9jN1AdMHTSyTxUR44hJHEGCmNzkidw9z3y8"),
        new anchor.BN(10_000_000_000),
      );
      console.log("nativeStakeDeposit tx:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Desposit stake account", async () => {
    const stakeAccounts = await glamClient.staking.getStakeAccounts(
      glamClient.getTreasuryPDA(fundPDA),
    );
    expect(stakeAccounts.length).toEqual(1);

    try {
      await glamClient.marinade.depositStake(fundPDA, stakeAccounts[0]);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });
});
