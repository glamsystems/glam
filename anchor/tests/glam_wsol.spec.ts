import * as anchor from "@coral-xyz/anchor";

import { airdrop, createGlamStateForTest } from "./setup";
import { GlamClient, WSOL } from "../src";
import { createSyncNativeInstruction } from "@solana/spl-token";

describe("glam_wsol", () => {
  const glamClient = new GlamClient();
  let glamState;

  it("Create vault", async () => {
    const stateData = await createGlamStateForTest(glamClient);
    glamState = stateData.statePda;

    await airdrop(
      glamClient.provider.connection,
      glamClient.getVaultPda(glamState),
      100_000_000,
    );
  });

  it("wSOL wrap", async () => {
    try {
      let tx = await glamClient.wsol.wrap(glamState, new anchor.BN(30_000_000));
      console.log("Wrap #1:", tx);

      tx = await glamClient.wsol.wrap(glamState, new anchor.BN(20_000_000));
      console.log("Wrap #2:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }

    const wsolBalance = await glamClient.getVaultTokenBalance(glamState, WSOL);
    expect(wsolBalance).toEqual(0.05);
  }, 15_000);

  it("Transfer sol to wsol", async () => {
    const syncNativeIx = createSyncNativeInstruction(
      glamClient.getVaultAta(glamState, WSOL),
    );
    try {
      let tx = await glamClient.program.methods
        .transferSolToWsol(new anchor.BN(50_000_000))
        .accounts({ glamState })
        .postInstructions([syncNativeIx])
        .rpc();
      console.log("Transfer sol:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }

    const wsolBalance = await glamClient.getVaultTokenBalance(glamState, WSOL);
    expect(wsolBalance).toEqual(0.1);
  });

  it("wSOL unwrap", async () => {
    try {
      const tx = await glamClient.wsol.unwrap(glamState);
      console.log("Unwrap:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }

    const wsolBalance = await glamClient.getVaultTokenBalance(glamState, WSOL);
    expect(wsolBalance).toEqual(0);
  });
});
