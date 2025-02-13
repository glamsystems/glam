import * as anchor from "@coral-xyz/anchor";
import { PublicKey, TransactionSignature } from "@solana/web3.js";
import { BaseClient, TokenAccount, TxOptions } from "./base";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";

export class MintClient {
  public constructor(readonly base: BaseClient) {}

  public async getHolders(state: PublicKey, mintId: number = 0) {
    const mintPda = this.base.getMintPda(state, mintId);
    const connection = this.base.provider.connection;
    const mint = await getMint(
      connection,
      mintPda,
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
          { memcmp: { offset: 0, bytes: mintPda.toBase58() } },
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

  public async closeMintIx(state: PublicKey, mintId: number = 0) {
    const openfunds = this.base.getOpenfundsPda(state);
    const mintPda = this.base.getMintPda(state, mintId);

    return await this.base.program.methods
      .closeMint(mintId)
      .accounts({
        glamState: state,
        glamMint: mintPda,
      })
      .instruction();
  }

  public async closeMint(
    state: PublicKey,
    mintId: number = 0,
    txOptions: TxOptions = {},
  ) {
    const openfunds = this.base.getOpenfundsPda(state);
    const mintPda = this.base.getMintPda(state, mintId);

    return await this.base.program.methods
      .closeMint(mintId)
      .accounts({
        glamState: state,
        glamMint: mintPda,
      })
      .rpc();
  }

  /**
   * Create a share class token account for a specific user
   *
   * @param state
   * @param owner
   * @param mintId
   * @param txOptions
   * @returns
   */
  public async createTokenAccount(
    state: PublicKey,
    owner: PublicKey,
    mintId: number = 0,
    setFrozen: boolean = true,
    txOptions: TxOptions = {},
  ) {
    const mintPda = this.base.getMintPda(state, mintId);
    const ata = this.base.getMintAta(owner, mintPda);
    const ixCreateAta = createAssociatedTokenAccountIdempotentInstruction(
      this.base.getSigner(),
      ata,
      owner,
      mintPda,
      TOKEN_2022_PROGRAM_ID,
    );
    return await this.setTokenAccountsStates(state, mintId, [ata], setFrozen, {
      preInstructions: [ixCreateAta],
      ...txOptions,
    });
  }

  /**
   * Freeze or thaw token accounts of a share class
   *
   * @param state
   * @param mintId
   * @param frozen
   * @param txOptions
   * @returns
   */
  public async setTokenAccountsStates(
    state: PublicKey,
    mintId: number,
    tokenAccounts: PublicKey[],
    frozen: boolean,
    txOptions: TxOptions = {},
  ) {
    const mintPda = this.base.getMintPda(state, mintId);
    return await this.base.program.methods
      .setTokenAccountsStates(mintId, frozen)
      .accounts({
        glamState: state,
        glamMint: mintPda,
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
   * @param mintId
   * @param recipient Recipient's wallet address
   * @param amount Amount of shares to mint
   * @param forceThaw If true, force unfreezing token account before minting
   * @param txOptions
   * @returns Transaction signature
   */
  public async mint(
    state: PublicKey,
    mintId: number,
    recipient: PublicKey,
    amount: anchor.BN,
    forceThaw: boolean = false,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const mintPda = this.base.getMintPda(state, mintId);
    const mintTo = this.base.getMintAta(recipient, mintPda);

    const preInstructions = [];
    preInstructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        this.base.getSigner(),
        mintTo,
        recipient,
        mintPda,
        TOKEN_2022_PROGRAM_ID,
      ),
    );
    if (forceThaw) {
      preInstructions.push(
        await this.base.program.methods
          .setTokenAccountsStates(mintId, false)
          .accounts({
            glamState: state,
            glamMint: mintPda,
          })
          .remainingAccounts([
            { pubkey: mintTo, isSigner: false, isWritable: true },
          ])
          .instruction(),
      );
    }

    return await this.base.program.methods
      .mintTokens(0, amount)
      .accounts({
        recipient,
        glamState: state,
        glamMint: mintPda,
      })
      .preInstructions(preInstructions)
      .rpc();
  }

  public async burn(
    state: PublicKey,
    mintId: number,
    amount: anchor.BN,
    from: PublicKey,
    forceThaw: boolean = false,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const mintPda = this.base.getMintPda(state, mintId);
    const ata = this.base.getMintAta(from, mintPda);

    const preInstructions = [];
    if (forceThaw) {
      preInstructions.push(
        await this.base.program.methods
          .setTokenAccountsStates(mintId, false)
          .accounts({
            glamState: state,
            glamMint: mintPda,
          })
          .remainingAccounts([
            { pubkey: ata, isSigner: false, isWritable: true },
          ])
          .instruction(),
      );
    }

    return await this.base.program.methods
      .burnTokens(mintId, amount)
      .accounts({
        glamState: state,
        glamMint: mintPda,
        from,
      })
      .preInstructions(preInstructions)
      .rpc();
  }

  public async forceTransfer(
    state: PublicKey,
    mintId: number,
    amount: anchor.BN,
    from: PublicKey,
    to: PublicKey,
    forceThaw: boolean = false,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const mintPda = this.base.getMintPda(state, mintId);
    const fromAta = this.base.getMintAta(from, mintPda);
    const toAta = this.base.getMintAta(to, mintPda);

    const preInstructions = [];
    preInstructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        this.base.getSigner(),
        toAta,
        to,
        mintPda,
        TOKEN_2022_PROGRAM_ID,
      ),
    );
    if (forceThaw) {
      preInstructions.push(
        await this.base.program.methods
          .setTokenAccountsStates(mintId, false)
          .accounts({
            glamState: state,
            glamMint: mintPda,
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
      .forceTransferTokens(mintId, amount)
      .accounts({
        glamState: state,
        glamMint: mintPda,
        from,
        to,
      })
      .preInstructions(preInstructions)
      .rpc();
  }
}
