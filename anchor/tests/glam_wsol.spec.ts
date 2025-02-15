import * as anchor from "@coral-xyz/anchor";

import { airdrop, createGlamStateForTest } from "./setup";
import { GlamClient } from "../src";

describe("glam_wsol", () => {
  const glamClient = new GlamClient();
  let statePda;

  it("Create fund", async () => {
    const stateData = await createGlamStateForTest(glamClient);
    statePda = stateData.statePda;

    await airdrop(
      glamClient.provider.connection,
      glamClient.getVaultPda(statePda),
      100_000_000,
    );
  });

  it("wSOL wrap", async () => {
    try {
      let tx = await glamClient.wsol.wrap(statePda, new anchor.BN(30_000_000));
      console.log("Wrap #1:", tx);

      tx = await glamClient.wsol.wrap(statePda, new anchor.BN(20_000_000));
      console.log("Wrap #2:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 15_000);

  it("wSOL unwrap", async () => {
    try {
      const tx = await glamClient.wsol.unwrap(statePda);
      console.log("Unwrap:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });
});
