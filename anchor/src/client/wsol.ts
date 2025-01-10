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
    fund: PublicKey,
    amount: BN,
    txOptions: TxOptions = {} as TxOptions,
  ): Promise<TransactionSignature> {
    const tx = await this.wrapTx(fund, amount, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  public async unwrap(
    fund: PublicKey,
    txOptions: TxOptions = {} as TxOptions,
  ): Promise<TransactionSignature> {
    const tx = await this.unwrapTx(fund, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * API methods
   */

  public async wrapTx(
    fund: PublicKey,
    amount: BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(fund);
    const vaultWsolAta = this.base.getVaultAta(fund, WSOL);

    // @ts-ignore
    const tx = await this.base.program.methods
      .wsolWrap(amount)
      .accountsPartial({
        state: fund,
        vault,
        vaultWsolAta,
        wsolMint: WSOL,
        signer,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async unwrapTx(
    fund: PublicKey,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(fund);
    const vaultWsolAta = this.base.getVaultAta(fund, WSOL);

    const tx = await this.base.program.methods
      .wsolUnwrap()
      .accountsPartial({
        state: fund,
        vault,
        vaultWsolAta,
        wsolMint: WSOL,
        signer,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }
}
