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
import { StateModel } from "../models";

export class InvestorClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async subscribe(
    statePda: PublicKey,
    asset: PublicKey,
    amount: BN,
    stateModel?: StateModel,
    mintId: number = 0,
    skipState: boolean = true,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.subscribeTx(
      statePda,
      asset,
      amount,
      stateModel,
      mintId,
      skipState,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async redeem(
    statePda: PublicKey,
    amount: BN,
    inKind: boolean = false,
    stateModel?: StateModel,
    mintId: number = 0,
    skipState: boolean = true,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.redeemTx(
      statePda,
      amount,
      inKind,
      stateModel,
      mintId,
      skipState,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * API methods
   */

  public async subscribeTx(
    statePda: PublicKey,
    asset: PublicKey,
    amount: BN,
    stateModel?: StateModel,
    mintId: number = 0,
    skipState: boolean = true,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();

    // glam mint token to receive
    const mintPda = this.base.getMintPda(statePda, mintId);
    const signerShareAta = this.base.getMintAta(signer, mintPda);

    // asset token to transfer
    const assetMeta = this.base.getAssetMeta(asset.toBase58());
    const vault = this.base.getVaultPda(statePda);
    const vaultAta = this.base.getAta(asset, vault, assetMeta?.programId);
    const signerAssetAta = this.base.getAta(
      asset,
      signer,
      assetMeta?.programId,
    );

    // remaining accounts may have 3 parts:
    // 1. treasury atas + pricing to compute AUM
    // 2. marinade ticket
    // 3. stake accounts
    if (!stateModel) {
      stateModel = await this.base.fetchState(statePda);
    }
    let remainingAccounts = (stateModel.assets || []).flatMap((asset) => {
      const assetMeta = this.base.getAssetMeta(asset.toBase58());
      const vaultAta = this.base.getVaultAta(
        statePda,
        asset,
        assetMeta?.programId,
      );

      return [
        { pubkey: vaultAta, isSigner: false, isWritable: false },
        {
          // For some LSTs we have both state and pricing accounts
          // The program should always prefer the state account
          pubkey: assetMeta.stateAccount || assetMeta.pricingAccount!,
          isSigner: false,
          isWritable: false,
        },
      ];
    });

    remainingAccounts = remainingAccounts.concat(
      (stateModel.externalVaultAccounts || []).map((address) => ({
        pubkey: address,
        isSigner: false,
        isWritable: false,
      })),
    );

    // SOL -> wSOL
    // If the user doesn't have enough wSOL but does have SOL, we auto wrap
    let preInstructions: TransactionInstruction[] = [
      createAssociatedTokenAccountIdempotentInstruction(
        signer,
        signerAssetAta,
        signer,
        asset,
        assetMeta?.programId,
      ),
      createAssociatedTokenAccountIdempotentInstruction(
        signer,
        vaultAta,
        vault,
        asset,
        assetMeta?.programId,
      ),
      createAssociatedTokenAccountIdempotentInstruction(
        signer,
        signerShareAta,
        signer,
        mintPda,
        TOKEN_2022_PROGRAM_ID,
      ),
    ];

    if (WSOL.equals(asset)) {
      const connection = this.base.provider.connection;
      let wsolBalance = new BN(0);
      try {
        wsolBalance = new BN(
          (
            await connection.getTokenAccountBalance(signerAssetAta)
          ).value.amount,
        );
      } catch (err) {
        // ignore
      }
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
      .subscribe(0, amount, skipState)
      .accounts({
        glamState: statePda,
        glamMint: mintPda,
        asset,
        vaultAta,
        signerAssetAta,
        //TODO: only add if the fund has lock-up? (just for efficiency)
        // signerAccountPolicy: null,
        signer,
      })
      .remainingAccounts(remainingAccounts)
      .preInstructions(preInstructions)
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async redeemTx(
    statePda: PublicKey,
    amount: BN,
    inKind: boolean = false,
    stateModel?: StateModel,
    mintId: number = 0,
    skipState: boolean = true,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();

    // share class token to receive
    const glamMint = this.base.getMintPda(statePda, mintId);
    const signerShareAta = this.base.getMintAta(signer, glamMint);

    // remaining accounts = assets + signer atas + treasury atas + pricing to compute AUM
    if (!stateModel) {
      stateModel = await this.base.fetchState(statePda);
    }
    let remainingAccounts = (stateModel.assets || []).flatMap((asset: any) => {
      const assetMeta = this.base.getAssetMeta(asset.toBase58());
      const vaultAta = this.base.getVaultAta(
        statePda,
        asset,
        assetMeta?.programId,
      );
      const signerAta = getAssociatedTokenAddressSync(
        asset,
        signer,
        true,
        assetMeta?.programId,
      );

      return [
        { pubkey: vaultAta, isSigner: false, isWritable: true },
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
      (stateModel.externalVaultAccounts || []).map((address: PublicKey) => ({
        pubkey: address,
        isSigner: false,
        isWritable: false,
      })),
    );

    const preInstructions = (
      await Promise.all(
        (stateModel.assets || []).map(async (asset: any, j: number) => {
          // not in kind, we only need the base asset ATA
          if (!inKind && j > 0) {
            return null;
          }

          const assetMeta = this.base.getAssetMeta(asset.toBase58());
          const signerAta = getAssociatedTokenAddressSync(
            asset,
            signer,
            true,
            assetMeta?.programId,
          );

          return createAssociatedTokenAccountIdempotentInstruction(
            signer,
            signerAta,
            signer,
            asset,
            assetMeta?.programId,
          );
        }),
      )
    ).filter((x: any) => !!x) as TransactionInstruction[];

    const tx = await this.base.program.methods
      .redeem(amount, inKind, skipState)
      .accounts({
        glamState: statePda,
        glamMint,
        signerShareAta,
        //TODO: only add if the fund has lock-up? (just for efficiency)
        // signerAccountPolicy: null,
        signer,
      })
      .remainingAccounts(remainingAccounts)
      .preInstructions(preInstructions)
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }
}
