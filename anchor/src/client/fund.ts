import * as anchor from "@coral-xyz/anchor";
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
} from "@solana/spl-token";
import {
  CompanyModel,
  DelegateAcl,
  FundModel,
  FundOpenfundsModel,
  ManagerModel,
  ShareClassModel,
  ShareClassOpenfundsModel,
} from "../models";

export class FundClient {
  public constructor(readonly base: BaseClient) {}

  public async createFund(
    partialFundModel: Partial<FundModel>,
    singleTx: boolean = false,
    txOptions: TxOptions = {},
  ): Promise<[TransactionSignature, PublicKey]> {
    let fundModel = this.enrichFundModel(partialFundModel);

    const fundPDA = this.base.getFundPDA(fundModel);
    const vault = this.base.getVaultPda(fundPDA);
    const openfunds = this.base.getOpenfundsPDA(fundPDA);

    const shareClasses = fundModel.shareClasses;
    fundModel.shareClasses = [];

    if (shareClasses.length > 1) {
      throw new Error("Multiple share classes not supported");
    }

    // No share class, only need to initialize the fund
    if (shareClasses.length === 0) {
      // @ts-ignore
      const txSig = await this.base.program.methods
        .initializeFund(fundModel)
        .accountsPartial({
          fund: fundPDA,
          vault,
          openfunds,
        })
        .rpc();
      return [txSig, fundPDA];
    }

    if (singleTx) {
      // @ts-ignore
      const initFundIx = await this.base.program.methods
        .initializeFund(fundModel)
        .accountsPartial({
          fund: fundPDA,
          vault,
          openfunds,
        })
        .instruction();

      const shareClassMint = this.base.getShareClassPDA(fundPDA, 0);
      const txSig = await this.base.program.methods
        .addShareClass(shareClasses[0])
        .accounts({
          fund: fundPDA,
          shareClassMint,
          openfunds,
        })
        .preInstructions([initFundIx])
        .rpc();
      return [txSig, fundPDA];
    }

    // @ts-ignore
    const txSig = await this.base.program.methods
      .initializeFund(fundModel)
      .accountsPartial({
        fund: fundPDA,
        vault,
        openfunds,
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
            // FIXME: estimate compute units
            ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 }),
          ])
          .rpc();
      }),
    );
    return [txSig, fundPDA];
  }

  public async updateFund(
    fundPDA: PublicKey,
    updated: Partial<FundModel>,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    return await this.base.program.methods
      .updateFund(new FundModel(updated))
      .accounts({
        fund: fundPDA,
      })
      .rpc();
  }

  public async closeFund(
    fundPDA: PublicKey,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const openfunds = this.base.getOpenfundsPDA(fundPDA);

    return await this.base.program.methods
      .closeFund()
      .accounts({
        fund: fundPDA,
        openfunds,
      })
      .preInstructions(txOptions.preInstructions || [])
      .rpc();
  }

  /**
   * Create a full fund model from a partial fund model
   *
   * @param fundModel
   */
  enrichFundModel(partialFundModel: Partial<FundModel>): FundModel {
    const fundModel = { ...partialFundModel };
    const manager = this.base.getSigner();
    const defaultDate = new Date().toISOString().split("T")[0];

    // createdKey = hash fund name and get first 8 bytes
    // useful for computing fund account PDA in the future
    const createdKey = [
      ...Buffer.from(
        anchor.utils.sha256.hash(this.base.getFundName(fundModel)),
      ).subarray(0, 8),
    ];
    fundModel.created = {
      key: createdKey,
      manager,
    };

    fundModel.rawOpenfunds = new FundOpenfundsModel(
      fundModel.rawOpenfunds ?? {},
    );

    fundModel.manager = new ManagerModel({
      ...(fundModel.manager || {}),
      pubkey: manager,
    });

    fundModel.company = new CompanyModel(fundModel.company || {});

    if (fundModel.shareClasses?.length == 1) {
      const shareClass = fundModel.shareClasses[0];
      fundModel.name = fundModel.name || shareClass.name;

      fundModel.rawOpenfunds.fundCurrency =
        fundModel.rawOpenfunds?.fundCurrency ||
        shareClass.rawOpenfunds?.shareClassCurrency ||
        null;
    } else if (
      fundModel.shareClasses?.length &&
      fundModel.shareClasses.length > 1
    ) {
      throw new Error("Fund with more than 1 share class is not supported");
    }

    if (fundModel.isEnabled) {
      fundModel.rawOpenfunds.fundLaunchDate =
        fundModel.rawOpenfunds?.fundLaunchDate || defaultDate;
    }

    // fields containing fund id / pda
    const fundPDA = this.base.getFundPDA(fundModel);
    fundModel.uri =
      fundModel.uri || `https://gui.glam.systems/products/${fundPDA}`;
    fundModel.openfundsUri =
      fundModel.openfundsUri ||
      `https://api.glam.systems/v0/openfunds?fund=${fundPDA}&format=csv`;

    // build openfunds models for each share classes
    (fundModel.shareClasses || []).forEach(
      (shareClass: ShareClassModel, i: number) => {
        if (shareClass.rawOpenfunds) {
          if (shareClass.rawOpenfunds.shareClassLifecycle === "active") {
            shareClass.rawOpenfunds.shareClassLaunchDate =
              shareClass.rawOpenfunds.shareClassLaunchDate || defaultDate;
          }
          shareClass.rawOpenfunds = new ShareClassOpenfundsModel(
            shareClass.rawOpenfunds,
          );
          shareClass.isRawOpenfunds = true;
        } else {
          shareClass.isRawOpenfunds = false;
        }

        const sharePDA = this.base.getShareClassPDA(fundPDA, i);
        shareClass.uri = `https://api.glam.systems/metadata/${sharePDA}`;
        shareClass.fundId = fundPDA;
        shareClass.imageUri = `https://api.glam.systems/v0/sparkle?key=${sharePDA}&format=png`;
      },
    );

    // convert partial share class models to full share class models
    fundModel.shareClasses = (fundModel.shareClasses || []).map(
      // @ts-ignore
      (s) => new ShareClassModel(s),
    );

    return new FundModel(fundModel);
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
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const updatedFund = new FundModel({
      delegateAcls: delegates.map((pubkey) => ({ pubkey, permissions: [] })),
    });
    return await this.updateFund(fundPDA, updatedFund, txOptions);
  }

  public async upsertDelegateAcls(
    fundPDA: PublicKey,
    delegateAcls: DelegateAcl[],
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const updatedFund = new FundModel({ delegateAcls });
    return await this.updateFund(fundPDA, updatedFund, txOptions);
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

  public async depositTx(
    fund: PublicKey,
    asset: PublicKey,
    amount: number | BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const treasury = this.base.getVaultPda(fund);

    const { mint, tokenProgram } = await this.base.fetchMintWithOwner(asset);

    const signerAta = this.base.getAta(asset, signer, tokenProgram);
    const treasuryAta = this.base.getVaultAta(fund, asset, tokenProgram);

    const tx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(
        signer,
        treasuryAta,
        treasury,
        asset,
        tokenProgram,
      ),
      createTransferCheckedInstruction(
        signerAta,
        asset,
        treasuryAta,
        signer,
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
    const signer = txOptions.signer || this.base.getSigner();
    const { tokenProgram } = await this.base.fetchMintWithOwner(asset);
    const signerAta = this.base.getAta(asset, signer, tokenProgram);

    // @ts-ignore
    const tx = await this.base.program.methods
      .withdraw(new BN(amount))
      .accounts({
        fund,
        asset,
        tokenProgram,
      })
      .preInstructions([
        createAssociatedTokenAccountIdempotentInstruction(
          signer,
          signerAta,
          signer,
          asset,
          tokenProgram,
        ),
      ])
      .transaction();

    return await this.base.intoVersionedTransaction({ tx, ...txOptions });
  }
}
