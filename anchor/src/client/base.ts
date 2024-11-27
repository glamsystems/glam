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
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { getSimulationComputeUnits } from "../utils/helpers";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  unpackMint,
  Mint,
  getExtensionData,
  ExtensionType,
} from "@solana/spl-token";
import { TokenMetadata, unpack } from "@solana/spl-token-metadata";
import { WSOL, USDC } from "../constants";

import { Glam, GlamIDL, GlamProgram, getGlamProgramId } from "../glamExports";
import { ClusterOrCustom, GlamClientConfig } from "../clientConfig";
import { FundModel, FundOpenfundsModel } from "../models";
import { AssetMeta, ASSETS_MAINNET, ASSETS_TESTS } from "./assets";
import { GlamError } from "../error";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { BlockhashWithCache } from "../utils/blockhash";

// @ts-ignore
type FundAccount = IdlAccounts<Glam>["fundAccount"];
type FundMetadataAccount = IdlAccounts<Glam>["fundMetadataAccount"];

export const JUPITER_API_DEFAULT = "https://quote-api.jup.ag/v6";
export const JITO_TIP_DEFAULT = new PublicKey(
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
);
const DEFAULT_PRIORITY_FEE = 10_000; // microLamports

export const isBrowser =
  process.env.ANCHOR_BROWSER ||
  (typeof window !== "undefined" && !window.process?.hasOwnProperty("type"));

export type TxOptions = {
  signer?: PublicKey;
  computeUnitLimit?: number;
  getPriorityFeeMicroLamports?: (tx: VersionedTransaction) => Promise<number>;
  jitoTipLamports?: number;
};

export class BaseClient {
  cluster: ClusterOrCustom;
  provider: anchor.Provider;
  program: GlamProgram;
  programId: PublicKey;
  jupiterApi: string;
  blockhashWithCache: BlockhashWithCache;

  public constructor(config?: GlamClientConfig) {
    if (config?.provider) {
      this.provider = config?.provider;
      this.program = new Program(GlamIDL, this.provider) as GlamProgram;
    } else {
      const defaultProvider = anchor.AnchorProvider.env();
      const url = defaultProvider.connection.rpcEndpoint;
      const connection = new Connection(url, {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 45000, // default timeout is 30s, we extend it to 45s
      });
      this.provider = new anchor.AnchorProvider(
        connection,
        config?.wallet || defaultProvider.wallet,
        {
          ...defaultProvider.opts,
          commitment: "confirmed",
          preflightCommitment: "confirmed",
        },
      );
      anchor.setProvider(this.provider);
      this.program = anchor.workspace.Glam as GlamProgram;
    }

    // autodetect mainnet
    const defaultCluster = this.provider.connection.rpcEndpoint.includes(
      "mainnet",
    )
      ? "mainnet-beta"
      : "devnet";
    this.cluster = config?.cluster || defaultCluster;
    this.programId = getGlamProgramId(this.cluster);
    this.jupiterApi = config?.jupiterApi || JUPITER_API_DEFAULT;
    this.blockhashWithCache = new BlockhashWithCache(
      this.provider,
      !!isBrowser,
    );
  }

  isMainnet(): boolean {
    return this.cluster === "mainnet-beta";
  }

  isPhantom(): boolean {
    // TODO: Phantom can automatically estimates fees
    // https://docs.phantom.app/developer-powertools/solana-priority-fees#how-phantom-applies-priority-fees-to-dapp-transactions
    return false;
  }

  /**
   * Get metadata of an asset for pricing
   *
   * @param assetMint Token mint of the asset
   * @returns Metadata of the asset
   */
  getAssetMeta(assetMint: string): AssetMeta {
    return (
      (this.isMainnet()
        ? ASSETS_MAINNET.get(assetMint)
        : ASSETS_MAINNET.get(assetMint) || ASSETS_TESTS.get(assetMint)) ||
      new AssetMeta()
    );
  }

