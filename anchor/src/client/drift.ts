import { BN } from "@coral-xyz/anchor";
import { PublicKey, Transaction, TransactionSignature } from "@solana/web3.js";

import { BaseClient } from "./base";

export class DriftClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async exampleMethod(
    fund: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    return await this.exampleMethodTxBuilder(
      fund,
      this.base.getManager(),
      amount
    ).rpc();
  }

  /*
   * Tx Builders
   */

  public exampleMethodTxBuilder(
    fund: PublicKey,
    manager: PublicKey,
    amount: BN
  ): any /* MethodsBuilder<Glam, ?> */ {
    const treasury = this.base.getTreasuryPDA(fund);

    return this.base.program.methods
      .initializeFund(this.base.getFundModel({})) //TODO: replace with method
      .accounts({
        //@ts-ignore IDL ts type is unhappy
        fund,
        treasury,
        manager,
      });
  }

  /*
   * API methods
   */

  public async exampleMethodTx(
    fund: PublicKey,
    manager: PublicKey,
    amount: BN
  ): Promise<Transaction> {
    return await this.exampleMethodTxBuilder(
      fund,
      manager,
      amount
    ).transaction();
  }
}
