import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import { GlamClient } from "@glamsystems/glam-sdk";
import { AnchorWallet } from "@solana/wallet-adapter-react";

const JUP = new PublicKey("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN");
const FATCAT_SERVICE_PUBKEY = new PublicKey(
  "FATCaTCr4uhXZBLQFe6FVtzpF4L8ezypGh4CuQqzRR6B",
);
const LOOKUP_TABLE_PUBKEY = new PublicKey(
  "EbPbkJfa66FSD3f4Xa4USZHvfWE644R7zjJ1df5EZ5zH",
);

export class FatcatGlamClient extends GlamClient {
  public constructor(connection: Connection, wallet: AnchorWallet) {
    super({
      provider: new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      }),
    });
  }

  getFatcatState = () => {
    // default name
    const name = "fatcat-" + this.getSigner().toBase58().substring(0, 6);

    // default model with delegated permissions
    const stateModel = this.state.enrichStateModel({
      name,
      assets: [JUP],
      enabled: true,
      accountType: { vault: {} },
      integrations: [{ jupiterVote: {} }],
      delegateAcls: [
        {
          pubkey: FATCAT_SERVICE_PUBKEY,
          permissions: [{ voteOnProposal: {} }],
          expiresAt: new BN(0),
        },
      ],
    });
    stateModel.rawOpenfunds = null;
    stateModel.metadata = null;

    // default pda
    const state = this.getStatePda(stateModel);

    return { state, stateModel, name };
  };

  async stakeJup(amount: number) {
    const { state, stateModel, name } = this.getFatcatState();
    const vault = this.getVaultPda(state);
    const signer = this.getSigner();
    const amountBN = new BN(amount * 1_000_000); // 6 decimals
    let preInstructions = [];

    // try to fetch the state account
    // if it doesn't exist, add pre instruction to create it
    try {
      await this.fetchStateAccount(state);
    } catch (error) {
      // state does not exist - create it
      console.log(`+ Creating vault ${name}`);
      const initStateIx = await this.program.methods
        .initializeState(stateModel)
        .accountsPartial({
          state,
        })
        .instruction();
      preInstructions.push(initStateIx);

      // need some lamports in vault to pay for the creation of the escrow account
      preInstructions.push(
        SystemProgram.transfer({
          fromPubkey: signer,
          toPubkey: vault,
          lamports: 10_000_000,
        }),
      );
    }

    // add instrustions to create vault ATA and transfer JUP to vault
    console.log(`+ Transfering ${amount} JUP to vault`);
    const vaultAta = this.getAta(JUP, vault);
    const signerAta = this.getAta(JUP, signer);

    preInstructions.push(
      ...[
        createAssociatedTokenAccountIdempotentInstruction(
          signer,
          vaultAta,
          vault,
          JUP,
        ),
        createTransferCheckedInstruction(
          signerAta,
          JUP,
          vaultAta,
          signer,
          amountBN.toNumber(),
          6,
        ),
      ],
    );

    const lookupTbleAccount =
      await this.provider.connection.getAddressLookupTable(LOOKUP_TABLE_PUBKEY);
    const lookupTables = lookupTbleAccount.value
      ? [lookupTbleAccount.value]
      : [];

    // prepare the staking transaction
    console.log(`+ Staking ${amount} JUP`);
    return await this.jupiter.stakeJup(state, amountBN, {
      preInstructions,
      lookupTables,
    });
  }

  unstakeJup = async (amount: number) => {
    const { state } = this.getFatcatState();
    const amountBN = new BN(amount * 1_000_000); // 6 decimals

    // TODO: partial unstake
    // always use full unstake for now
    return await this.jupiter.unstakeJup(state);
  };
}
