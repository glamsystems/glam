import * as anchor from "@coral-xyz/anchor";
import {
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import { GlamClient } from "../src/client";

const API = "https://api.glam.systems";

describe("glam_api_tx", () => {
  const glamClient = new GlamClient();

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
});
