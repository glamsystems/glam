import * as anchor from "@coral-xyz/anchor";
import {
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
  VersionedTransaction
} from "@solana/web3.js";
import { GlamClient } from "../src/client";

// const API = "https://api.glam.systems";
const API = "http://localhost:8080";
const wsol = new PublicKey("So11111111111111111111111111111111111111112");
const msol = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");
const manager = "gLJHKPrZLGBiBZ33hFgZh6YnsEhTVxuRT17UCqNp6ff";
const fund = "4gAcSdfSAxVPcxj2Hi3AvKKViGat3iUysDD5ZzbqhDTk";

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
        [glamClient.getWalletSigner()]
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
        [glamClient.getWalletSigner()]
      );
      console.log("Unwrap txId:", txId);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 30_000);

  it("Jupiter swap", async () => {
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
      ).sendAndConfirm(vTx, [glamClient.getWalletSigner()]);
      console.log("jupiter swap txId", txId);
    } catch (error) {
      console.error("Error", error);
      throw error;
    }
  }, 30_000);
});
