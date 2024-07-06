import anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  ConfirmOptions,
} from "@solana/web3.js";
import { GlamClient } from "../src/client";
import {
  createFundForTest,
  quoteResponseForTest,
  swapInstructionsForTest,
  sleep,
} from "./setup";
import { getAccount } from "@solana/spl-token";

/**
 * This test suite demonstrates how to interact with the glam API.
 *
 * Before running this test suite, make sure [provider] is correclty set up in Anchor.toml:
 * 1) cluster: set to "mainnet-beta" or "localnet" depending on API environment
 * 2) wallet: set to the path of the manager wallet
 *
 * To run the tests:
 * 1) mainnet: anchor test --skip-build --skip-deploy (optional to skip build, must skip deploy)
 * 2) localnet: anchor test --detach
 */

// const API = "https://api.glam.systems";
const API = "http://localhost:8080";
const wsol = new PublicKey("So11111111111111111111111111111111111111112");
const msol = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");

// default to mainnet demo fund addresses
let manager = new PublicKey("gLJHKPrZLGBiBZ33hFgZh6YnsEhTVxuRT17UCqNp6ff");
let fund = new PublicKey("4gAcSdfSAxVPcxj2Hi3AvKKViGat3iUysDD5ZzbqhDTk");
let treasuryMSolAta = new PublicKey(
  "GSkYFJBNcnRNgGmC6KgkrGtsy2omk8yf94wTPJtcYNtw"
);

const confirmOptions: ConfirmOptions = {
  commitment: "confirmed",
  maxRetries: 3,
};

describe("glam_api_tx", () => {
  const glamClient = new GlamClient();

  it("Create fund for local tests", async () => {
    if (API === "http://localhost:8080") {
      const fundData = await createFundForTest(glamClient);
      const airdrop = await glamClient.provider.connection.requestAirdrop(
        glamClient.getTreasuryPDA(fundData.fundPDA),
        10_000_000_000
      );
      await glamClient.provider.connection.confirmTransaction(airdrop);
      // override default fund addresses
      fund = fundData.fundPDA;
      manager = glamClient.getManager();
    }
  });

  // Run swap test first as we want to start from a clean state: the treasury should have no wSOL or mSOL ATAs
  it("Jupiter swap end to end", async () => {
    const manager = glamClient.getManager();
    const inputSignerAta = glamClient.getManagerAta(wsol);
    const outputSignerAta = glamClient.getManagerAta(msol);

    let treasuryMsolBefore;
    try {
      treasuryMsolBefore = await getAccount(
        glamClient.provider.connection,
        glamClient.getTreasuryAta(fund, msol)
      );
    } catch (e) {
      treasuryMsolBefore = { amount: BigInt(0) };
    }

    const quoteResponse = quoteResponseForTest;
    const swapInstructions = swapInstructionsForTest(
      manager,
      inputSignerAta,
      outputSignerAta
    );
    // Swap
    const response = await fetch(`${API}/tx/jupiter/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fund,
        manager,
        quoteResponse,
        swapInstructions,
      }),
    });

    const { tx } = await response.json();
    console.log("tx", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await glamClient.sendAndConfirm(vTx);
      console.log("jupiter swap txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }

    // Post-checks: the following accounts should exist and have 0 balance
    const afterAccounts = [
      glamClient.getManagerAta(wsol),
      glamClient.getManagerAta(msol),
    ];
    afterAccounts.forEach(async (account) => {
      try {
        const acc = await getAccount(
          glamClient.provider.connection,
          account,
          "confirmed"
        );
        expect(acc.amount.toString()).toEqual("0");
      } catch (e) {
        throw e;
      }
    });

    // treasury: more mSOL
    const treasuryMsolAfter = await getAccount(
      glamClient.provider.connection,
      glamClient.getTreasuryAta(fund, msol)
    );
    expect(
      (treasuryMsolAfter.amount - treasuryMsolBefore.amount).toString()
    ).toEqual("41795954");
  });

  it("Wrap 1 SOL", async () => {
    let treasuryWsolBefore;
    try {
      treasuryWsolBefore = await getAccount(
        glamClient.provider.connection,
        glamClient.getTreasuryAta(fund, wsol)
      );
    } catch (e) {
      treasuryWsolBefore = { amount: BigInt(0) };
    }

    const response = await fetch(`${API}/tx/wsol/wrap`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manager, fund, amount: 1e9 }),
    });
    const { tx } = await response.json();
    console.log("Wrap tx:", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await glamClient.sendAndConfirm(vTx);
      console.log("Wrap txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }

    // After wrap treasury should have 1 wSOL
    const treasuryWsolAfter = await getAccount(
      glamClient.provider.connection,
      glamClient.getTreasuryAta(fund, wsol)
    );
    expect(
      (treasuryWsolAfter.amount - treasuryWsolBefore.amount).toString()
    ).toEqual("1000000000");
  }, 30_000);

  it("Unwrap wsol", async () => {
    const response = await fetch(`${API}/tx/wsol/unwrap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manager, fund }),
    });
    const { tx } = await response.json();
    console.log("Unwrap tx", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await glamClient.sendAndConfirm(vTx);
      console.log("Unwrap txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }, 30_000);

  it("Stake 0.1 SOL", async () => {
    const response = await fetch(`${API}/tx/marinade/stake`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manager, fund, amount: 100_000_000 }),
    });
    const { tx } = await response.json();
    console.log("Stake tx:", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await glamClient.sendAndConfirm(vTx);
      console.log("Stake txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }, 30_000);

  it("Order unstake #0: 0.01 mSOL", async () => {
    const response = await fetch(`${API}/tx/marinade/unstake`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manager, fund, amount: 20_000_000 }),
    });
    const { tx } = await response.json();
    console.log("Order unstake #0 tx:", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await glamClient.sendAndConfirm(vTx);
      console.log("Order unstake #0 txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }, 30_000);

  it("Order unstake #1: 0.02 mSOL", async () => {
    const response = await fetch(`${API}/tx/marinade/unstake`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manager, fund, amount: 10_000_000 }),
    });
    const { tx } = await response.json();
    console.log("Order unstake #1 tx:", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await glamClient.sendAndConfirm(vTx);
      console.log("Order unstake #1 txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }, 30_000);

  it("Claim tickets", async () => {
    // Before claiming we should have 2 tickets
    const { tickets } = await (
      await fetch(`${API}/fund/${fund}/tickets`)
    ).json();
    expect(tickets.length).toBe(2);

    // Wait for the next epoch
    await sleep(30_000);

    // Claim tickets
    const response = await fetch(`${API}/tx/marinade/unstake/claim`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manager, fund, tickets }),
    });
    const { tx } = await response.json();
    console.log("Claim tickets tx:", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await glamClient.sendAndConfirm(vTx);
      console.log("Claim tickets txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }

    // After claiming we should have 0 tickets
    const { tickets: _tickets } = await (
      await fetch(`${API}/fund/${fund}/tickets`)
    ).json();
    expect(_tickets.length).toBe(0);
  }, 35_000);
});
