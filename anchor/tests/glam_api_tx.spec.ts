import * as anchor from "@coral-xyz/anchor";
import {
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  PublicKey,
  VersionedTransaction
} from "@solana/web3.js";
import { GlamClient } from "../src/client";

// const API = "https://api.glam.systems";
const API = "http://localhost:8080";
const wsol = new PublicKey("So11111111111111111111111111111111111111112");
const msol = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");
const usdc = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

describe("glam_api_tx", () => {
  const glamClient = new GlamClient();

  /*
  it("Wrap sol", async () => {
    const response = await fetch(`${API}/tx/wsol/wrap`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        manager: "gLJHKPrZLGBiBZ33hFgZh6YnsEhTVxuRT17UCqNp6ff",
        fund: "4gAcSdfSAxVPcxj2Hi3AvKKViGat3iUysDD5ZzbqhDTk",
        amount: 1000000
      })
    });
    const { tx } = await response.json();
    console.log("Wrap tx:", tx);
    const t = Transaction.from(Buffer.from(tx, "hex"));
    t.sign(glamClient.getWalletSigner());
    try {
      const txId = await glamClient.provider.connection.sendRawTransaction(
        t.serialize()
      );
      console.log("Wrap txId:", txId);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });

  it("unwrap", async () => {
    const response = await fetch(`${API}/tx/wsol/unwrap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        manager: "gLJHKPrZLGBiBZ33hFgZh6YnsEhTVxuRT17UCqNp6ff",
        fund: "4gAcSdfSAxVPcxj2Hi3AvKKViGat3iUysDD5ZzbqhDTk"
      })
    });
    const { tx } = await response.json();
    console.log("unwrap tx", tx);

    const t = Transaction.from(Buffer.from(tx, "hex"));
    t.recentBlockhash = (
      await glamClient.provider.connection.getLatestBlockhash()
    ).blockhash;
    console.log("unwrap recentBlockhash", t.recentBlockhash);
    t.sign(glamClient.getWalletSigner());
    try {
      const txId = await glamClient.provider.connection.sendRawTransaction(
        t.serialize()
      );
      console.log("Wrap txId:", txId);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });
  */

  it("jupiter swap", async () => {
    const response = await fetch(`${API}/tx/jupiter/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fund: "4gAcSdfSAxVPcxj2Hi3AvKKViGat3iUysDD5ZzbqhDTk",
        manager: "gLJHKPrZLGBiBZ33hFgZh6YnsEhTVxuRT17UCqNp6ff",
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
    const { tx, versioned } = await response.json();
    // console.log("is versioned:", versioned, "jupiter swap tx:", tx);

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
