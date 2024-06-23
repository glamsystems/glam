import * as anchor from "@coral-xyz/anchor";
import {
  AnchorProvider,
  IdlAccounts,
  Program,
  Wallet,
} from "@coral-xyz/anchor";
import {
  AddressLookupTableAccount,
  BlockhashWithExpiryBlockHeight,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { getSimulationComputeUnits } from "@solana-developers/helpers";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { Glam, GlamIDL, GlamProgram, getGlamProgramId } from "../glamExports";
import { ClusterOrCustom, GlamClientConfig } from "../clientConfig";
import { FundModel, FundOpenfundsModel } from "../models";
import { AssetMeta, ASSETS_DEVNET, ASSETS_MAINNET } from "./assets";

type FundAccount = IdlAccounts<Glam>["fundAccount"];
type FundMetadataAccount = IdlAccounts<Glam>["fundMetadataAccount"];

export const JUPITER_API_DEFAULT = "https://quote-api.jup.ag/v6";
export const JITO_TIP_DEFAULT = new PublicKey(
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5"
);

export type ApiTxOptions = {
  signer?: PublicKey;
  computeUnitLimit?: number;
  computeUnitPriceMicroLamports?: number;
  jitoTipLamports?: number;
};

export class BaseClient {
  cluster: ClusterOrCustom;
  provider: anchor.Provider;
  program: GlamProgram;
  programId: PublicKey;
  jupiterApi: string;

  public constructor(config?: GlamClientConfig) {
    this.cluster = config?.cluster || "devnet";
    this.programId = getGlamProgramId(this.cluster);
    if (config?.provider) {
      this.provider = config.provider;
      this.program = new Program(
        GlamIDL,
        this.programId,
        this.provider
      ) as GlamProgram;
    } else {
      const defaultProvider = anchor.AnchorProvider.env();
      const url = defaultProvider.connection.rpcEndpoint;
      const connection = new Connection(url, {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 45000, // default timeout is 30s, we extend it to 45s
      });
      this.provider = new anchor.AnchorProvider(
        connection,
        defaultProvider.wallet,
        {
          ...defaultProvider.opts,
          commitment: "confirmed",
          preflightCommitment: "confirmed",
        }
      );
      anchor.setProvider(this.provider);
      this.program = anchor.workspace.Glam as GlamProgram;
    }

    this.jupiterApi = config?.jupiterApi || JUPITER_API_DEFAULT;
  }

  isMainnet(): boolean {
    return this.cluster === "mainnet-beta";
  }

  getAssetMeta(asset: string): AssetMeta {
    return (
      (this.isMainnet()
        ? ASSETS_MAINNET.get(asset)
        : ASSETS_DEVNET.get(asset)) || new AssetMeta()
    );
  }

  latestBlockhash?: BlockhashWithExpiryBlockHeight;
  async getLatestBlockhash(): Promise<BlockhashWithExpiryBlockHeight> {
    if (this.latestBlockhash !== undefined) {
      //TODO: better caching
      // right now we cache for 1 call, this is sufficient to create and send
      // one versioned transaction
      const latestBlockhash = this.latestBlockhash;
      this.latestBlockhash = undefined;
      return latestBlockhash;
    }
    this.latestBlockhash = await this.provider.connection.getLatestBlockhash();
    return this.latestBlockhash;
  }

  async intoVersionedTransaction({
    tx,
    lookupTables,
    computeUnitLimit,
    computeUnitPriceMicroLamports, // fee
    jitoTipLamports,
    signer,
    latestBlockhash,
  }: {
    tx: Transaction;
    lookupTables?: Array<AddressLookupTableAccount> | [];
    computeUnitLimit?: number;
    computeUnitPriceMicroLamports?: number;
    jitoTipLamports?: number;
    signer?: PublicKey;
    latestBlockhash?: BlockhashWithExpiryBlockHeight;
  }): Promise<VersionedTransaction> {
    if (lookupTables === undefined) {
      lookupTables = [];
    }
    if (signer === undefined) {
      signer = this.getManager();
    }
    if (latestBlockhash === undefined) {
      latestBlockhash = await this.getLatestBlockhash();
    }

    const connection = this.provider.connection;
    const instructions = tx.instructions;

    // Set Jito tip or compute unit price (or nothing)
    if (jitoTipLamports) {
      instructions.unshift(
        SystemProgram.transfer({
          fromPubkey: signer,
          toPubkey: JITO_TIP_DEFAULT,
          lamports: jitoTipLamports,
        })
      );
    } else if (computeUnitPriceMicroLamports) {
      instructions.unshift(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: computeUnitPriceMicroLamports,
        })
      );
    }

    // Set compute unit limit or autodetect by simulating the tx
    let units = computeUnitLimit || null;
    if (!computeUnitLimit) {
      try {
        units = await getSimulationComputeUnits(
          connection,
          instructions,
          signer,
          lookupTables
        );
      } catch (e) {
        // ignore
        // when we run tests with failure cases, this RPC call fails with
        // an incorrect error message so we should ignore it
        // in the regular case, if this errors the tx will have the default CUs
      }
    }
    if (units) {
      instructions.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units }));
    }

    const messageV0 = new TransactionMessage({
      payerKey: signer,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: instructions,
    }).compileToV0Message();
    return new VersionedTransaction(messageV0);
  }

  async sendAndConfirm(
    tx: VersionedTransaction,
    signer?: Keypair,
    latestBlockhash?: BlockhashWithExpiryBlockHeight
  ): Promise<TransactionSignature> {
    if (latestBlockhash === undefined) {
      latestBlockhash = await this.getLatestBlockhash();
    }
    // Anchor provider.sendAndConfirm forces a signature with the wallet, which we don't want
    // https://github.com/coral-xyz/anchor/blob/v0.30.0/ts/packages/anchor/src/provider.ts#L159
    tx.sign([signer || this.getWalletSigner()]);
    const connection = this.provider.connection;
    const signature = await connection.sendTransaction(tx); // can throw
    // await confirmation
    await connection.confirmTransaction({
      ...latestBlockhash,
      signature,
    });
    return signature; // when confirmed, or throw
  }

  getManager(): PublicKey {
    const managerPublicKey = this.provider?.publicKey;
    if (!managerPublicKey) {
      throw new Error("Manager public key cannot be retrieved from provider");
    }
    return managerPublicKey;
  }

  getManagerAta(mint: PublicKey, manager?: PublicKey): PublicKey {
    return getAssociatedTokenAddressSync(mint, manager || this.getManager());
  }

  getWalletSigner(): Keypair {
    return ((this.provider as AnchorProvider).wallet as Wallet).payer;
  }

  getFundModel(fund: any): FundModel {
    return new FundModel(fund) as FundModel;
  }

  getFundPDA(fundModel: FundModel): PublicKey {
    const createdKey = fundModel?.created?.key || [
      ...Buffer.from(
        anchor.utils.sha256.hash(this.getFundName(fundModel))
      ).slice(0, 8),
    ];

    const manager = this.getManager();
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("fund"),
        manager.toBuffer(),
        Uint8Array.from(createdKey),
      ],
      this.programId
    );
    return pda;
  }

  getTreasuryPDA(fundPDA: PublicKey): PublicKey {
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("treasury"), fundPDA.toBuffer()],
      this.programId
    );
    return pda;
  }

  getTreasuryAta(
    fundPDA: PublicKey,
    mint: PublicKey,
    programId?: PublicKey
  ): PublicKey {
    return getAssociatedTokenAddressSync(
      mint,
      this.getTreasuryPDA(fundPDA),
      true,
      programId
    );
  }

  getOpenfundsPDA(fundPDA: PublicKey): PublicKey {
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("openfunds"), fundPDA.toBuffer()],
      this.programId
    );
    return pda;
  }

  getShareClassPDA(fundPDA: PublicKey, shareId: number): PublicKey {
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("share"),
        Uint8Array.from([shareId % 256]),
        fundPDA.toBuffer(),
      ],
      this.programId
    );
    return pda;
  }

  getShareClassAta(user: PublicKey, shareClassPDA: PublicKey): PublicKey {
    return getAssociatedTokenAddressSync(
      shareClassPDA,
      user,
      true,
      TOKEN_2022_PROGRAM_ID
    );
  }

  getFundName(fundModel: FundModel) {
    return (
      fundModel.name ||
      fundModel.rawOpenfunds?.legalFundNameIncludingUmbrella ||
      fundModel.shareClasses[0]?.name ||
      ""
    );
  }

  enrichFundModelInitialize(fund: FundModel): FundModel {
    let fundModel = this.getFundModel(fund);

    // createdKey = hash fund name and get first 8 bytes
    const createdKey = [
      ...Buffer.from(
        anchor.utils.sha256.hash(this.getFundName(fundModel))
      ).slice(0, 8),
    ];
    fundModel.created = {
      key: createdKey,
      manager: null,
    };

    if (!fundModel.rawOpenfunds) {
      fundModel.rawOpenfunds = new FundOpenfundsModel({}) as FundOpenfundsModel;
    }

    if (fundModel.shareClasses?.length == 1) {
      // fund with a single share class
      const shareClass = fundModel.shareClasses[0];
      fundModel.name = fundModel.name || shareClass.name;

      fundModel.rawOpenfunds.fundCurrency =
        fundModel.rawOpenfunds?.fundCurrency ||
        shareClass.rawOpenfunds?.shareClassCurrency ||
        null;
    } else {
      // fund with multiple share classes
      // TODO
    }

    // computed fields

    if (fundModel.isEnabled) {
      fundModel.rawOpenfunds.fundLaunchDate =
        fundModel.rawOpenfunds?.fundLaunchDate ||
        new Date().toISOString().split("T")[0];
    }

    // fields containing fund id / pda
    const fundPDA = this.getFundPDA(fundModel);
    fundModel.uri =
      fundModel.uri || `https://devnet.glam.systems/products/${fundPDA}`;
    fundModel.openfundsUri =
      fundModel.openfundsUri ||
      `https://api.glam.systems/openfunds/${fundPDA}.xlsx`;

    // share classes
    fundModel.shareClasses.forEach((shareClass, i) => {
      if (
        shareClass.rawOpenfunds &&
        shareClass.rawOpenfunds.shareClassLifecycle === "active"
      ) {
        shareClass.rawOpenfunds.shareClassLaunchDate =
          shareClass.rawOpenfunds.shareClassLaunchDate ||
          new Date().toISOString().split("T")[0];
      }

      const sharePDA = this.getShareClassPDA(fundPDA, i);
      shareClass.uri = `https://api.glam.systems/metadata/${sharePDA}`;
      shareClass.imageUri = `https://api.glam.systems/image/${sharePDA}.png`;
    });

    return fundModel;
  }

  public async createFund(
    fund: any
  ): Promise<[TransactionSignature, PublicKey]> {
    let fundModel = this.enrichFundModelInitialize(fund);
    const fundPDA = this.getFundPDA(fundModel);
    const treasury = this.getTreasuryPDA(fundPDA);
    const openfunds = this.getOpenfundsPDA(fundPDA);
    const manager = this.getManager();

    const shareClasses = fundModel.shareClasses;
    fundModel.shareClasses = [];

    const txSig = await this.program.methods
      .initialize(fundModel)
      .accounts({
        fund: fundPDA,
        treasury,
        openfunds,
        manager,
      })
      .rpc();
    await Promise.all(
      shareClasses.map(async (shareClass, j) => {
        const shareClassMint = this.getShareClassPDA(fundPDA, j);
        return await this.program.methods
          .addShareClass(shareClass)
          .accounts({
            fund: fundPDA,
            shareClassMint,
            openfunds,
            manager,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
          })
          .preInstructions([
            ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 }),
          ])
          .rpc();
      })
    );
    return [txSig, fundPDA];
  }

  public async fetchFundAccount(fundPDA: PublicKey): Promise<FundAccount> {
    return this.program.account.fundAccount.fetch(fundPDA);
  }

  public async fetchFundMetadataAccount(
    fundPDA: PublicKey
  ): Promise<FundMetadataAccount> {
    const openfunds = this.getOpenfundsPDA(fundPDA);
    return this.program.account.fundMetadataAccount.fetch(openfunds);
  }

  remapKeyValueArray(vec: Array<any>): any {
    return vec.reduce((prev, el) => {
      prev[Object.keys(el.name)[0]] = el.value;
      return prev;
    }, {});
  }

  getOpenfundsFromAccounts(
    fundAccount: FundAccount,
    openfundsAccount: FundMetadataAccount
  ): any {
    let shareClasses = openfundsAccount.shareClasses.map((shareClass, i) => ({
      shareClassId: fundAccount.shareClasses[i],
      ...this.remapKeyValueArray(shareClass),
    }));
    let fundManagers = openfundsAccount.fundManagers.map((fundManager) => ({
      pubkey: fundAccount.manager,
      ...this.remapKeyValueArray(fundManager),
    }));

    const company = this.remapKeyValueArray(openfundsAccount.company);

    let openfund = {
      legalFundNameIncludingUmbrella: fundAccount.name,
      ...this.remapKeyValueArray(openfundsAccount.fund),
      company,
      fundManagers,
      shareClasses,
    };

    return openfund;
  }

  public async fetchFund(fundPDA: PublicKey): Promise<FundModel> {
    const fundAccount = await this.fetchFundAccount(fundPDA);
    const openfundsAccount = await this.fetchFundMetadataAccount(fundPDA);

    //TODO rebuild model from accounts
    let fundModel = this.getFundModel(fundAccount);
    fundModel.id = fundPDA;
    fundAccount.params[0].forEach((param) => {
      const name = Object.keys(param.name)[0];
      const value = Object.values(param.value)[0].val;
      //@ts-ignore
      fundModel[name] = value;
    });

    let fund = {
      ...fundModel,
      ...this.getOpenfundsFromAccounts(fundAccount, openfundsAccount),
    };

    // Add data from fund params to share classes
    fund.shareClasses = fund.shareClasses.map((shareClass: any, i: number) => {
      const fund_param_idx = 1 + i;
      shareClass.allowlist =
        fundAccount.params[fund_param_idx][0].value.vecPubkey?.val;
      shareClass.blocklist =
        fundAccount.params[fund_param_idx][1].value.vecPubkey?.val;
      return shareClass;
    });

    return fund;
  }
}
