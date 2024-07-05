import * as anchor from "@coral-xyz/anchor";

import { createFundForTest, sleep } from "./setup";
import { GlamClient } from "../src";
import { PublicKey } from "@solana/web3.js";

const msol = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");

describe("glam_marinade", () => {
  const glamClient = new GlamClient();
  let fundPDA;

  it("Create fund with 100 SOLs in treasury", async () => {
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const connection = glamClient.provider.connection;
    const airdropTx = await connection.requestAirdrop(
      fundData.treasuryPDA,
      100_000_000_000
    );
    await connection.confirmTransaction({
      ...(await connection.getLatestBlockhash()),
      signature: airdropTx,
    });
  });

  it("Marinade desposit: stake 20 SOL", async () => {
    try {
      const tx = await glamClient.marinade.stake(fundPDA, new anchor.BN(2e10));
      console.log("Stake 20 SOL:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });

  it("Liquid unstake 1 mSOL", async () => {
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

  it("Order unstake 1 mSOL x5", async () => {
    try {
      for (let i = 0; i < 5; i++) {
        const tx = await glamClient.marinade.delayedUnstake(
          fundPDA,
          new anchor.BN(1e9)
        );
        console.log(`Delayed unstake #${i}:`, tx);
      }
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });

  it("Search tickets before claim", async () => {
    const tickets = await glamClient.marinade.getExistingTickets(fundPDA);
    console.log("Tickets:", tickets);
    expect(tickets.length).toBe(5);
  });

  it("Claim tickets", async () => {
    // wait for 30s so that the ticket is ready to be claimed
    await sleep(30_000);
    const tickets = await glamClient.marinade.getExistingTickets(fundPDA);
    try {
      const tx = await glamClient.marinade.delayedUnstakeClaim(
        fundPDA,
        tickets
      );
      console.log("Claim tickets:", tx);
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
