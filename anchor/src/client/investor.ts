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

import { BaseClient, ApiTxOptions } from "./base";
import { WSOL } from "../constants";

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
    skipState: boolean = true
  ): Promise<TransactionSignature> {
    const tx = await this.subscribeTx(
      fund,
      asset,
      amount,
      shareClassId,
      skipState,
      {}
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async redeem(
    fund: PublicKey,
    amount: BN,
    inKind: boolean = false,
    shareClassId: number = 0,
    skipState: boolean = true
  ): Promise<TransactionSignature> {
    const tx = await this.redeemTx(
      fund,
      amount,
      inKind,
      shareClassId,
      skipState,
      {}
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
    shareClassId: number = 0,
    skipState: boolean = true,
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const signer = apiOptions.signer || this.base.getSigner();

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
    const fundModel = await this.base.fetchFund(fund);
    const remainingAccounts = (fundModel.assets || []).flatMap((asset: any) => {
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

    const tickets = (await this.base.getTickets(fund)).map(
      (ticket) => ticket.address
    );
    const stakes = await this.base.getStakeAccounts(fund);
    remainingAccounts.push(
      ...tickets.concat(stakes).map((address) => ({
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
      if (delta.gt(new BN(0)) /*&& solBalance > delta*/) {
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

    return await this.base.intoVersionedTransaction({ tx, ...apiOptions });
  }

  public async redeemTx(
    fund: PublicKey,
    amount: BN,
    inKind: boolean = false,
    shareClassId: number = 0,
    skipState: boolean = true,
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const treasury = this.base.getTreasuryPDA(fund);
    const signer = apiOptions.signer || this.base.getSigner();

    // share class token to receive
    const shareClass = this.base.getShareClassPDA(fund, shareClassId);
    const signerShareAta = this.base.getShareClassAta(signer, shareClass);

    // remaining accounts = assets + signer atas + treasury atas + pricing to compute AUM
    const fundModel = await this.base.fetchFund(fund);
    const remainingAccounts = (fundModel.assets || []).flatMap((asset: any) => {
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

    const tickets = (await this.base.getTickets(fund)).map(
      (ticket) => ticket.address
    );
    const stakes = await this.base.getStakeAccounts(fund);
    remainingAccounts.push(
      ...tickets.concat(stakes).map((address) => ({
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

    return await this.base.intoVersionedTransaction({ tx, ...apiOptions });
  }
}
