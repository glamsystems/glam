import * as anchor from "@coral-xyz/anchor";

import { createFundForTest, sleep } from "./setup";
import { GlamClient } from "../src";

describe("glam_wsol", () => {
  const glamClient = new GlamClient();
  let fundPDA;

  it("Create fund", async () => {
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const connection = glamClient.provider.connection;
    // air drop to treasury and delay 1s for confirmation
    const airdropTx = await connection.requestAirdrop(
      fundData.treasuryPDA,
      10_000_000_000
    );
    await connection.confirmTransaction({
      ...(await connection.getLatestBlockhash()),
      signature: airdropTx
    });
  });

  it("wSOL wrap", async () => {
    try {
      let tx = await glamClient.wsol.wrap(
        fundPDA,
        new anchor.BN(3_000_000_000)
      );
      console.log("Wrap #1:", tx);

      tx = await glamClient.wsol.wrap(fundPDA, new anchor.BN(2_000_000_000));
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
