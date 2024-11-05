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

import {
  Glam,
  GlamIDL,
  GlamProgram,
  getGlamProgramId,
  GLAM_FORCE_MAINNET,
} from "../glamExports";
import { ClusterOrCustom, GlamClientConfig } from "../clientConfig";
import { FundModel, FundOpenfundsModel } from "../models";
import { AssetMeta, ASSETS_MAINNET, ASSETS_TESTS } from "./assets";
import base58 from "bs58";
import { GlamError } from "../error";

// @ts-ignore
type FundAccount = IdlAccounts<Glam>["fundAccount"];
type FundMetadataAccount = IdlAccounts<Glam>["fundMetadataAccount"];

export const JUPITER_API_DEFAULT = "https://quote-api.jup.ag/v6";
export const JITO_TIP_DEFAULT = new PublicKey(
  "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5"
);

export const isBrowser =
  process.env.ANCHOR_BROWSER ||
  (typeof window !== "undefined" && !window.process?.hasOwnProperty("type"));

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
        }
      );
      anchor.setProvider(this.provider);
      this.program = anchor.workspace.Glam as GlamProgram;
    }

    // autodetect mainnet
    const defaultCluster = this.provider.connection.rpcEndpoint.includes(
      "mainnet"
    )
      ? "mainnet-beta"
      : "devnet";
    this.cluster = config?.cluster || defaultCluster;
    this.programId = getGlamProgramId(this.cluster);
    this.jupiterApi = config?.jupiterApi || JUPITER_API_DEFAULT;
  }

  isMainnet(): boolean {
    return GLAM_FORCE_MAINNET || this.cluster === "mainnet-beta";
  }

  getAssetMeta(asset: string): AssetMeta {
    return (
      (this.isMainnet()
        ? ASSETS_MAINNET.get(asset)
        : ASSETS_MAINNET.get(asset) || ASSETS_TESTS.get(asset)) ||
      new AssetMeta()
    );
  }

  async getLatestBlockhash(): Promise<BlockhashWithExpiryBlockHeight> {
    if (isBrowser) {
      const CACHE_KEY = "/glam/blockhash/get";
      const glamCache = await window.caches.open("glam");
      const response = await glamCache.match(CACHE_KEY);
      if (response) {
        const { blockhash, expiresAt } = await response.json();
        console.log(`blockhash ${blockhash} expires at`, expiresAt);
        if (expiresAt > Date.now()) {
          console.log("blockhash cache hit");
          return blockhash;
        }
      }

      const blockhash = await this.provider.connection.getLatestBlockhash();
      console.log("blockhash cache miss, fetched from blockchain:", blockhash);
      // The maximum age of a transaction's blockhash is 150 blocks (~1 minute assuming 400ms block times).
      // We cache it for 15 seconds to be safe.
      await glamCache.put(
        CACHE_KEY,
        new Response(
          JSON.stringify({ blockhash, expiresAt: Date.now() + 1000 * 15 }),
          { headers: { "Content-Type": "application/json" } }
        )
      );
      return blockhash;
    }

    // Cache not needed in nodejs environment
    return await this.provider.connection.getLatestBlockhash();
  }

  async intoVersionedTransaction({
    tx,
    lookupTables,
    computeUnitLimit,
    computeUnitPriceMicroLamports = 50_000, // fee
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
    latestBlockhash = await this.getLatestBlockhash();

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

    // TODO: Phantom can automatically estimates fees
    // https://docs.phantom.app/developer-powertools/solana-priority-fees#how-phantom-applies-priority-fees-to-dapp-transactions
    const isPhantom = false;
    if (!isPhantom) {
      // Set compute unit limit or autodetect by simulating the tx
      const connection = this.provider.connection;
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
        // ComputeBudgetProgram.setComputeUnitLimit costs 150 CUs
        units += 150;
        // More CUs for tests as logs are more verbose
        !this.isMainnet() && (units += 10_000);
        instructions.unshift(
          ComputeBudgetProgram.setComputeUnitLimit({ units })
        );
      }
    }

    const messageV0 = new TransactionMessage({
      payerKey: signer,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: instructions,
    }).compileToV0Message();
    return new VersionedTransaction(messageV0);
  }

  async sendAndConfirm(
    tx: VersionedTransaction | Transaction,
    signerOverride?: Keypair
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
    }

    // await confirmation
    const latestBlockhash = await this.getLatestBlockhash();
    const res = await connection.confirmTransaction({
      ...latestBlockhash,
      signature: txSig,
    });

    // if the tx fails, throw an error including logs
    if (res.value.err) {
      const errTx = await connection.getTransaction(txSig, {
        maxSupportedTransactionVersion: 0,
      });
      throw {
        rawError: errTx?.meta?.err,
        programLogs: errTx?.meta?.logMessages,
        message: this.parseProgramLogs(errTx?.meta?.logMessages),
      } as GlamError;
    }
    return txSig;
  }

  parseProgramLogs(logs?: null | string[]): string {
    const errorMsgLog = (logs || []).find((log) =>
      log.includes("Error Message:")
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
    tokenProgram = TOKEN_PROGRAM_ID
  ): PublicKey {
    return getAssociatedTokenAddressSync(
      mint,
      manager || this.getManager(),
      true,
      tokenProgram
    );
  }

  getFundModel(fund: any): FundModel {
    //@ts-ignore
    return new FundModel(fund);
  }

  getFundPDA(fundModel: FundModel): PublicKey {
    const createdKey = fundModel?.created?.key || [
      ...Buffer.from(
        anchor.utils.sha256.hash(this.getFundName(fundModel))
      ).subarray(0, 8),
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

  async listTokenAccounts(owner: PublicKey): Promise<any> {
    const [tokenAccounts, token2022Accounts] = await Promise.all(
      [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].map(
        async (programId) =>
          await this.provider.connection.getParsedTokenAccountsByOwner(owner, {
            programId,
          })
      )
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
    programId?: PublicKey
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
      // @ts-ignore
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
      `https://rest.glam.systems/v0/openfunds?fund=${fundPDA}&format=csv`;

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
      shareClass.uri = `https://rest.glam.systems/metadata/${sharePDA}`;
      shareClass.imageUri = `https://rest.glam.systems/v0/sparkle?key=${sharePDA}&format=png`;
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
        const shareClassMint = this.getShareClassPDA(fundPDA, j);
        return await this.program.methods
          .addShareClass(shareClass)
          .accounts({
            fund: fundPDA,
            shareClassMint,
            openfunds,
            //@ts-ignore IDL ts type is unhappy
            manager,
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

  public async fetchShareClassAccount(
    fundPDA: PublicKey,
    shareId: number
  ): Promise<Mint> {
    const shareClassMint = this.getShareClassPDA(fundPDA, shareId);
    const connection = this.provider.connection;
    return await getMint(
      connection,
      shareClassMint,
      connection.commitment,
      TOKEN_2022_PROGRAM_ID
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
    mints: any[]
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
            mint.tlvData
          );
          const metadata = data ? unpack(data) : ({} as TokenMetadata);
          permanentDelegate = getExtensionData(
            ExtensionType.PermanentDelegate,
            mint.tlvData
          );

          shareClassSymbol = metadata?.symbol;
          shareClassSupply = mint.supply;
          shareClassDecimals = mint.decimals;
          hasPermanentDelegate = permanentDelegate ? "yes" : "no";
        }

        const remapped = this.remapKeyValueArray(shareClassMeta);
        shareClassCurrencyId = this.getAssetIdFromCurrency(
          remapped?.shareClassCurrency || ""
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
      }
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
        filters: [{ memcmp: { offset: 0, bytes: base58.encode(bytes) } }],
      }
    );
    return accounts.map((a) => a.pubkey);
  }

  fundModelFromAccounts(
    fundPDA: PublicKey,
    fundAccount: FundAccount,
    openfundsAccount: FundMetadataAccount,
    firstShareClass: Mint
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
      firstShareClass
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
    const mintAccounts = await connection.getMultipleAccountsInfo(
      mintAddresses
    );
    (mintAccounts || []).forEach((info, j) => {
      const mintInfo = unpackMint(
        mintAddresses[j],
        info,
        TOKEN_2022_PROGRAM_ID
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
          f.account.shareClasses[0] ? f.account.shareClasses[0].toBase58() : ""
        ) || ({} as Mint)
      )
    );

    return funds;
  }

  public async deleteDelegateAcls(
    fundPDA: PublicKey,
    keys: PublicKey[]
  ): Promise<TransactionSignature> {
    let updatedFund = this.getFundModel({
      delegateAcls: keys.map((key) => ({ pubkey: key, permissions: [] })),
    });
    return await this.program.methods
      .updateFund(updatedFund)
      .accounts({
        fund: fundPDA,
        signer: this.getManager(),
      })
      .rpc();
  }

  public async upsertDelegateAcls(
    fundPDA: PublicKey,
    delegateAcls: any[]
  ): Promise<TransactionSignature> {
    let updatedFund = this.getFundModel({ delegateAcls });
    return await this.program.methods
      .updateFund(updatedFund)
      .accounts({
        fund: fundPDA,
        signer: this.getManager(),
      })
      .rpc();
  }

  public async updateFund(
    fundPDA: PublicKey,
    updated: any
  ): Promise<TransactionSignature> {
    let updatedFund = this.getFundModel(updated);

    return await this.program.methods
      .updateFund(updatedFund)
      .accounts({
        fund: fundPDA,
        signer: this.getManager(),
      })
      .rpc();
  }
}
