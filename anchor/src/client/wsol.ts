import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
} from "@solana/web3.js";

import { BaseClient, TxOptions } from "./base";
import { WSOL } from "../constants";

export class WSolClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async wrap(
    statePda: PublicKey,
    amount: BN,
    txOptions: TxOptions = {} as TxOptions,
  ): Promise<TransactionSignature> {
    const tx = await this.wrapTx(statePda, amount, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  public async unwrap(
    statePda: PublicKey,
    txOptions: TxOptions = {} as TxOptions,
  ): Promise<TransactionSignature> {
    const tx = await this.unwrapTx(statePda, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * API methods
   */

  public async wrapTx(
    statePda: PublicKey,
    amount: BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(statePda);
    const vaultWsolAta = this.base.getVaultAta(statePda, WSOL);

    // @ts-ignore
    const tx = await this.base.program.methods
      .wsolWrap(amount)
      .accountsPartial({
        state: statePda,
        vault,
        vaultWsolAta,
        wsolMint: WSOL,
        signer,
      })
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async unwrapTx(
    statePda: PublicKey,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(statePda);
    const vaultWsolAta = this.base.getVaultAta(statePda, WSOL);

    const tx = await this.base.program.methods
      .wsolUnwrap()
      .accountsPartial({
        state: statePda,
        vault,
        vaultWsolAta,
        wsolMint: WSOL,
        signer,
      })
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }
}
