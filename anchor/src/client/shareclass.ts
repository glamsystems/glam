import * as anchor from "@coral-xyz/anchor";
import { PublicKey, TransactionSignature } from "@solana/web3.js";
import { BaseClient, TokenAccount, TxOptions } from "./base";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";

export class ShareClassClient {
  public constructor(readonly base: BaseClient) {}

  public async getHolders(state: PublicKey, shareClassId: number = 0) {
    const shareClassMint = this.base.getShareClassPda(state, shareClassId);
    const connection = this.base.provider.connection;
    const mint = await getMint(
      connection,
      shareClassMint,
      connection.commitment,
      TOKEN_2022_PROGRAM_ID,
    );

    // Size of a glam share class with perment delegate extension enabled
    const dataSize = 175;
    const accounts = await connection.getProgramAccounts(
      TOKEN_2022_PROGRAM_ID,
      {
        filters: [
          { dataSize },
          { memcmp: { offset: 0, bytes: shareClassMint.toBase58() } },
        ],
      },
    );
    return accounts.map((a) => {
      const { pubkey, account } = a;
      const tokenAccount = unpackAccount(
        pubkey,
        account,
        TOKEN_2022_PROGRAM_ID,
      );
      return {
        owner: tokenAccount.owner,
        pubkey: tokenAccount.address,
        mint: tokenAccount.mint,
        programId: TOKEN_2022_PROGRAM_ID,
        decimals: mint.decimals,
        amount: tokenAccount.amount.toString(),
        uiAmount: Number(tokenAccount.amount) / 10 ** mint.decimals,
        frozen: tokenAccount.isFrozen,
      } as TokenAccount;
    });
  }

  public async closeShareClassIx(state: PublicKey, shareClassId: number = 0) {
    const openfunds = this.base.getOpenfundsPda(state);
    const shareClassMint = this.base.getShareClassPda(state, shareClassId);

    // @ts-ignore Type instantiation is excessively deep and possibly infinite.
    return await this.base.program.methods
      .closeShareClass(shareClassId)
      .accounts({
        state,
        metadata: openfunds,
        shareClassMint,
      })
      .instruction();
  }

  public async closeShareClass(
    state: PublicKey,
    shareClassId: number = 0,
    txOptions: TxOptions = {},
  ) {
    const openfunds = this.base.getOpenfundsPda(state);
    const shareClassMint = this.base.getShareClassPda(state, shareClassId);

    // @ts-ignore Type instantiation is excessively deep and possibly infinite.
    return await this.base.program.methods
      .closeShareClass(shareClassId)
      .accounts({
        state,
        metadata: openfunds,
        shareClassMint,
      })
      .rpc();
  }

  /**
   * Create a share class token account for a specific user
   *
   * @param state
   * @param owner
   * @param shareClassId
   * @param txOptions
   * @returns
   */
  public async createTokenAccount(
    state: PublicKey,
    owner: PublicKey,
    shareClassId: number = 0,
    setFrozen: boolean = true,
    txOptions: TxOptions = {},
  ) {
    const shareClassMint = this.base.getShareClassPda(state, shareClassId);
    const ata = this.base.getShareClassAta(owner, shareClassMint);
    const ixCreateAta = createAssociatedTokenAccountIdempotentInstruction(
      this.base.getSigner(),
      ata,
      owner,
      shareClassMint,
      TOKEN_2022_PROGRAM_ID,
    );
    return await this.setTokenAccountsStates(
      state,
      shareClassId,
      [ata],
      setFrozen,
      { preInstructions: [ixCreateAta], ...txOptions },
    );
  }

  /**
   * Freeze or thaw token accounts of a share class
   *
   * @param state
   * @param shareClassId
   * @param frozen
   * @param txOptions
   * @returns
   */
  public async setTokenAccountsStates(
    state: PublicKey,
    shareClassId: number,
    tokenAccounts: PublicKey[],
    frozen: boolean,
    txOptions: TxOptions = {},
  ) {
    const shareClassMint = this.base.getShareClassPda(state, shareClassId);
    return await this.base.program.methods
      .setTokenAccountsStates(shareClassId, frozen)
      .accounts({
        shareClassMint,
        state,
      })
      .remainingAccounts(
        tokenAccounts.map((account) => ({
          pubkey: account,
          isSigner: false,
          isWritable: true,
        })),
      )
      .preInstructions(txOptions.preInstructions || [])
      .rpc();
  }

  /**
   * Mint share to recipient
   *
   * @param state
   * @param shareClassId
   * @param recipient Recipient's wallet address
   * @param amount Amount of shares to mint
   * @param forceThaw If true, force thaw token account before minting
   * @param txOptions
   * @returns Transaction signature
   */
  public async mintShare(
    state: PublicKey,
    shareClassId: number,
    recipient: PublicKey,
    amount: anchor.BN,
    forceThaw: boolean = false,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const shareClassMint = this.base.getShareClassPda(state, shareClassId);
    const mintTo = this.base.getShareClassAta(recipient, shareClassMint);

    const preInstructions = [];
    preInstructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        this.base.getSigner(),
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
            state,
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
        state: state,
      })
      .preInstructions(preInstructions)
      .rpc();
  }

  public async burnShare(
    state: PublicKey,
    shareClassId: number,
    amount: anchor.BN,
    from: PublicKey,
    forceThaw: boolean = false,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const shareClassMint = this.base.getShareClassPda(state, shareClassId);
    const ata = this.base.getShareClassAta(from, shareClassMint);

    const preInstructions = [];
    if (forceThaw) {
      preInstructions.push(
        await this.base.program.methods
          .setTokenAccountsStates(shareClassId, false)
          .accounts({
            shareClassMint,
            state: state,
          })
          .remainingAccounts([
            { pubkey: ata, isSigner: false, isWritable: true },
          ])
          .instruction(),
      );
    }

    return await this.base.program.methods
      .burnShare(shareClassId, amount)
      .accounts({
        from,
        shareClassMint,
        state: state,
      })
      .preInstructions(preInstructions)
      .rpc();
  }

  public async forceTransferShare(
    state: PublicKey,
    shareClassId: number,
    amount: anchor.BN,
    from: PublicKey,
    to: PublicKey,
    forceThaw: boolean = false,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const shareClassMint = this.base.getShareClassPda(state, shareClassId);
    const fromAta = this.base.getShareClassAta(from, shareClassMint);
    const toAta = this.base.getShareClassAta(to, shareClassMint);

    const preInstructions = [];
    preInstructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        this.base.getSigner(),
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
            state,
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
        state: state,
      })
      .preInstructions(preInstructions)
      .rpc();
  }
}
