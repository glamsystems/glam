import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
  Keypair,
} from "@solana/web3.js";

import { BaseClient, ApiTxOptions } from "./base";

const wsolMint = new PublicKey("So11111111111111111111111111111111111111112");

export class WSolClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async wrap(
    fund: PublicKey,
    amount: BN,
    signer?: Keypair
  ): Promise<TransactionSignature> {
    const tx = await this.wrapTx(fund, amount, { signer: signer?.publicKey });
    return await this.base.sendAndConfirm(tx, signer);
  }

  public async unwrap(
    fund: PublicKey,
    signer?: Keypair
  ): Promise<TransactionSignature> {
    const tx = await this.unwrapTx(fund, { signer: signer?.publicKey });
    return await this.base.sendAndConfirm(tx, signer);
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
    const treasuryWsolAta = this.base.getTreasuryAta(fund, wsolMint);

    const tx = await this.base.program.methods
      .wsolWrap(amount)
      .accounts({
        fund,
        treasury,
        treasuryWsolAta,
        wsolMint,
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
    const treasuryWsolAta = this.base.getTreasuryAta(fund, wsolMint);

    const tx = await this.base.program.methods
      .wsolUnwrap()
      .accounts({
        fund,
        treasury,
        treasuryWsolAta,
        wsolMint,
        signer: manager,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }
}
