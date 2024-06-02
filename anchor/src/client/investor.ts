import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction
} from "@solana/web3.js";
import {
  createMint,
  createAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  mintTo,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getAccount,
  createTransferCheckedInstruction
} from "@solana/spl-token";

import { BaseClient } from "./base";

export class InvestorClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async subscribe(
    user: Keypair,
    fund: PublicKey,
    asset: PublicKey,
    amount: BN,
    shareClassId: number = 0,
    skipState: boolean = true
  ): Promise<TransactionSignature> {
    const tx = await this.subscribeTx(
      user,
      fund,
      asset,
      amount,
      shareClassId,
      skipState
    );
    tx.sign([this.base.getWalletSigner()]);
    return await this.base.provider.connection.sendTransaction(tx);
  }

  /*
   * API methods
   */

  public async subscribeTx(
    user: Keypair,
    fund: PublicKey,
    asset: PublicKey,
    amount: BN,
    shareClassId: number = 0,
    skipState: boolean = true
  ): Promise<VersionedTransaction> {
    const signer = user.publicKey;
    const shareClass = this.base.getShareClassPDA(fund, shareClassId);
    const signerShareAta = this.base.getShareClassAta(signer, shareClass);
    const treasuryAta = this.base.getTreasuryAta(fund, asset);
    const signerAssetAta = getAssociatedTokenAddressSync(asset, signer);

    const tx = await this.base.program.methods
      .subscribe(amount, skipState)
      .accounts({
        fund,
        shareClass,
        signerShareAta,
        asset,
        treasuryAta,
        signerAssetAta,
        signer,
        tokenProgram: TOKEN_PROGRAM_ID,
        token2022Program: TOKEN_2022_PROGRAM_ID
      })
      .transaction();

    const connection = this.base.provider.connection;
    const messageV0 = new TransactionMessage({
      payerKey: signer,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      instructions: tx.instructions
    }).compileToV0Message();

    return new VersionedTransaction(messageV0);
  }
}
