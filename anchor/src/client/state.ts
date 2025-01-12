import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  Transaction,
  TransactionInstruction,
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
  StateModel,
  FundOpenfundsModel,
  ManagerModel,
  ShareClassModel,
  ShareClassOpenfundsModel,
} from "../models";

export class StateClient {
  public constructor(readonly base: BaseClient) {}

  public async createState(
    partialStateModel: Partial<StateModel>,
    singleTx: boolean = false,
    txOptions: TxOptions = {},
  ): Promise<[TransactionSignature, PublicKey]> {
    let stateModel = this.enrichStateModel(partialStateModel);

    const statePda = this.base.getStatePda(stateModel);
    const vault = this.base.getVaultPda(statePda);
    const openfunds = this.base.getOpenfundsPda(statePda);

    const mints = stateModel.mints;
    stateModel.mints = [];

    if (mints.length > 1) {
      throw new Error("Multiple mints not supported");
    }

    // No share class, only need to initialize the fund
    if (mints.length === 0) {
      // @ts-ignore
      const txSig = await this.base.program.methods
        .initializeState(stateModel)
        .accountsPartial({
          state: statePda,
          vault,
          metadata: openfunds,
        })
        .rpc();
      return [txSig, statePda];
    }

    if (singleTx) {
      // @ts-ignore
      const initStateIx = await this.base.program.methods
        .initializeState(stateModel)
        .accountsPartial({
          state: statePda,
          vault,
          metadata: openfunds,
        })
        .instruction();

      const shareClassMint = this.base.getShareClassPda(statePda, 0);
      const txSig = await this.base.program.methods
        .addShareClass(mints[0])
        .accounts({
          state: statePda,
          shareClassMint,
          metadata: openfunds,
        })
        .preInstructions([initStateIx])
        .rpc();
      return [txSig, statePda];
    }

    // @ts-ignore
    const txSig = await this.base.program.methods
      .initializeState(stateModel)
      .accountsPartial({
        state: statePda,
        vault,
        metadata: openfunds,
      })
      .rpc();

    const addShareClassTxs = await Promise.all(
      mints.map(async (shareClass: any, j: number) => {
        const shareClassMint = this.base.getShareClassPda(statePda, j);

        return await this.base.program.methods
          .addShareClass(shareClass)
          .accounts({
            state: statePda,
            shareClassMint,
            metadata: openfunds,
          })
          .preInstructions([
            // FIXME: estimate compute units
            ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 }),
          ])
          .rpc();
      }),
    );
    console.log("addShareClassTxs", addShareClassTxs);
    return [txSig, statePda];
  }

  public async updateState(
    statePda: PublicKey,
    updated: Partial<StateModel>,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    return await this.base.program.methods
      .updateState(new StateModel(updated))
      .accounts({
        state: statePda,
      })
      .rpc();
  }

  public async closeState(
    statePda: PublicKey,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const openfunds = this.base.getOpenfundsPda(statePda);

    const tx = await this.base.program.methods
      .closeState()
      .accounts({
        state: statePda,
        metadata: openfunds,
      })
      .preInstructions(txOptions.preInstructions || [])
      .transaction();

    const vTx = await this.base.intoVersionedTransaction({ tx, ...txOptions });
    return await this.base.sendAndConfirm(vTx);
  }

  /**
   * Create a full state model from a partial state model
   */
  enrichStateModel(partialStateModel: Partial<StateModel>): StateModel {
    const stateModel = { ...partialStateModel };
    const owner = this.base.getSigner();
    const defaultDate = new Date().toISOString().split("T")[0];

    // createdKey = hash fund name and get first 8 bytes
    // useful for computing state account PDA in the future
    const createdKey = [
      ...Buffer.from(
        anchor.utils.sha256.hash(this.base.getName(stateModel)),
      ).subarray(0, 8),
    ];
    stateModel.created = {
      key: createdKey,
      owner,
    };

    stateModel.rawOpenfunds = new FundOpenfundsModel(
      stateModel.rawOpenfunds ?? {},
    );

    stateModel.owner = new ManagerModel({
      ...(stateModel.owner || {}),
      pubkey: owner,
    });

    stateModel.company = new CompanyModel(stateModel.company || {});

    if (stateModel.mints?.length == 1) {
      const shareClass = stateModel.mints[0];
      stateModel.name = stateModel.name || shareClass.name;

      stateModel.rawOpenfunds.fundCurrency =
        stateModel.rawOpenfunds?.fundCurrency ||
        shareClass.rawOpenfunds?.shareClassCurrency ||
        null;
    } else if (stateModel.mints?.length && stateModel.mints.length > 1) {
      throw new Error("Fund with more than 1 share class is not supported");
    }

    if (stateModel.isEnabled) {
      stateModel.rawOpenfunds.fundLaunchDate =
        stateModel.rawOpenfunds?.fundLaunchDate || defaultDate;
    }

    // fields containing fund id / pda
    const statePda = this.base.getStatePda(stateModel);
    stateModel.uri =
      stateModel.uri || `https://gui.glam.systems/products/${statePda}`;
    stateModel.metadataUri =
      stateModel.metadataUri ||
      `https://api.glam.systems/v0/openfunds?fund=${statePda}&format=csv`;

    // build openfunds models for each share classes
    (stateModel.mints || []).forEach(
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

        const sharePda = this.base.getShareClassPda(statePda, i);
        shareClass.uri = `https://api.glam.systems/metadata/${sharePda}`;
        shareClass.fundId = statePda;
        shareClass.imageUri = `https://api.glam.systems/v0/sparkle?key=${sharePda}&format=png`;
      },
    );

    // convert partial share class models to full share class models
    stateModel.mints = (stateModel.mints || []).map(
      // @ts-ignore
      (s) => new ShareClassModel(s),
    );

    return new StateModel(stateModel);
  }

  /**
   * Delete delegates' access to the fund
   *
   * @param statePda
   * @param delegates Public keys of delegates to be deleted
   * @returns
   */
  public async deleteDelegateAcls(
    statePda: PublicKey,
    delegates: PublicKey[],
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const updated = new StateModel({
      delegateAcls: delegates.map((pubkey) => ({ pubkey, permissions: [] })),
    });
    return await this.updateState(statePda, updated, txOptions);
  }

  public async upsertDelegateAcls(
    statePda: PublicKey,
    delegateAcls: DelegateAcl[],
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const updatedFund = new StateModel({ delegateAcls });
    return await this.updateState(statePda, updatedFund, txOptions);
  }

  public async setSubscribeRedeemEnabled(
    statePda: PublicKey,
    enabled: boolean,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    return await this.base.program.methods
      .setSubscribeRedeemEnabled(enabled)
      .accounts({
        state: statePda,
      })
      .rpc();
  }

  public async closeTokenAccounts(
    statePda: PublicKey,
    tokenAccounts: PublicKey[],
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.closeTokenAccountsTx(
      statePda,
      tokenAccounts,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  /**
   * Close fund treasury's token accounts
   *
   * @param statePda
   * @param tokenAccounts
   * @param txOptions
   * @returns
   */
  public async closeTokenAccountsIx(
    statePda: PublicKey,
    tokenAccounts: PublicKey[],
  ): Promise<TransactionInstruction> {
    return await this.base.program.methods
      .closeTokenAccounts()
      .accounts({
        state: statePda,
      })
      .remainingAccounts(
        tokenAccounts.map((account) => ({
          pubkey: account,
          isSigner: false,
          isWritable: true,
        })),
      )
      .instruction();
  }

  public async closeTokenAccountsTx(
    statePda: PublicKey,
    tokenAccounts: PublicKey[],
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    // @ts-ignore
    const tx = await this.base.program.methods
      .closeTokenAccounts()
      .accounts({
        state: statePda,
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
    statePda: PublicKey,
    asset: PublicKey,
    amount: number | BN,
    txOptions: TxOptions = {} as TxOptions,
  ): Promise<TransactionSignature> {
    const tx = await this.depositTx(statePda, asset, amount, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  public async withdraw(
    statePda: PublicKey,
    asset: PublicKey,
    amount: number | BN,
    txOptions: TxOptions = {} as TxOptions,
  ): Promise<TransactionSignature> {
    const tx = await this.withdrawTx(statePda, asset, amount, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  public async depositTx(
    statePda: PublicKey,
    asset: PublicKey,
    amount: number | BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(statePda);

    const { mint, tokenProgram } = await this.base.fetchMintWithOwner(asset);

    const signerAta = this.base.getAta(asset, signer, tokenProgram);
    const vaultAta = this.base.getVaultAta(statePda, asset, tokenProgram);

    const tx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(
        signer,
        vaultAta,
        vault,
        asset,
        tokenProgram,
      ),
      createTransferCheckedInstruction(
        signerAta,
        asset,
        vaultAta,
        signer,
        new BN(amount).toNumber(),
        mint.decimals,
        [],
        tokenProgram,
      ),
    );

    return await this.base.intoVersionedTransaction({ tx, ...txOptions });
  }

  public async withdrawIxs(
    statePda: PublicKey,
    asset: PublicKey,
    amount: number | BN,
    txOptions: TxOptions,
  ): Promise<TransactionInstruction[]> {
    const signer = txOptions.signer || this.base.getSigner();
    const { tokenProgram } = await this.base.fetchMintWithOwner(asset);
    const signerAta = this.base.getAta(asset, signer, tokenProgram);

    return [
      createAssociatedTokenAccountIdempotentInstruction(
        signer,
        signerAta,
        signer,
        asset,
        tokenProgram,
      ),
      await this.base.program.methods
        .withdraw(new BN(amount))
        .accounts({
          state: statePda,
          asset,
          tokenProgram,
        })
        .instruction(),
    ];
  }

  public async withdrawTx(
    statePda: PublicKey,
    asset: PublicKey,
    amount: number | BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const { tokenProgram } = await this.base.fetchMintWithOwner(asset);
    const signerAta = this.base.getAta(asset, signer, tokenProgram);

    const tx = await this.base.program.methods
      .withdraw(new BN(amount))
      .accounts({
        state: statePda,
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
