import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
} from "@solana/web3.js";

import { BaseClient, ApiTxOptions } from "./base";
import { WSOL } from "../constants";

export class WSolClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async wrap(
    fund: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const tx = await this.wrapTx(fund, amount, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async unwrap(fund: PublicKey): Promise<TransactionSignature> {
    const tx = await this.unwrapTx(fund, {});
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * API methods
   */

  public async wrapTx(
    fund: PublicKey,
    amount: BN,
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);
    const treasuryWsolAta = this.base.getTreasuryAta(fund, WSOL);

    const tx = await this.base.program.methods
      .wsolWrap(amount)
      .accounts({
        fund,
        treasury,
        treasuryWsolAta,
        wsolMint: WSOL,
        signer: manager,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  public async unwrapTx(
    fund: PublicKey,
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);
    const treasuryWsolAta = this.base.getTreasuryAta(fund, WSOL);

    const tx = await this.base.program.methods
      .wsolUnwrap()
      .accounts({
        fund,
        treasury,
        treasuryWsolAta,
        wsolMint: WSOL,
        signer: manager,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }
}
