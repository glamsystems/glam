import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
} from "@solana/web3.js";
import { BaseClient, TxOptions } from "./base";

export class ShareClassClient {
  public constructor(readonly base: BaseClient) {}

  public async closeShareClass(
    fundPDA: PublicKey,
    shareClassId: number = 0,
    txOptions: TxOptions = {}
  ) {
    const openfunds = this.base.getOpenfundsPDA(fundPDA);
    const shareClassMint = this.base.getShareClassPDA(fundPDA, shareClassId);

    return await this.base.program.methods
      .closeShareClass(shareClassId)
      .accounts({
        fund: fundPDA,
        openfunds,
        shareClassMint,
      })
      .rpc();
  }
}
