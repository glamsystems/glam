import * as anchor from "@coral-xyz/anchor";
import {
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
  VersionedTransaction,
  ConfirmOptions,
} from "@solana/web3.js";
import { GlamClient } from "../src/client";
import { createFundForTest, sleep } from "./setup";

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

const API = "http://localhost:8080";
// const API = "https://api.glam.systems";
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
        1_000_000_000
      );
      await glamClient.provider.connection.confirmTransaction(airdrop);
      // override default fund addresses
      fund = fundData.fundPDA;
      manager = glamClient.getManager();
    }
  });

  it("Wrap 0.001 sol", async () => {
    const response = await fetch(`${API}/tx/wsol/wrap`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manager, fund, amount: 1000000 }),
    });
    const { tx } = await response.json();
    console.log("Wrap tx:", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await (
        glamClient.provider as anchor.AnchorProvider
      ).sendAndConfirm(vTx, [glamClient.getWalletSigner()], confirmOptions);
      console.log("jupiter swap txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
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
      const txId = await (
        glamClient.provider as anchor.AnchorProvider
      ).sendAndConfirm(vTx, [glamClient.getWalletSigner()], confirmOptions);
      console.log("jupiter swap txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }, 30_000);

  it("Stake 0.1 sol", async () => {
    const response = await fetch(`${API}/tx/marinade/stake`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manager, fund, amount: 100000000 }),
    });
    const { tx } = await response.json();
    console.log("Stake tx:", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await (
        glamClient.provider as anchor.AnchorProvider
      ).sendAndConfirm(vTx, [glamClient.getWalletSigner()], confirmOptions);
      console.log("jupiter swap txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }, 30_000);

  it("Order unstake 0.01 msol", async () => {
    const response = await fetch(`${API}/tx/marinade/unstake`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manager, fund, amount: 10000000 }),
    });
    const { tx } = await response.json();
    console.log("Order unstake tx:", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await (
        glamClient.provider as anchor.AnchorProvider
      ).sendAndConfirm(vTx, [glamClient.getWalletSigner()], confirmOptions);
      console.log("jupiter swap txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }, 30_000);

  it("Claim ticket", async () => {
    await sleep(30_000);

    const { tickets } = await (
      await fetch(`${API}/fund/${fund}/tickets`)
    ).json();

    const response = await fetch(`${API}/tx/marinade/unstake/claim`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manager, fund, ticket: tickets[0] }),
    });
    const { tx } = await response.json();
    console.log("Claim tx:", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await (
        glamClient.provider as anchor.AnchorProvider
      ).sendAndConfirm(vTx, [glamClient.getWalletSigner()], confirmOptions);
      console.log("jupiter swap txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }, 35_000);

  /*
  it("Jupiter swap with quote params", async () => {
    const response = await fetch(`${API}/tx/jupiter/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fund,
        manager,
        quote: {
          inputMint: wsol.toBase58(),
          outputMint: msol.toBase58(),
          amount: 10000000,
          autoSlippage: true,
          autoSlippageCollisionUsdValue: 1000,
          swapMode: "ExactIn",
          onlyDirectRoutes: false,
          asLegacyTransaction: false,
          maxAccounts: 20,
        },
      }),
    });
    const { tx } = await response.json();
    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await (
        glamClient.provider as anchor.AnchorProvider
      ).sendAndConfirm(vTx, [glamClient.getWalletSigner()], confirmOptions);
      console.log("jupiter swap txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }, 60_000);

  it("Jupiter swap with quote response", async () => {
    const amount = 1_000_000;
    const quoteParams: any = {
      inputMint: wsol.toBase58(),
      outputMint: msol.toBase58(),
      amount,
      autoSlippage: true,
      autoSlippageCollisionUsdValue: 1000,
      swapMode: "ExactIn",
      onlyDirectRoutes: false,
      asLegacyTransaction: false,
      maxAccounts: 20,
    };
    const quoteResponse = await (
      await fetch(
        `${glamClient.jupiterApi}/quote?${new URLSearchParams(
          Object.entries(quoteParams)
        )}`
      )
    ).json();

    console.log("quoteResponse", quoteResponse);

    const response = await fetch(`${API}/tx/jupiter/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fund,
        manager,
        quoteResponse,
      }),
    });

    const { tx } = await response.json();
    console.log("tx", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await (
        glamClient.provider as anchor.AnchorProvider
      ).sendAndConfirm(vTx, [glamClient.getWalletSigner()], confirmOptions);
      console.log("jupiter swap txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }, 60_000);

  it("Jupiter swap with swap instructions", async () => {
    const amount = 1_000_000;
    const quoteParams: any = {
      inputMint: wsol.toBase58(),
      outputMint: msol.toBase58(),
      amount,
      autoSlippage: true,
      autoSlippageCollisionUsdValue: 1000,
      swapMode: "ExactIn",
      onlyDirectRoutes: false,
      asLegacyTransaction: false,
      maxAccounts: 20,
    };
    const quoteResponse = await (
      await fetch(
        `${glamClient.jupiterApi}/quote?${new URLSearchParams(
          Object.entries(quoteParams)
        )}`
      )
    ).json();
    const swapInstructions = await (
      await fetch(`${glamClient.jupiterApi}/swap-instructions`, {
        method: "POST",
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: manager,
          destinationTokenAccount: treasuryMSolAta,
        }),
      })
    ).json();

    console.log("swapInstructions", swapInstructions);

    const response = await fetch(`${API}/tx/jupiter/swap/ix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fund,
        manager,
        amount,
        inputMint: wsol.toBase58(),
        outputMint: msol.toBase58(),
        ...swapInstructions,
      }),
    });

    const { tx } = await response.json();
    console.log("tx", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "base64"));
    try {
      const txId = await (
        glamClient.provider as anchor.AnchorProvider
      ).sendAndConfirm(vTx, [glamClient.getWalletSigner()], confirmOptions);
      console.log("jupiter swap txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }, 60_000);
 */
});
