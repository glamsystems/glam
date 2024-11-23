import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

import { BaseClient, TxOptions } from "./base";
import { WSOL } from "../constants";
import { FundModel } from "../models";

export class InvestorClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async subscribe(
    fund: PublicKey,
    asset: PublicKey,
    amount: BN,
    // @ts-ignore
    fundModel: FundModel = undefined,
    shareClassId: number = 0,
    skipState: boolean = true,
    txOptions: TxOptions = {}
  ): Promise<TransactionSignature> {
    const tx = await this.subscribeTx(
      fund,
      asset,
      amount,
      fundModel,
      shareClassId,
      skipState,
      txOptions
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async redeem(
    fund: PublicKey,
    amount: BN,
    inKind: boolean = false,
    fundModel: FundModel = undefined,
    shareClassId: number = 0,
    skipState: boolean = true,
    txOptions: TxOptions = {}
  ): Promise<TransactionSignature> {
    const tx = await this.redeemTx(
      fund,
      amount,
      inKind,
      fundModel,
      shareClassId,
      skipState,
      txOptions
    );
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * API methods
   */

  public async subscribeTx(
    fund: PublicKey,
    asset: PublicKey,
    amount: BN,
    fundModel: FundModel = undefined,
    shareClassId: number = 0,
    skipState: boolean = true,
    txOptions: TxOptions
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();

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

    // remaining accounts may have 3 parts:
    // 1. treasury atas + pricing to compute AUM
    // 2. marinade ticket
    // 3. stake accounts
    // @ts-ignore
    if (!fundModel) {
      //@ts-ignore
      fundModel = await this.base.fetchFund(fund);
    }
    let remainingAccounts = (fundModel.assets || []).flatMap((asset: any) => {
      const assetMeta = this.base.getAssetMeta(asset.toBase58());
      const treasuryAta = this.base.getTreasuryAta(
        fund,
        asset,
        assetMeta?.programId
      );

      return [
        { pubkey: treasuryAta, isSigner: false, isWritable: false },
        {
          // For some LSTs we have both state and pricing accounts
          // The program should always prefer the state account
          pubkey: assetMeta.stateAccount || assetMeta.pricingAccount,
          isSigner: false,
          isWritable: false,
        },
      ];
    });

    remainingAccounts = remainingAccounts.concat(
      (fundModel.externalTreasuryAccounts || []).map((address: PublicKey) => ({
        pubkey: address,
        isSigner: false,
        isWritable: false,
      }))
    );

    // SOL -> wSOL
    // If the user doesn't have enough wSOL but does have SOL, we auto wrap
    let preInstructions: TransactionInstruction[] = [
      createAssociatedTokenAccountIdempotentInstruction(
        signer,
        signerAssetAta,
        signer,
        asset,
        assetMeta?.programId
      ),
      createAssociatedTokenAccountIdempotentInstruction(
        signer,
        treasuryAta,
        treasury,
        asset,
        assetMeta?.programId
      ),
      createAssociatedTokenAccountIdempotentInstruction(
        signer,
        signerShareAta,
        signer,
        shareClass,
        TOKEN_2022_PROGRAM_ID
      ),
    ];

    if (WSOL.equals(asset)) {
      const connection = this.base.provider.connection;
      let wsolBalance = new BN(0);
      try {
        wsolBalance = new BN(
          (await connection.getTokenAccountBalance(signerAssetAta)).value.amount
        );
      } catch (err) {
        // ignore
      }
      // const solBalance = new BN(String(await connection.getBalance(signer)));
      const delta = amount.sub(wsolBalance);
      if (delta.gt(new BN(0))) {
        preInstructions = preInstructions.concat([
          SystemProgram.transfer({
            fromPubkey: signer,
            toPubkey: signerAssetAta,
            lamports: delta.toNumber(),
          }),
          createSyncNativeInstruction(signerAssetAta),
        ]);
      }
    }

    const tx = await this.base.program.methods
      .subscribe(amount, skipState)
      .accounts({
        fund,
        shareClass,
        asset,
        treasuryAta,
        signerAssetAta,
        //TODO: only add if the fund has lock-up? (just for efficiency)
        // signerAccountPolicy: null,
        signer,
      })
      .remainingAccounts(remainingAccounts)
      .preInstructions(preInstructions)
      .transaction();

    return await this.base.intoVersionedTransaction({ tx, ...txOptions });
  }

  public async redeemTx(
    fund: PublicKey,
    amount: BN,
    inKind: boolean = false,
    fundModel: FundModel = undefined,
    shareClassId: number = 0,
    skipState: boolean = true,
    txOptions: TxOptions
  ): Promise<VersionedTransaction> {
    const treasury = this.base.getTreasuryPDA(fund);
    const signer = txOptions.signer || this.base.getSigner();

    // share class token to receive
    const shareClass = this.base.getShareClassPDA(fund, shareClassId);
    const signerShareAta = this.base.getShareClassAta(signer, shareClass);

    // remaining accounts = assets + signer atas + treasury atas + pricing to compute AUM
    if (!fundModel) {
      //@ts-ignore
      fundModel = await this.base.fetchFund(fund);
    }
    let remainingAccounts = (fundModel.assets || []).flatMap((asset: any) => {
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
        { pubkey: treasuryAta, isSigner: false, isWritable: true },
        {
          // For some LSTs we have both state and pricing accounts
          // The program should always prefer the state account
          pubkey: assetMeta.stateAccount || assetMeta.pricingAccount,
          isSigner: false,
          isWritable: false,
        },
        { pubkey: asset, isSigner: false, isWritable: false },
        { pubkey: signerAta, isSigner: false, isWritable: true },
      ];
    });

    remainingAccounts = remainingAccounts.concat(
      (fundModel.externalTreasuryAccounts || []).map((address: PublicKey) => ({
        pubkey: address,
        isSigner: false,
        isWritable: false,
      }))
    );

    const preInstructions = (
      await Promise.all(
        (fundModel.assets || []).map(async (asset: any, j: number) => {
          // not in kind, we only need the base asset ATA
          if (!inKind && j > 0) {
            return null;
          }

          const assetMeta = this.base.getAssetMeta(asset.toBase58());
          const signerAta = getAssociatedTokenAddressSync(
            asset,
            signer,
            true,
            assetMeta?.programId
          );

          return createAssociatedTokenAccountIdempotentInstruction(
            signer,
            signerAta,
            signer,
            asset,
            assetMeta?.programId
          );
        })
      )
    ).filter((x: any) => !!x) as TransactionInstruction[];

    const tx = await this.base.program.methods
      .redeem(amount, inKind, skipState)
      .accounts({
        fund,
        shareClass,
        signerShareAta,
        //TODO: only add if the fund has lock-up? (just for efficiency)
        // signerAccountPolicy: null,
        signer,
      })
      .remainingAccounts(remainingAccounts)
      .preInstructions(preInstructions)
      .transaction();

    return await this.base.intoVersionedTransaction({ tx, ...txOptions });
  }
}
