import * as anchor from "@coral-xyz/anchor";

import { createFundForTest, sleep } from "./setup";
import { GlamClient } from "../src";
import { PublicKey } from "@solana/web3.js";

const msol = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");

describe("glam_staking", () => {
  const glamClient = new GlamClient();
  let fundPDA;
  it("Create fund", async () => {
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const connection = glamClient.provider.connection;
    // air drop to treasury and delay 1s for confirmation
    const airdropTx = await connection.requestAirdrop(
      fundData.treasuryPDA,
      100_000_000_000
    );
    await connection.confirmTransaction({
      ...(await connection.getLatestBlockhash()),
      signature: airdropTx
    });
  });

  it("Marinade desposit", async () => {
    try {
      let tx = await glamClient.marinade.stake(fundPDA, new anchor.BN(1e10));
      console.log("Stake #1:", tx);

      tx = await glamClient.marinade.stake(fundPDA, new anchor.BN(1e10));
      console.log("Stake #2:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });

  it("Liquid unstake", async () => {
    try {
      const tx = await glamClient.marinade.liquidUnstake(
        fundPDA,
        new anchor.BN(1e9)
      );
      console.log("Liquid unstake:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });

  it("Order unstake", async () => {
    try {
      let tx = await glamClient.marinade.delayedUnstake(
        fundPDA,
        0,
        new anchor.BN(1e9)
      );
      console.log("Delayed unstake #0:", tx);

      tx = await glamClient.marinade.delayedUnstake(
        fundPDA,
        1,
        new anchor.BN(1e9)
      );
      console.log("Delayed unstake #1:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });

  it("Search tickets before claim", async () => {
    const tickets = await glamClient.marinade.getExistingTickets(fundPDA);
    console.log("Tickets", tickets);
    expect(tickets.length).toBe(2);
  });

  it("Claim ticket #0", async () => {
    // wait for 30s so that the ticket is ready to be claimed
    await sleep(30_000);
    const tickets = await glamClient.marinade.getExistingTickets(fundPDA);
    try {
      const tx = await glamClient.marinade.delayedUnstakeClaim(
        fundPDA,
        tickets[0]
      );
      console.log("Claim delayed unstake:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 35_000);

  it("Claim ticket #1", async () => {
    const tickets = await glamClient.marinade.getExistingTickets(fundPDA);
    expect(tickets.length).toBe(1);

    try {
      const tx = await glamClient.marinade.delayedUnstakeClaim(
        fundPDA,
        tickets[0]
      );
      console.log("Claim delayed unstake:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 35_000);

  it("Search tickets after claim", async () => {
    const tickets = await glamClient.marinade.getExistingTickets(fundPDA);
    expect(tickets.length).toBe(0);
  });
});
