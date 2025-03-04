import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { airdrop, createGlamStateForTest } from "./setup";
import { GlamClient } from "../src";

const METEORA_DLMM = new PublicKey(
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",
);

describe("glam_meteora", () => {
  const glamClient = new GlamClient();
  let statePda: PublicKey;
  let vaultPda: PublicKey;

  it("Initialize glam state", async () => {
    const stateData = await createGlamStateForTest(glamClient);
    statePda = stateData.statePda;

    const stateModel = await glamClient.fetchState(statePda);
    vaultPda = stateModel.vaultPda;

    await airdrop(
      glamClient.provider.connection,
      stateData.vaultPda,
      10_000_000_000,
    );

    // Enable kamino lending
    await glamClient.state.updateState(statePda, {
      integrations: [{ meteoraDlmm: {} }],
    });

    await glamClient.wsol.wrap(statePda, new BN(1_000_000_000));
  });

  it("Init position", async () => {
    const glamSigner = glamClient.getSigner();

    try {
      const txSig = await glamClient.meteoraDlmm.initializePosition(statePda);
      console.log("init position", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, 15_000);
});
