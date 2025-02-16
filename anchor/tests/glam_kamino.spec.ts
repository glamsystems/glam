import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { airdrop, createGlamStateForTest } from "./setup";
import { GlamClient } from "../src";

describe("glam_kamino", () => {
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
      integrations: [{ kaminoLending: {} }],
    });

    await glamClient.wsol.wrap(statePda, new BN(1_000_000_000));
  });

  it("Init kamino user metadata", async () => {
    try {
      const txSig = await glamClient.kaminoLending.initialize(statePda);
      console.log("init Kamino txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
