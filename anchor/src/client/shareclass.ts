import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
} from "@solana/web3.js";
import { BaseClient, TxOptions } from "./base";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

export class ShareClassClient {
  public constructor(readonly base: BaseClient) {}

  public async closeShareClass(
    fundPDA: PublicKey,
    shareClassId: number = 0,
    txOptions: TxOptions = {},
  ) {
    const openfunds = this.base.getOpenfundsPDA(fundPDA);
    const shareClassMint = this.base.getShareClassPDA(fundPDA, shareClassId);

    // @ts-ignore Type instantiation is excessively deep and possibly infinite.
    return await this.base.program.methods
      .closeShareClass(shareClassId)
      .accounts({
        fund: fundPDA,
        openfunds,
        shareClassMint,
      })
      .rpc();
  }

  /**
   * Freeze or thaw token accounts of a share class
   *
   * @param fundPDA
   * @param shareClassId
   * @param frozen
   * @param txOptions
   * @returns
   */
  public async setTokenAccountsStates(
    fundPDA: PublicKey,
    shareClassId: number,
    tokenAccounts: PublicKey[],
    frozen: boolean,
    txOptions: TxOptions = {},
  ) {
    const shareClassMint = this.base.getShareClassPDA(fundPDA, shareClassId);
    return await this.base.program.methods
      .setTokenAccountsStates(shareClassId, frozen)
      .accounts({
        shareClassMint,
        fund: fundPDA,
      })
      .remainingAccounts(
        tokenAccounts.map((account) => ({
          pubkey: account,
          isSigner: false,
          isWritable: true,
        })),
      )
      .rpc();
  }

  /**
   * Mint share to recipient
   *
   * @param fundPDA
   * @param shareClassId
   * @param recipient Recipient's wallet address
   * @param amount Amount of shares to mint
   * @param forceThaw If true, force thaw token account before minting
   * @param txOptions
   * @returns Transaction signature
   */
  public async mintShare(
    fundPDA: PublicKey,
    shareClassId: number,
    recipient: PublicKey,
    amount: anchor.BN,
    forceThaw: boolean = false,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const shareClassMint = this.base.getShareClassPDA(fundPDA, shareClassId);
    const mintTo = this.base.getShareClassAta(recipient, shareClassMint);

    const preInstructions = [];
    preInstructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        this.base.getManager(),
        mintTo,
        recipient,
        shareClassMint,
        TOKEN_2022_PROGRAM_ID,
      ),
    );
    if (forceThaw) {
      preInstructions.push(
        await this.base.program.methods
          .setTokenAccountsStates(shareClassId, false)
          .accounts({
            shareClassMint,
            fund: fundPDA,
          })
          .remainingAccounts([
            { pubkey: mintTo, isSigner: false, isWritable: true },
          ])
          .instruction(),
      );
    }

    return await this.base.program.methods
      .mintShare(0, amount)
      .accounts({
        recipient,
        shareClassMint,
        fund: fundPDA,
      })
      .preInstructions(preInstructions)
      .rpc();
  }

  public async burnShare(
    fundPDA: PublicKey,
    shareClassId: number,
    amount: anchor.BN,
    from: PublicKey,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const shareClassMint = this.base.getShareClassPDA(fundPDA, shareClassId);
    return await this.base.program.methods
      .burnShare(shareClassId, amount)
      .accounts({
        from,
        shareClassMint,
        fund: fundPDA,
      })
      .rpc();
  }

  public async forceTransferShare(
    fundPDA: PublicKey,
    shareClassId: number,
    amount: anchor.BN,
    from: PublicKey,
    to: PublicKey,
    forceThaw: boolean = false,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const shareClassMint = this.base.getShareClassPDA(fundPDA, shareClassId);
    const fromAta = this.base.getShareClassAta(from, shareClassMint);
    const toAta = this.base.getShareClassAta(to, shareClassMint);

    const preInstructions = [];
    preInstructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        this.base.getManager(),
        toAta,
        to,
        shareClassMint,
        TOKEN_2022_PROGRAM_ID,
      ),
    );
    if (forceThaw) {
      preInstructions.push(
        await this.base.program.methods
          .setTokenAccountsStates(shareClassId, false)
          .accounts({
            shareClassMint,
            fund: fundPDA,
          })
          .remainingAccounts([
            // fromAta is already unfrozen, still add it to test the ix is idempotent
            { pubkey: fromAta, isSigner: false, isWritable: true },
            { pubkey: toAta, isSigner: false, isWritable: true },
          ])
          .instruction(),
      );
    }

    return await this.base.program.methods
      .forceTransferShare(shareClassId, amount)
      .accounts({
        from,
        to,
        shareClassMint,
        fund: fundPDA,
      })
      .preInstructions(preInstructions)
      .rpc();
  }
}
