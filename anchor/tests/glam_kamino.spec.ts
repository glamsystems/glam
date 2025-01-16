import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { BN, Wallet } from "@coral-xyz/anchor";

import {
  airdrop,
  createGlamStateForTest,
  stateModelForTest,
  str2seed,
} from "./setup";
import {
  StateModel,
  GlamClient,
  GlamError,
  MSOL,
  ShareClassModel,
  USDC,
  WSOL,
} from "../src";
import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";

const KaminoProgramId = new PublicKey(
  "KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD",
);

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
  });

  it("Init kamino user metadata", async () => {
    const [userMetadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_meta"), vaultPda.toBuffer()],
      KaminoProgramId,
    );
    console.log("vaultPda", vaultPda.toBase58());
    console.log("Kamino userMetadataPda for vault", userMetadataPda.toBase58());

    try {
      const tx = await glamClient.program.methods
        .initUserMetadata(new PublicKey(0))
        .accounts({
          glamState: statePda,
          owner: vaultPda,
          userMetadata: userMetadataPda,
          referrerUserMetadata: KaminoProgramId,
        })
        .rpc();
      console.log("Init user metadata:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });
});
