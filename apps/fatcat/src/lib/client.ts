import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { GlamClient } from "@glamsystems/glam-sdk";

const JUP = new PublicKey("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN");
const FATCAT_SERVICE = new PublicKey(
  "FATCaTCr4uhXZBLQFe6FVtzpF4L8ezypGh4CuQqzRR6B",
);

export class Client extends GlamClient {
  public constructor(connection: any, wallet: any) {
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
      //@ts-ignore
      integrations: [{ jupiterVote: {} }],
      delegateAcls: [
        {
          pubkey: FATCAT_SERVICE,
          permissions: [{ voteOnProposal: {} }],
        },
      ],
    });
    stateModel.metadataUri = null;

    // default pda
    const state = this.getStatePda(stateModel);

    return { state, stateModel, name };
  };

  stakeJup = async (amount: number) => {
    const { state, stateModel, name } = this.getFatcatState();
    const vault = this.getVaultPda(state);
    const amountBN = new BN(amount * 1_000_000); // 6 decimals
    let preInstructions = [];

    // try to fetch the state account
    // if it doesn't exist, add pre instruction to create it
    try {
      //@ts-ignore
      await this.fetchStateAccount(state);
    } catch (error) {
      // state does not exist - create it
      console.log(`+ Creating vault ${name}`);

      //@ts-ignore
      const initStateIx = await this.program.methods
        .initializeState(stateModel)
        .accountsPartial({
          state,
        })
        .instruction();

      preInstructions.push(initStateIx);

      // preInstructions.push(
      //   SystemProgram.transfer({
      //     fromPubkey: this.getSigner(),
      //     toPubkey: vault,
      //     lamports: 10_000_000,
      //   }),
      // );
    }

    // add instrustions to create vault ATA and transfer JUP to vault
    console.log(`+ Transfering ${amount} JUP to vault`);
    const vaultAta = this.getVaultAta(state, JUP);
    const signer = this.getSigner();
    const signerAta = this.getAta(JUP, signer);

    preInstructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        signer,
        vaultAta,
        vault,
        JUP,
      ),
    );
    preInstructions.push(
      createTransferCheckedInstruction(
        signerAta,
        JUP,
        vaultAta,
        signer,
        amountBN.toNumber(),
        6,
        [],
        TOKEN_PROGRAM_ID,
      ),
    );

    // prepare the staking transaction
    console.log(`+ Staking ${amount} JUP`);
    return await this.jupiter.stakeJup(state, amountBN, {
      preInstructions,
    });
  };

  unstakeJup = async (amount: number) => {
    const { state } = this.getFatcatState();
    const amountBN = new BN(amount * 1_000_000); // 6 decimals

    if (false) {
      // partial unstake
    } else {
      // full unstake
      return await this.jupiter.unstakeJup(state);
    }
  };
}
