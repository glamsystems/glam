import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
} from "@solana/web3.js";
import { BaseClient, TxOptions } from "./base";

export class FundClient {
  public constructor(readonly base: BaseClient) {}

  public async closeTokenAccounts(
    fund: PublicKey,
    tokenAccounts: PublicKey[],
    txOptions: TxOptions = {}
  ): Promise<TransactionSignature> {
    const tx = await this.closeTokenAccountsTx(fund, tokenAccounts, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  public async closeTokenAccountsTx(
    fund: PublicKey,
    tokenAccounts: PublicKey[],
    txOptions: TxOptions
  ): Promise<VersionedTransaction> {
    // @ts-ignore
    const tx = await this.base.program.methods
      .closeTokenAccounts()
      .accounts({
        fund,
      })
      .remainingAccounts(
        tokenAccounts.map((account) => ({
          pubkey: account,
          isSigner: false,
          isWritable: true,
        }))
      )
      .transaction();
    return await this.base.intoVersionedTransaction({ tx, ...txOptions });
  }
}
