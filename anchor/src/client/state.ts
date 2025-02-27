import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
  ComputeBudgetProgram,
  SystemProgram,
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
  MintModel,
  MintOpenfundsModel,
  CreatedModel,
  Metadata,
} from "../models";
import { WSOL } from "../constants";

type PublicKeyOrString = PublicKey | string;

function getPublicKey(input: PublicKeyOrString) {
  return typeof input === "string" ? new PublicKey(input) : input;
}

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

    if (mints && mints.length > 1) {
      throw new Error("Multiple mints not supported");
    }

    // No share class, only need to initialize the fund
    if (mints && mints.length === 0) {
      const txSig = await this.base.program.methods
        .initializeState(stateModel)
        .accountsPartial({
          state: statePda,
          vault,
          openfundsMetadata: openfunds,
        })
        .rpc();
      return [txSig, statePda];
    }

    if (mints && mints.length > 0 && singleTx) {
      const initStateIx = await this.base.program.methods
        .initializeState(stateModel)
        .accountsPartial({
          state: statePda,
          vault,
          openfundsMetadata: openfunds,
        })
        .instruction();

      // FIXME: setting rawOpenfunds to null is a workarond for
      // Access violation in stack frame 5 at address 0x200005ff8 of size 8
      mints[0].rawOpenfunds = null;
      const mintPda = this.base.getMintPda(statePda, 0);
      const txSig = await this.base.program.methods
        .addMint(mints[0])
        .accounts({
          glamState: statePda,
          newMint: mintPda,
        })
        .preInstructions([initStateIx])
        .rpc();
      return [txSig, statePda];
    }

    const txSig = await this.base.program.methods
      .initializeState(stateModel)
      .accountsPartial({
        state: statePda,
        vault,
        openfundsMetadata: openfunds,
      })
      .rpc();

    const addMintTxs = await Promise.all(
      (mints || []).map(async (mint, j: number) => {
        const mintPda = this.base.getMintPda(statePda, j);

        // FIXME: setting rawOpenfunds to null is a workarond for
        // Access violation in stack frame 5 at address 0x200005ff8 of size 8
        mint.rawOpenfunds = null;
        return await this.base.program.methods
          .addMint(mint)
          .accounts({
            glamState: statePda,
            newMint: mintPda,
          })
          .preInstructions([
            // FIXME: estimate compute units
            ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 }),
          ])
          .rpc();
      }),
    );
    console.log("addMintTxs", addMintTxs);
    return [txSig, statePda];
  }

  public async updateState(
    statePda: PublicKeyOrString,
    updated: Partial<StateModel>,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    console.log(
      `await glam.state.updateState("${statePda.toString()}", ${JSON.stringify(updated)}, ${JSON.stringify(txOptions)});`,
    );
    const tx = await this.updateStateTx(
      getPublicKey(statePda),
      updated,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async updateStateTx(
    statePda: PublicKey,
    updated: Partial<StateModel>,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const tx = await this.base.program.methods
      .updateState(new StateModel(updated))
      .accounts({
        state: statePda,
      })
      .transaction();
    return await this.base.intoVersionedTransaction(tx, txOptions);
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
      })
      .preInstructions(txOptions.preInstructions || [])
      .transaction();

    const vTx = await this.base.intoVersionedTransaction(tx, txOptions);
    return await this.base.sendAndConfirm(vTx);
  }

  /**
   * Create a full state model from a partial state model
   */
  enrichStateModel(partialStateModel: Partial<StateModel>): StateModel {
    const owner = this.base.getSigner();
    const defaultDate = new Date().toISOString().split("T")[0];

    partialStateModel.name = this.base.getName(partialStateModel);

    // createdKey = hash state name and get first 8 bytes
    // useful for computing state account PDA in the future
    partialStateModel.created = new CreatedModel({
      key: [
        ...Buffer.from(
          anchor.utils.sha256.hash(partialStateModel.name),
        ).subarray(0, 8),
      ],
    });

    partialStateModel.rawOpenfunds = new FundOpenfundsModel(
      partialStateModel.rawOpenfunds ?? {},
    );

    partialStateModel.owner = new ManagerModel({
      ...partialStateModel.owner,
      pubkey: owner,
    });

    partialStateModel.company = new CompanyModel({
      ...partialStateModel.company,
    });

    if (partialStateModel.mints?.length == 1) {
      const mint = partialStateModel.mints[0];
      partialStateModel.rawOpenfunds.fundCurrency =
        partialStateModel.rawOpenfunds?.fundCurrency ||
        mint.rawOpenfunds?.shareClassCurrency ||
        null;
    } else if (
      partialStateModel.mints?.length &&
      partialStateModel.mints.length > 1
    ) {
      throw new Error("Fund with more than 1 share class is not supported");
    }

    if (partialStateModel.enabled) {
      partialStateModel.rawOpenfunds.fundLaunchDate =
        partialStateModel.rawOpenfunds?.fundLaunchDate || defaultDate;
    }

    // fields containing fund id / pda
    const statePda = this.base.getStatePda(partialStateModel);
    partialStateModel.uri =
      partialStateModel.uri || `https://gui.glam.systems/products/${statePda}`;
    partialStateModel.metadata = new Metadata({
      ...partialStateModel.metadata,
      uri: `https://api.glam.systems/v0/openfunds?fund=${statePda}`,
      template: { openfunds: {} },
    });

    // build openfunds models for each share classes
    (partialStateModel.mints || []).forEach((mint: MintModel, i: number) => {
      if (mint.rawOpenfunds) {
        if (mint.rawOpenfunds.shareClassLifecycle === "active") {
          mint.rawOpenfunds.shareClassLaunchDate =
            mint.rawOpenfunds.shareClassLaunchDate || defaultDate;
        }
        mint.rawOpenfunds = new MintOpenfundsModel(mint.rawOpenfunds);
        mint.isRawOpenfunds = true;
      } else {
        mint.isRawOpenfunds = false;
      }

      const sharePda = this.base.getMintPda(statePda, i);
      mint.uri = `https://api.glam.systems/metadata/${sharePda}`;
      mint.statePubkey = statePda;
      mint.imageUri = `https://api.glam.systems/v0/sparkle?key=${sharePda}&format=png`;
    });

    // convert partial share class models to full share class models
    partialStateModel.mints = (partialStateModel.mints || []).map(
      (s) => new MintModel(s),
    );

    return new StateModel(partialStateModel, this.base.program.programId);
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
      delegateAcls: delegates.map((pubkey) => ({
        pubkey,
        permissions: [],
        expiresAt: new BN(0),
      })),
    });
    return await this.updateState(statePda, updated, txOptions);
  }

  public async upsertDelegateAcls(
    statePda: PublicKey,
    delegateAcls: DelegateAcl[],
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    return await this.updateState(statePda, { delegateAcls }, txOptions);
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
    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  /* Deposit & Withdraw */

  public async deposit(
    glamState: PublicKey | string,
    asset: PublicKey | string,
    amount: number | BN,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.depositTx(
      new PublicKey(glamState),
      new PublicKey(asset),
      amount,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async depositSol(
    glamState: PublicKey,
    lamports: number | BN,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(glamState);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: signer,
        toPubkey: vault,
        lamports:
          lamports instanceof BN ? BigInt(lamports.toString()) : lamports,
      }),
    );
    const vTx = await this.base.intoVersionedTransaction(tx, txOptions);
    return await this.base.sendAndConfirm(vTx);
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

    return await this.base.intoVersionedTransaction(tx, txOptions);
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

    const preInstructions = [
      createAssociatedTokenAccountIdempotentInstruction(
        signer,
        signerAta,
        signer,
        asset,
        tokenProgram,
      ),
    ];
    const postInstructions = [];

    if (asset.equals(WSOL)) {
      const wrapSolIx = await this.base.maybeWrapSol(statePda, amount, signer);
      if (wrapSolIx) {
        preInstructions.push(wrapSolIx);
        // If we need to wrap SOL, it means the wSOL balance will be drained,
        // and we close the wSOL token account for convenience
        postInstructions.push(
          await this.closeTokenAccountsIx(statePda, [
            this.base.getVaultAta(statePda, WSOL),
          ]),
        );
      }
    }

    const tx = await this.base.program.methods
      .withdraw(new BN(amount))
      .accounts({
        state: statePda,
        asset,
        tokenProgram,
      })
      .preInstructions(preInstructions)
      .postInstructions(postInstructions)
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }
}
