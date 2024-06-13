import * as anchor from "@coral-xyz/anchor";
import {
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
  VersionedTransaction,
  ConfirmOptions
} from "@solana/web3.js";
import { GlamClient } from "../src/client";

/**
 * This test suite is a demonstration of how to interact with the glam API.
 *
 * Before running this test suite, make sure you [provider] is correclty set up in Anchor.toml:
 * 1) cluster: set to "mainnet-beta"
 * 2) wallet: set to the path of the manager wallet
 *
 * To run the tests (optional to skip build, must skip deploy):
 *  anchor test --skip-build --skip-deploy
 */

const API = "https://api.glam.systems";
const wsol = new PublicKey("So11111111111111111111111111111111111111112");
const msol = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");
const manager = "gLJHKPrZLGBiBZ33hFgZh6YnsEhTVxuRT17UCqNp6ff";
const fund = "4gAcSdfSAxVPcxj2Hi3AvKKViGat3iUysDD5ZzbqhDTk";
const confirmOptions: ConfirmOptions = {
  commitment: "confirmed",
  maxRetries: 3
};

describe("glam_api_tx", () => {
  const glamClient = new GlamClient();

  it("Wrap 0.001 sol", async () => {
    const response = await fetch(`${API}/tx/wsol/wrap`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manager, fund, amount: 1000000 })
    });
    const { tx } = await response.json();
    console.log("Wrap tx:", tx);

    try {
      const txId = await sendAndConfirmTransaction(
        glamClient.provider.connection,
        Transaction.from(Buffer.from(tx, "hex")),
        [glamClient.getWalletSigner()],
        confirmOptions
      );
      console.log("Wrap txId:", txId);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 30_000);

  it("Unwrap wsol", async () => {
    const response = await fetch(`${API}/tx/wsol/unwrap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manager, fund })
    });
    const { tx } = await response.json();
    console.log("Unwrap tx", tx);

    try {
      const txId = await sendAndConfirmTransaction(
        glamClient.provider.connection,
        Transaction.from(Buffer.from(tx, "hex")),
        [glamClient.getWalletSigner()],
        confirmOptions
      );
      console.log("Unwrap txId:", txId);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 30_000);

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
          maxAccounts: 20
        }
      })
    });
    const { tx } = await response.json();
    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "hex"));
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
    const quoteParams: any = {
      inputMint: msol.toBase58(),
      outputMint: wsol.toBase58(),
      amount: 50000000,
      autoSlippage: true,
      autoSlippageCollisionUsdValue: 1000,
      swapMode: "ExactIn",
      onlyDirectRoutes: false,
      asLegacyTransaction: false,
      maxAccounts: 20
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
        quoteResponse
      })
    });

    const { tx } = await response.json();
    console.log("tx", tx);

    const vTx = VersionedTransaction.deserialize(Buffer.from(tx, "hex"));
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

  it("Stake 0.1 sol", async () => {
    const response = await fetch(`${API}/tx/marinade/stake`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manager, fund, amount: 100000000 })
    });
    const { tx } = await response.json();
    console.log("Stake tx:", tx);

    try {
      const txId = await sendAndConfirmTransaction(
        glamClient.provider.connection,
        Transaction.from(Buffer.from(tx, "hex")),
        [glamClient.getWalletSigner()],
        confirmOptions
      );
      console.log("Stake txId:", txId);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 30_000);

  //
  // Uncomment the following tests if you want to perform delayed unstake in mainnet
  //
  /*
  it("Order unstake 0.01 msol", async () => {
    const response = await fetch(`${API}/tx/marinade/unstake`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manager, fund, amount: 10000000 })
    });
    const { tx } = await response.json();
    console.log("Order unstake tx:", tx);

    try {
      const txId = await sendAndConfirmTransaction(
        glamClient.provider.connection,
        Transaction.from(Buffer.from(tx, "hex")),
        [glamClient.getWalletSigner()],
        confirmOptions
      );
      console.log("Order unstake txId:", txId);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 30_000);

  it("Claim ticket", async () => {
    await sleep(30_000);

    const response = await fetch(`${API}/tx/marinade/unstake/claim`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ manager, fund })
    });
    const { tx } = await response.json();
    console.log("Claim tx:", tx);

    try {
      const txId = await sendAndConfirmTransaction(
        glamClient.provider.connection,
        Transaction.from(Buffer.from(tx, "hex")),
        [glamClient.getWalletSigner()],
        confirmOptions
      );
      console.log("Claim txId:", txId);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 35_000);
  */
});
