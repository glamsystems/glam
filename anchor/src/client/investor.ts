import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
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
    fund: PublicKey,
    asset: PublicKey,
    amount: BN,
    shareClassId: number = 0,
    skipState: boolean = true,
    user?: Keypair
  ): Promise<TransactionSignature> {
    if (user === undefined) {
      user = this.base.getWalletSigner();
    }
    const tx = await this.subscribeTx(
      fund,
      user.publicKey,
      asset,
      amount,
      shareClassId,
      skipState
    );
    return await this.base.sendAndConfirm(tx, user);
  }

  /*
   * API methods
   */

  public async subscribeTx(
    fund: PublicKey,
    signer: PublicKey,
    asset: PublicKey,
    amount: BN,
    shareClassId: number = 0,
    skipState: boolean = true
  ): Promise<VersionedTransaction> {
    const shareClass = this.base.getShareClassPDA(fund, shareClassId);
    const signerShareAta = this.base.getShareClassAta(signer, shareClass);
    const assetMeta = this.base.getAssetMeta(asset.toBase58());
    const treasuryAta = this.base.getTreasuryAta(
      fund,
      asset,
      assetMeta?.programId
    );
    const signerAssetAta = getAssociatedTokenAddressSync(
      asset,
      signer,
      true,
      assetMeta?.programId
    );

    const fundModel = await this.base.fetchFund(fund);
    const remainingAccounts = (fundModel.assets || []).flatMap((asset) => {
      const assetMeta = this.base.getAssetMeta(asset.toBase58());
      const treasuryAta = this.base.getTreasuryAta(
        fund,
        asset,
        assetMeta?.programId
      );
      return [
        { pubkey: treasuryAta, isSigner: false, isWritable: false },
        { pubkey: assetMeta.pricingAccount, isSigner: false, isWritable: false }
      ];
    });

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
      .remainingAccounts(remainingAccounts)
      .preInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
      ])
      .transaction();

    return await this.base.intoVersionedTransaction(tx, signer);
  }
}
