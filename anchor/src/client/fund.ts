import {
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { BaseClient, TxOptions } from "./base";

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

  public async deleteDelegateAcls(
    fundPDA: PublicKey,
    keys: PublicKey[],
  ): Promise<TransactionSignature> {
    let updatedFund = this.base.getFundModel({
      delegateAcls: keys.map((key) => ({ pubkey: key, permissions: [] })),
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
}
