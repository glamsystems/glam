import * as anchor from "@coral-xyz/anchor";

import { airdrop, createGlamStateForTest, sleep } from "./setup";
import { GlamClient } from "../src";
import { PublicKey } from "@solana/web3.js";

describe("glam_marinade", () => {
  const glamClient = new GlamClient();
  let statePda;

  it("Create fund with 100 SOL in vault", async () => {
    const stateData = await createGlamStateForTest(glamClient);
    statePda = stateData.statePda;

    const txSig = await glamClient.state.updateState(statePda, {
      integrationAcls: [
        { name: { marinade: {} }, features: [] },
        { name: { nativeStaking: {} }, features: [] },
      ],
    });
    console.log("Marinade integration enabled:", txSig);

    await airdrop(
      glamClient.provider.connection,
      stateData.vaultPda,
      100_000_000_000,
    );
  });

  it("Marinade desposit: stake 20 SOL", async () => {
    try {
      const tx = await glamClient.marinade.depositSol(
        statePda,
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
        statePda,
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
          statePda,
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
    const tickets = await glamClient.marinade.getExistingTickets(statePda);
    console.log(
      "Tickets:",
      tickets.map((t) => t.toBase58()),
    );
    expect(tickets.length).toBe(5);

    const stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.externalVaultAccounts.length).toBe(tickets.length);
    expect(stateModel.externalVaultAccounts.sort()).toEqual(tickets.sort());
  });

  it("Claim tickets", async () => {
    // wait for 30s so that the ticket is ready to be claimed
    await sleep(30_000);
    const tickets = await glamClient.marinade.getExistingTickets(statePda);
    try {
      const tx = await glamClient.marinade.claimTickets(statePda, tickets);
      console.log("Claim tickets:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 45_000);

  it("Check tickets after claim", async () => {
    const tickets = await glamClient.marinade.getExistingTickets(statePda);
    expect(tickets.length).toBe(0);

    const stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.externalVaultAccounts.length).toBe(tickets.length);
    expect(stateModel.externalVaultAccounts.sort()).toEqual(tickets.sort());
  });

  // FIXME: For some reason, depositStake test must be run after the claimTickets test
  // Otherwise, cliamTickets test hangs forever
  it("Natively stake 10 SOL to a validator", async () => {
    try {
      const txSig = await glamClient.staking.initializeAndDelegateStake(
        statePda,
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
      glamClient.getVaultPda(statePda),
    );
    expect(stakeAccounts.length).toEqual(1);

    try {
      await glamClient.marinade.depositStake(statePda, stakeAccounts[0]);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });
});
