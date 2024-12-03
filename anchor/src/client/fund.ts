import {
  PublicKey,
  VersionedTransaction,
  Transaction,
  TransactionSignature,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { BaseClient, TxOptions } from "./base";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
  unpackMint,
} from "@solana/spl-token";

export class FundClient {
  public constructor(readonly base: BaseClient) {}

  public async createFund(
    fund: any,
  ): Promise<[TransactionSignature, PublicKey]> {
    // @ts-ignore Type instantiation is excessively deep and possibly infinite.
    let fundModel = this.base.enrichFundModelInitialize(fund);

    const fundPDA = this.base.getFundPDA(fundModel);
    const treasury = this.base.getTreasuryPDA(fundPDA);
    const openfunds = this.base.getOpenfundsPDA(fundPDA);
    const manager = this.base.getManager();

    const shareClasses = fundModel.shareClasses;
    fundModel.shareClasses = [];

    const txSig = await this.base.program.methods
      .initializeFund(fundModel)
      .accounts({
        //@ts-ignore IDL ts type is unhappy
        fund: fundPDA,
        treasury,
        openfunds,
        manager,
      })
      .rpc();
    await Promise.all(
      shareClasses.map(async (shareClass: any, j: number) => {
        const shareClassMint = this.base.getShareClassPDA(fundPDA, j);

        return await this.base.program.methods
          .addShareClass(shareClass)
          .accounts({
            fund: fundPDA,
            shareClassMint,
            openfunds,
          })
          .preInstructions([
            ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 }),
          ])
          .rpc();
      }),
    );
    return [txSig, fundPDA];
  }

  public async updateFund(
    fundPDA: PublicKey,
    updated: any,
  ): Promise<TransactionSignature> {
    let updatedFund = this.base.getFundModel(updated);

    return await this.base.program.methods
      .updateFund(updatedFund)
      .accounts({
        fund: fundPDA,
        signer: this.base.getManager(),
      })
      .rpc();
  }

  public async closeFund(fundPDA: PublicKey): Promise<TransactionSignature> {
    const openfunds = this.base.getOpenfundsPDA(fundPDA);

    return await this.base.program.methods
      .closeFund()
      .accounts({
        fund: fundPDA,
        openfunds,
      })
      .rpc();
  }

  /**
   * Delete delegates' access to the fund
   *
   * @param fundPDA
   * @param delegates Public keys of delegates to be deleted
   * @returns
   */
  public async deleteDelegateAcls(
    fundPDA: PublicKey,
    delegates: PublicKey[],
  ): Promise<TransactionSignature> {
    let updatedFund = this.base.getFundModel({
      delegateAcls: delegates.map((pubkey) => ({ pubkey, permissions: [] })),
    });
    return await this.base.program.methods
      .updateFund(updatedFund)
      .accounts({
        fund: fundPDA,
        signer: this.base.getManager(),
      })
      .rpc();
  }

  public async upsertDelegateAcls(
    fundPDA: PublicKey,
    delegateAcls: any[],
  ): Promise<TransactionSignature> {
    let updatedFund = this.base.getFundModel({ delegateAcls });
    return await this.base.program.methods
      .updateFund(updatedFund)
      .accounts({
        fund: fundPDA,
        signer: this.base.getManager(),
      })
      .rpc();
  }

  public async setSubscribeRedeemEnabled(
    fundPDA: PublicKey,
    enabled: boolean,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    return await this.base.program.methods
      .setSubscribeRedeemEnabled(enabled)
      .accounts({
        fund: fundPDA,
      })
      .rpc();
  }

  public async closeTokenAccounts(
    fund: PublicKey,
    tokenAccounts: PublicKey[],
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.closeTokenAccountsTx(fund, tokenAccounts, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  /**
   * Close fund treasury's token accounts
   *
   * @param fund
   * @param tokenAccounts
   * @param txOptions
   * @returns
   */
  public async closeTokenAccountsTx(
    fund: PublicKey,
    tokenAccounts: PublicKey[],
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    // @ts-ignore
    const tx = await this.base.program.methods
      .closeTokenAccounts()
      .accounts({
        fund,
      })
      .remainingAccounts(
        tokenAccounts.map((account) => ({
          pubkey: account,
          isSigner: false,
          isWritable: true,
        })),
      )
      .transaction();
    return await this.base.intoVersionedTransaction({ tx, ...txOptions });
  }

  /* Deposit & Withdraw */

  public async deposit(
    fund: PublicKey,
    asset: PublicKey,
    amount: number | BN,
    txOptions: TxOptions = {} as TxOptions,
  ): Promise<TransactionSignature> {
    const tx = await this.depositTx(fund, asset, amount, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  public async withdraw(
    fund: PublicKey,
    asset: PublicKey,
    amount: number | BN,
    txOptions: TxOptions = {} as TxOptions,
  ): Promise<TransactionSignature> {
    const tx = await this.withdrawTx(fund, asset, amount, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  async fetchMintWithOwner(asset: PublicKey) {
    const connection = this.base.provider.connection;
    const commitment = "confirmed";
    const info = await connection.getAccountInfo(asset, { commitment });
    const tokenProgram = info?.owner || TOKEN_PROGRAM_ID;
    let mint = unpackMint(asset, info, tokenProgram);
    return { mint, tokenProgram };
  }

  public async depositTx(
    fund: PublicKey,
    asset: PublicKey,
    amount: number | BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const manager = txOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);

    const { mint, tokenProgram } = await this.fetchMintWithOwner(asset);

    const managerAta = this.base.getManagerAta(asset, manager, tokenProgram);
    const treasuryAta = this.base.getTreasuryAta(fund, asset, tokenProgram);

    // @ts-ignore
    const tx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(
        manager,
        treasuryAta,
        treasury,
        asset,
        tokenProgram,
      ),
      createTransferCheckedInstruction(
        managerAta,
        asset,
        treasuryAta,
        manager,
        new BN(amount).toNumber(),
        mint.decimals,
        [],
        tokenProgram,
      ),
    );

    return await this.base.intoVersionedTransaction({ tx, ...txOptions });
  }

  public async withdrawTx(
    fund: PublicKey,
    asset: PublicKey,
    amount: number | BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const manager = txOptions.signer || this.base.getManager();
    const { mint, tokenProgram } = await this.fetchMintWithOwner(asset);
    const managerAta = this.base.getManagerAta(asset, manager, tokenProgram);

    // @ts-ignore
    const tx = await this.base.program.methods
      .withdraw(new BN(amount))
      .accounts({
        fund,
        asset,
        //@ts-ignore
        manager,
        tokenProgram,
      })
      .preInstructions([
        createAssociatedTokenAccountIdempotentInstruction(
          manager,
          managerAta,
          manager,
          asset,
          tokenProgram,
        ),
      ])
      .transaction();

    return await this.base.intoVersionedTransaction({ tx, ...txOptions });
  }
}
