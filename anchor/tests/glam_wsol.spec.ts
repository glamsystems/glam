import * as anchor from "@coral-xyz/anchor";
import {
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import { createFundForTest, sleep } from "./setup";
import { GlamClient } from "../src";

describe("glam_wsol", () => {
  const glamClient = new GlamClient();
  let fundPDA;

  it("Create fund", async () => {
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const connection = glamClient.provider.connection;
    // transfer 0.1 SOL to treasury
    const tranferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: glamClient.getManager(),
        toPubkey: glamClient.getTreasuryPDA(fundPDA),
        lamports: 100_000_000,
      })
    );
    await glamClient.sendAndConfirm(tranferTx);
  });

  it("wSOL wrap", async () => {
    try {
      let tx = await glamClient.wsol.wrap(fundPDA, new anchor.BN(30_000_000));
      console.log("Wrap #1:", tx);

      tx = await glamClient.wsol.wrap(fundPDA, new anchor.BN(20_000_000));
      console.log("Wrap #2:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });

  it("wSOL unwrap", async () => {
    try {
      const tx = await glamClient.wsol.unwrap(fundPDA);
      console.log("Unwrap:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });
});
