import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_2022_PROGRAM_ID,
  createSyncNativeInstruction,
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

  public async redeem(
    fund: PublicKey,
    amount: BN,
    inKind: boolean = false,
    shareClassId: number = 0,
    skipState: boolean = true,
    user?: Keypair
  ): Promise<TransactionSignature> {
    if (user === undefined) {
      user = this.base.getWalletSigner();
    }
    const tx = await this.redeemTx(
      fund,
      user.publicKey,
      amount,
      inKind,
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
          isWritable: false,
        },
      ];
    });

    // SOL -> wSOL
    // If the user doesn't have enough wSOL but does have SOL, we auto wrap
    let preInstructions: TransactionInstruction[] = [];
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
            lamports: delta,
          }),
          createSyncNativeInstruction(signerAssetAta),
        ]);
      }
    }

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
        token2022Program: TOKEN_2022_PROGRAM_ID,
      })
      .remainingAccounts(remainingAccounts)
      .preInstructions(preInstructions)
      .transaction();

    return await this.base.intoVersionedTransaction(tx, signer);
  }

  public async redeemTx(
    fund: PublicKey,
    signer: PublicKey,
    amount: BN,
    inKind: boolean = false,
    shareClassId: number = 0,
    skipState: boolean = true
  ): Promise<VersionedTransaction> {
    const treasury = this.base.getTreasuryPDA(fund);

    // share class token to receive
    const shareClass = this.base.getShareClassPDA(fund, shareClassId);
    const signerShareAta = this.base.getShareClassAta(signer, shareClass);

    // remaining accounts = assets + signer atas + treasury atas + pricing to compute AUM
    const fundModel = await this.base.fetchFund(fund);
    const remainingAccounts = (fundModel.assets || []).flatMap((asset) => {
      const assetMeta = this.base.getAssetMeta(asset.toBase58());
      const treasuryAta = this.base.getTreasuryAta(
        fund,
        asset,
        assetMeta?.programId
      );
      const signerAta = getAssociatedTokenAddressSync(
        asset,
        signer,
        true,
        assetMeta?.programId
      );

      return [
        { pubkey: asset, isSigner: false, isWritable: false },
        { pubkey: signerAta, isSigner: false, isWritable: true },
        { pubkey: treasuryAta, isSigner: false, isWritable: true },
        {
          pubkey: assetMeta.pricingAccount,
          isSigner: false,
          isWritable: false,
        },
      ];
    });

    const preInstructions = (
      await Promise.all(
        (fundModel.assets || []).map(async (asset, j) => {
          // not in kind, we only need the base asset ATA
          if (!inKind && j > 0) {
            return null;
          }
          // in kind, we need ATAs for all assets with weight > 0
          if (inKind && fundModel.assetsWeights[j] === 0) {
            return null;
          }

          const assetMeta = this.base.getAssetMeta(asset.toBase58());
          const signerAta = getAssociatedTokenAddressSync(
            asset,
            signer,
            true,
            assetMeta?.programId
          );

          const accountInfo =
            await this.base.provider.connection.getAccountInfo(signerAta);
          if (accountInfo) {
            return null;
          }
          return createAssociatedTokenAccountInstruction(
            signer,
            signerAta,
            signer,
            asset,
            assetMeta?.programId
          );
        })
      )
    ).filter((x) => !!x) as TransactionInstruction[];

    const tx = await this.base.program.methods
      .redeem(amount, inKind, skipState)
      .accounts({
        fund,
        treasury,
        shareClass,
        signerShareAta,
        signer,
        token2022Program: TOKEN_2022_PROGRAM_ID,
      })
      .remainingAccounts(remainingAccounts)
      .preInstructions(preInstructions)
      .transaction();

    return await this.base.intoVersionedTransaction(tx, signer);
  }
}
