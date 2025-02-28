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
    glamState: PublicKey,
    amount: BN,
    txOptions: TxOptions = {} as TxOptions,
  ): Promise<TransactionSignature> {
    const tx = await this.wrapTx(glamState, amount, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  public async unwrap(
    glamState: PublicKey,
    txOptions: TxOptions = {} as TxOptions,
  ): Promise<TransactionSignature> {
    const tx = await this.unwrapTx(glamState, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * API methods
   */

  public async wrapTx(
    glamState: PublicKey,
    amount: BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const vaultWsolAta = this.base.getVaultAta(glamState, WSOL);

    const tx = await this.base.program.methods
      .wsolWrap(amount)
      .accountsPartial({ glamState, glamSigner, vaultWsolAta, wsolMint: WSOL })
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async unwrapTx(
    glamState: PublicKey,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();

    const tx = await this.base.program.methods
      .wsolUnwrap()
      .accounts({ glamState, glamSigner })
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }
}
