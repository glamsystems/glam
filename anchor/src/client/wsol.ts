import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, Transaction, TransactionSignature } from "@solana/web3.js";

import { BaseClient } from "./base";

const wsolMint = new PublicKey("So11111111111111111111111111111111111111112");

export class WSolClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async wrap(
    fund: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    return await this.wrapTxBuilder(fund, this.base.getManager(), amount).rpc();
  }

  public async unwrap(fund: PublicKey): Promise<TransactionSignature> {
    return await this.unwrapTxBuilder(fund, this.base.getManager()).rpc();
  }

  /*
   * Tx Builders
   */

  public wrapTxBuilder(
    fund: PublicKey,
    manager: PublicKey,
    amount: BN
  ): any /* MethodsBuilder<Glam, ?> */ {
    const treasury = this.base.getTreasuryPDA(fund);
    const treasuryWsolAta = this.base.getTreasuryAta(fund, wsolMint);

    return this.base.program.methods.wsolWrap(amount).accounts({
      fund,
      treasury,
      treasuryWsolAta,
      wsolMint,
      manager
    });
  }

  public unwrapTxBuilder(
    fund: PublicKey,
    manager: PublicKey
  ): any /* MethodsBuilder<Glam, ?> */ {
    const treasury = this.base.getTreasuryPDA(fund);
    const treasuryWsolAta = this.base.getTreasuryAta(fund, wsolMint);

    return this.base.program.methods.wsolUnwrap().accounts({
      fund,
      treasury,
      treasuryWsolAta,
      wsolMint,
      manager
    });
  }

  /*
   * API methods
   */

  public async wrapTx(
    fund: PublicKey,
    manager: PublicKey,
    amount: BN
  ): Promise<Transaction> {
    return await this.wrapTxBuilder(fund, manager, amount).transaction();
  }

  public async unwrapTx(
    fund: PublicKey,
    manager: PublicKey
  ): Promise<Transaction> {
    return await this.unwrapTxBuilder(fund, manager).transaction();
  }
}