  async intoVersionedTransaction({
    tx,
    lookupTables,
    signer,
    computeUnitLimit,
    getPriorityFeeMicroLamports,
    jitoTipLamports,
    latestBlockhash,
  }: {
    tx: Transaction;
    lookupTables?: Array<AddressLookupTableAccount> | [];
    signer?: PublicKey;
    computeUnitLimit?: number;
    getPriorityFeeMicroLamports?: (tx: VersionedTransaction) => Promise<number>;
    jitoTipLamports?: number;
    latestBlockhash?: BlockhashWithExpiryBlockHeight;
  }): Promise<VersionedTransaction> {
    if (lookupTables === undefined) {
      lookupTables = [];
    }
    if (signer === undefined) {
      signer = this.getManager();
    }

    const instructions = tx.instructions;

    // Set Jito tip if provided
    if (jitoTipLamports) {
      instructions.unshift(
        SystemProgram.transfer({
          fromPubkey: signer,
          toPubkey: JITO_TIP_DEFAULT,
          lamports: jitoTipLamports,
        }),
      );
    }

    if (!this.isPhantom()) {
      // Set compute unit limit or autodetect by simulating the tx
      if (!computeUnitLimit) {
        try {
          computeUnitLimit = await getSimulationComputeUnits(
            this.provider.connection,
            instructions,
            signer,
            lookupTables,
          );
        } catch (e) {
          console.error(e);
          // ignore
          // when we run tests with failure cases, this RPC call fails with
          // an incorrect error message so we should ignore it
          // in the regular case, if this errors the tx will have the default CUs
        }
      }
      if (computeUnitLimit) {
        // ComputeBudgetProgram.setComputeUnitLimit costs 150 CUs
        // Add 20%/50% more CUs to account for logs (mainnet logs are less verbose)
        computeUnitLimit += 150;
        this.isMainnet()
          ? (computeUnitLimit *= 1.2)
          : (computeUnitLimit *= 1.5);
        instructions.unshift(
          ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnitLimit }),
        );
      }
    }

    const recentBlockhash = (
      latestBlockhash ? latestBlockhash : await this.blockhashWithCache.get()
    ).blockhash;

    let priorityFee = DEFAULT_PRIORITY_FEE;
    if (getPriorityFeeMicroLamports) {
      try {
        const fee = await getPriorityFeeMicroLamports(
          new VersionedTransaction(
            new TransactionMessage({
              payerKey: signer,
              recentBlockhash,
              instructions,
            }).compileToV0Message(lookupTables),
          ),
        );
        priorityFee = Math.ceil(fee);
      } catch (e) {}
    }
    console.log(`Priority fee: ${priorityFee} microLamports`);

    // Add the unit price instruction and return the final versioned transaction
    instructions.unshift(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee,
      }),
    );
    return new VersionedTransaction(
      new TransactionMessage({
        payerKey: signer,
        recentBlockhash,
        instructions,
      }).compileToV0Message(lookupTables),
    );
  }

  async sendAndConfirm(
    tx: VersionedTransaction | Transaction,
    signerOverride?: Keypair,
  ): Promise<TransactionSignature> {
    // This is just a convenient method so that in tests we can send legacy
    // txs, for example transfer SOL, create ATA, etc.
    if (tx instanceof Transaction) {
      return await sendAndConfirmTransaction(this.provider.connection, tx, [
        signerOverride || this.getWallet().payer,
      ]);
    }

    const connection = this.provider.connection;
    let serializedTx: Uint8Array;

    if (signerOverride) {
      tx.sign([signerOverride]);
      serializedTx = tx.serialize();
    } else {
      // Anchor provider.sendAndConfirm forces a signature with the wallet, which we don't want
      // https://github.com/coral-xyz/anchor/blob/v0.30.0/ts/packages/anchor/src/provider.ts#L159
      const wallet = this.getWallet();
      const signedTx = await wallet.signTransaction(tx);
      serializedTx = signedTx.serialize();
    }

    const txSig = await connection.sendRawTransaction(serializedTx, {
      // skip simulation since we just did it to compute CUs
      // however this means that we need to reconstruct the error, if
      // the tx fails on chain execution.
      skipPreflight: true,
    });

    // await confirmation
    const latestBlockhash = await this.blockhashWithCache.get();
    const res = await connection.confirmTransaction({
      ...latestBlockhash,
      signature: txSig,
    });

    // if the tx fails, throw an error including logs
    if (res.value.err) {
      const errTx = await connection.getTransaction(txSig, {
        maxSupportedTransactionVersion: 0,
      });
      throw new GlamError(
        this.parseProgramLogs(errTx?.meta?.logMessages),
        errTx?.meta?.err || undefined,
        errTx?.meta?.logMessages || [],
      );
    }
    return txSig;
  }

  parseProgramLogs(logs?: null | string[]): string {
    const errorMsgLog = (logs || []).find((log) =>
      log.includes("Error Message:"),
    );

    console.log("error message from program logs", errorMsgLog);

    if (errorMsgLog) {
      return errorMsgLog.split("Error Message:")[1].trim();
    }

    return "Unknown error";
  }

  getWallet(): Wallet {
    return (this.provider as AnchorProvider).wallet as Wallet;
  }

  getSigner(): PublicKey {
    const publicKey = this.provider?.publicKey;
    if (!publicKey) {
      throw new Error("Signer public key cannot be retrieved from provider");
    }
    return publicKey;
  }

  //@deprecated
  getManager(): PublicKey {
    const managerPublicKey = this.provider?.publicKey;
    if (!managerPublicKey) {
      throw new Error("Manager public key cannot be retrieved from provider");
    }
    return managerPublicKey;
  }

  getManagerAta(
    mint: PublicKey,
    manager?: PublicKey,
    tokenProgram = TOKEN_PROGRAM_ID,
  ): PublicKey {
    return getAssociatedTokenAddressSync(
      mint,
      manager || this.getManager(),
      true,
      tokenProgram,
    );
  }

  getFundModel(fund: any): FundModel {
    //@ts-ignore
    return new FundModel(fund);
  }

  getFundPDA(fundModel: FundModel): PublicKey {
    const createdKey = fundModel?.created?.key || [
      ...Buffer.from(
        anchor.utils.sha256.hash(this.getFundName(fundModel)),
      ).subarray(0, 8),
    ];

    const manager = this.getManager();
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("fund"),
        manager.toBuffer(),
        Uint8Array.from(createdKey),
      ],
      this.programId,
    );
    return pda;
  }

  getTreasuryPDA(fundPDA: PublicKey): PublicKey {
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("treasury"), fundPDA.toBuffer()],
      this.programId,
    );
    return pda;
  }

  getTreasuryAta(
    fundPDA: PublicKey,
    mint: PublicKey,
    programId?: PublicKey,
  ): PublicKey {
    return getAssociatedTokenAddressSync(
      mint,
      this.getTreasuryPDA(fundPDA),
      true,
      programId,
    );
  }

  async listTokenAccounts(owner: PublicKey): Promise<any> {
    const [tokenAccounts, token2022Accounts] = await Promise.all(
      [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].map(
        async (programId) =>
          await this.provider.connection.getParsedTokenAccountsByOwner(owner, {
            programId,
          }),
      ),
    );
    const merged = tokenAccounts.value.concat(token2022Accounts.value);
    return merged.map((accountInfo) => {
      const accountData = accountInfo.account.data.parsed.info;
      return {
        address: accountInfo.pubkey,
        mint: accountData.mint,
        decimals: accountData.tokenAmount.decimals,
        amount: accountData.tokenAmount.amount,
        uiAmount: accountData.tokenAmount.uiAmountString,
      };
    });
  }

  async getTreasuryBalance(fundPDA: PublicKey): Promise<number> {
    const treasury = this.getTreasuryPDA(fundPDA);
    const lamports = await this.provider.connection.getBalance(treasury);
    return lamports / LAMPORTS_PER_SOL;
  }

  async getTreasuryTokenBalance(
    fundPDA: PublicKey,
    mint: PublicKey,
    programId?: PublicKey,
  ): Promise<number> {
    const ata = this.getTreasuryAta(fundPDA, mint);
    const _mint = await getMint(this.provider.connection, mint);
    try {
      const account = await getAccount(this.provider.connection, ata);
      return Number(account.amount) / Math.pow(10, _mint.decimals);
    } catch (e) {
      if (e instanceof TokenAccountNotFoundError) {
        return 0;
      }
      throw e;
    }
  }

  getOpenfundsPDA(fundPDA: PublicKey): PublicKey {
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("openfunds"), fundPDA.toBuffer()],
      this.programId,
    );
    return pda;
  }

  getShareClassPDA(fundPDA: PublicKey, shareId: number = 0): PublicKey {
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("share"),
        Uint8Array.from([shareId % 256]),
        fundPDA.toBuffer(),
      ],
      this.programId,
    );
    return pda;
  }

  getShareClassAta(user: PublicKey, shareClassPDA: PublicKey): PublicKey {
    return getAssociatedTokenAddressSync(
      shareClassPDA,
      user,
      true,
      TOKEN_2022_PROGRAM_ID,
    );
  }

  getFundName(fundModel: FundModel) {
    return (
      // @ts-ignore
      fundModel.name ||
      fundModel.rawOpenfunds?.legalFundNameIncludingUmbrella ||
      fundModel.legalFundNameIncludingUmbrella ||
      fundModel.shareClasses[0]?.name ||
      ""
    );
  }

  enrichFundModelInitialize(fund: FundModel): FundModel {
    let fundModel = this.getFundModel(fund);

    // createdKey = hash fund name and get first 8 bytes
    const createdKey = [
      ...Buffer.from(
        anchor.utils.sha256.hash(this.getFundName(fundModel)),
      ).subarray(0, 8),
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
      fundModel.uri || `https://gui.glam.systems/products/${fundPDA}`;
    fundModel.openfundsUri =
      fundModel.openfundsUri ||
      `https://api.glam.systems/v0/openfunds?fund=${fundPDA}&format=csv`;

    // share classes
    fundModel.shareClasses.forEach((shareClass: any, i: number) => {
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
      shareClass.imageUri = `https://api.glam.systems/v0/sparkle?key=${sharePDA}&format=png`;
    });

    return fundModel;
  }

  public async createFund(
    fund: any,
    singleTx: boolean = false,
    txOpitons = {},
  ): Promise<[TransactionSignature, PublicKey]> {
    let fundModel = this.enrichFundModelInitialize(fund);

    const fundPDA = this.getFundPDA(fundModel);
    const treasury = this.getTreasuryPDA(fundPDA);
    const openfunds = this.getOpenfundsPDA(fundPDA);
    const manager = this.getManager();

    const shareClasses = fundModel.shareClasses;
    fundModel.shareClasses = [];

    if (shareClasses.length > 1) {
      throw new Error("Multiple share classes not supported");
    }

    if (shareClasses.length == 1) {
      if (singleTx) {
        const initFundIx = await this.program.methods
          .initializeFund(fundModel)
          .accounts({
            //@ts-ignore IDL ts type is unhappy
            fund: fundPDA,
            treasury,
            openfunds,
            manager,
          })
          .instruction();

        const shareClassMint = this.getShareClassPDA(fundPDA, 0);
        const tx = await this.program.methods
          .addShareClass(shareClasses[0])
          .accounts({
            fund: fundPDA,
            shareClassMint,
            openfunds,
            //@ts-ignore IDL ts type is unhappy
            manager,
          })
          .preInstructions([initFundIx])
          .transaction();

        const vTx = await this.intoVersionedTransaction({ tx, ...txOpitons });
        const txSig = await this.sendAndConfirm(vTx);

        return [txSig, fundPDA];
      }

      const createFundTxSig = await this.program.methods
        .initializeFund(fundModel)
        .accounts({
          //@ts-ignore IDL ts type is unhappy
          fund: fundPDA,
          treasury,
          openfunds,
          manager,
        })
        .rpc();

      const shareClassMint = this.getShareClassPDA(fundPDA, 0);
      const createSharClassTxSig = await this.program.methods
        .addShareClass(shareClasses[0])
        .accounts({
          fund: fundPDA,
          shareClassMint,
          openfunds,
          //@ts-ignore IDL ts type is unhappy
          manager,
        })
        .preInstructions([
          ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
        ])
        .rpc();
      return [createFundTxSig, fundPDA];
    }

    // No share classes, only initialize the fund
    const tx = await this.program.methods
      .initializeFund(fundModel)
      .accounts({
        //@ts-ignore IDL ts type is unhappy
        fund: fundPDA,
        treasury,
        openfunds,
        manager,
      })
      .transaction();
    const vTx = await this.intoVersionedTransaction({ tx, ...txOpitons });
    const txSig = await this.sendAndConfirm(vTx);
    return [txSig, fundPDA];
  }

  public async fetchFundAccount(fundPDA: PublicKey): Promise<FundAccount> {
    return this.program.account.fundAccount.fetch(fundPDA);
  }

  public async fetchFundMetadataAccount(
    fundPDA: PublicKey,
  ): Promise<FundMetadataAccount> {
    const openfunds = this.getOpenfundsPDA(fundPDA);
    return this.program.account.fundMetadataAccount.fetch(openfunds);
  }

  public async fetchShareClassAccount(
    fundPDA: PublicKey,
    shareId: number,
  ): Promise<Mint> {
    const shareClassMint = this.getShareClassPDA(fundPDA, shareId);
    const connection = this.provider.connection;
    return await getMint(
      connection,
      shareClassMint,
      connection.commitment,
      TOKEN_2022_PROGRAM_ID,
    );
  }

  getAssetIdFromCurrency(currency: string): string {
    switch (currency.toUpperCase()) {
      case "SOL":
      case "WSOL":
        return WSOL.toBase58();
      case "USD":
      case "USDC":
        return USDC.toBase58();
    }
    return "";
  }

  remapKeyValueArray(vec: Array<any>): any {
    return vec.reduce((prev, el) => {
      prev[Object.keys(el.name)[0]] = el.value;
      return prev;
    }, {});
  }

  getOpenfundsFromAccounts(
    fundAccount: FundAccount,
    openfundsAccount: FundMetadataAccount,
    mints: any[],
  ): any {
    let shareClasses = fundAccount.shareClasses.map(
      (_shareClassFromFund, i) => {
        const shareClassMeta = openfundsAccount.shareClasses[i] || [];
        let shareClassSymbol;
        let shareClassSupply;
        let shareClassDecimals;
        let shareClassCurrencyId;
        let hasPermanentDelegate;
        let permanentDelegate;

        const mint = mints[i];
        if (mint) {
          const data = getExtensionData(
            ExtensionType.TokenMetadata,
            mint.tlvData,
          );
          const metadata = data ? unpack(data) : ({} as TokenMetadata);
          permanentDelegate = getExtensionData(
            ExtensionType.PermanentDelegate,
            mint.tlvData,
          );

          shareClassSymbol = metadata?.symbol;
          shareClassSupply = mint.supply;
          shareClassDecimals = mint.decimals;
          hasPermanentDelegate = permanentDelegate ? "yes" : "no";
        }

        const remapped = this.remapKeyValueArray(shareClassMeta);
        shareClassCurrencyId = this.getAssetIdFromCurrency(
          remapped?.shareClassCurrency || "",
        );

        (fundAccount.params[i + 1] || []).forEach((param) => {
          const name = Object.keys(param.name)[0];
          //@ts-ignore
          const value = Object.values(param.value)[0].val;
          //@ts-ignore
          remapped[name] = value;
        });

        return {
          id: fundAccount.shareClasses[i],
          // custom share class fields
          shareClassId: fundAccount.shareClasses[i].toBase58(),
          shareClassSymbol,
          shareClassSupply,
          shareClassDecimals,
          shareClassCurrencyId,
          permanentDelegate: permanentDelegate
            ? new PublicKey(permanentDelegate)
            : null,
          hasPermanentDelegate,
          lockUpPeriodInSeconds: remapped.lockUp,
          ...remapped,
        };
      },
    );
    let fundManagers = openfundsAccount.fundManagers.map((fundManager) => ({
      pubkey: fundAccount.manager,
      portfolioManagerId: fundAccount.manager.toBase58(),
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

  public async listFunds(): Promise<PublicKey[]> {
    const bytes = Uint8Array.from([
      0x31, 0x68, 0xa8, 0xd6, 0x86, 0xb4, 0xad, 0x9a,
    ]);
    const accounts = await this.provider.connection.getParsedProgramAccounts(
      this.programId,
      {
        filters: [{ memcmp: { offset: 0, bytes: bs58.encode(bytes) } }],
      },
    );
    return accounts.map((a) => a.pubkey);
  }

  fundModelFromAccounts(
    fundPDA: PublicKey,
    fundAccount: FundAccount,
    openfundsAccount: FundMetadataAccount,
    firstShareClass: Mint,
  ): FundModel {
    //TODO rebuild model from accounts
    let fundModel = this.getFundModel(fundAccount);
    fundModel.id = fundPDA;
    fundAccount.params[0].forEach((param) => {
      const name = Object.keys(param.name)[0];
      //@ts-ignore
      const value = Object.values(param.value)[0].val;
      fundModel[name] = value;
    });

    let fund = {
      ...fundModel,
      fundId: fundPDA,
      idStr: fundPDA.toBase58(),
      treasuryId: fundAccount.treasury.toBase58(),
      openfundsMetadataId: fundAccount.openfunds.toBase58(),
      fundUri: `https://playground.glam.systems/products/${fundPDA}`,
      //@ts-ignore
      imageKey: (fundAccount.shareClasses[0] || fundPDA).toBase58(),
      ...this.getOpenfundsFromAccounts(fundAccount, openfundsAccount, [
        firstShareClass,
      ]),
    };
    fund.name = this.getFundName(fund);

    //TODO: this is no longer FundModel, we should create a proper type
    return fund;
  }

  public async fetchFund(fundPDA: PublicKey): Promise<FundModel> {
    const fundAccount = await this.fetchFundAccount(fundPDA);
    const openfundsAccount = await this.fetchFundMetadataAccount(fundPDA);
    const firstShareClass = await this.fetchShareClassAccount(fundPDA, 0);
    return this.fundModelFromAccounts(
      fundPDA,
      fundAccount,
      openfundsAccount,
      firstShareClass,
    );
  }

  public async fetchAllFunds(): Promise<FundModel[]> {
    const fundAccounts = await this.program.account.fundAccount.all();
    const openfundsAccounts =
      await this.program.account.fundMetadataAccount.all();
    let openfundsCache = new Map<string, FundMetadataAccount>();
    (openfundsAccounts || []).forEach((of) => {
      openfundsCache.set(of.publicKey.toBase58(), of.account);
    });

    /* fetch first mint */
    let mintCache = new Map<string, Mint>();
    const connection = this.provider.connection;
    const mintAddresses = (fundAccounts || [])
      .map((f) => f.account.shareClasses[0])
      .filter((addr) => !!addr);
    const mintAccounts =
      await connection.getMultipleAccountsInfo(mintAddresses);
    (mintAccounts || []).forEach((info, j) => {
      const mintInfo = unpackMint(
        mintAddresses[j],
        info,
        TOKEN_2022_PROGRAM_ID,
      );
      mintCache.set(mintAddresses[j].toBase58(), mintInfo);
    });

    const funds = (fundAccounts || []).map((f) =>
      this.fundModelFromAccounts(
        f.publicKey,
        f.account,
        openfundsCache.get(f.account.openfunds.toBase58()) ||
          ({} as FundMetadataAccount),
        mintCache.get(
          f.account.shareClasses[0] ? f.account.shareClasses[0].toBase58() : "",
        ) || ({} as Mint),
      ),
    );

    return funds;
  }
}
