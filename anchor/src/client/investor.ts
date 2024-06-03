import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionSignature,
  VersionedTransaction
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createSyncNativeInstruction
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
    // share class token to receive
    const shareClass = this.base.getShareClassPDA(fund, shareClassId);
    const signerShareAta = this.base.getShareClassAta(signer, shareClass);

    // asset token to transfer
    const assetMeta = this.base.getAssetMeta(asset.toBase58());
    const treasury = this.base.getTreasuryPDA(fund);
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

    // remaining accounts = treasury atas + pricing to compute AUM
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
        {
          pubkey: assetMeta.pricingAccount,
          isSigner: false,
          isWritable: false
        }
      ];
    });

    // SOL -> wSOL
    // If the user doesn't have enough wSOL but does have SOL, we auto wrap
    let preInstructions = [];
    if (asset.toBase58() === "So11111111111111111111111111111111111111112") {
      const connection = this.base.provider.connection;
      let wsolBalance = new BN(0);
      try {
        wsolBalance = new BN(
          (await connection.getTokenAccountBalance(signerAssetAta)).value.amount
        );
      } catch (err) {
        // ignore
      }
      const solBalance = new BN(String(await connection.getBalance(signer)));
      const delta = amount - wsolBalance;
      if (delta > 0 && solBalance > delta) {
        preInstructions = preInstructions.concat([
          createAssociatedTokenAccountInstruction(
            signer,
            signerAssetAta,
            signer,
            asset
          ),
          SystemProgram.transfer({
            fromPubkey: signer,
            toPubkey: signerAssetAta,
            lamports: delta
          }),
          createSyncNativeInstruction(signerAssetAta)
        ]);
      }
    }

    // const accountInfo = await this.base.provider.connection.getAccountInfo(
    //   treasuryAta
    // );
    // if (!accountInfo) {
    //   preInstructions.push(
    //     createAssociatedTokenAccountInstruction(
    //       signer,
    //       treasuryAta,
    //       treasury,
    //       asset,
    //       assetMeta?.programId
    //     )
    //   );
    // }

    const tx = await this.base.program.methods
      .subscribe(amount, skipState)
      .accounts({
        fund,
        treasury,
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
      .preInstructions(preInstructions)
      .transaction();

    return await this.base.intoVersionedTransaction(tx, signer);
  }
}
