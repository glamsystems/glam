import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
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
} from "@solana/spl-token";
import {
  WSOL,
  USDC,
  SEED_STATE,
  SEED_VAULT,
  SEED_METADATA,
  SEED_MINT,
} from "../constants";

import { GlamProgram, getGlamProgram } from "../glamExports";
import { ClusterNetwork, GlamClientConfig } from "../clientConfig";
import { StateAccount, OpenfundsMetadataAccount, StateModel } from "../models";
import { AssetMeta, ASSETS_MAINNET, ASSETS_TESTS } from "./assets";
import { GlamError } from "../error";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { BlockhashWithCache } from "../utils/blockhash";

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
  maxFeeLamports?: number;
  useMaxFee?: boolean;
  jitoTipLamports?: number;
  preInstructions?: TransactionInstruction[];
  lookupTables?: AddressLookupTableAccount[];
  simulate?: boolean;
};

export type TokenAccount = {
  owner: PublicKey;
  pubkey: PublicKey; // ata
  mint: PublicKey;
  programId: PublicKey;
  decimals: number;
  amount: string;
  uiAmount: number;
  frozen: boolean;
};

export class BaseClient {
  cluster: ClusterNetwork;
  provider: anchor.Provider;
  program: GlamProgram;
  jupiterApi: string;
  blockhashWithCache: BlockhashWithCache;

  public constructor(config?: GlamClientConfig) {
    if (config?.provider) {
      this.provider = config?.provider;
    } else {
      const defaultProvider = anchor.AnchorProvider.env();
      const url = defaultProvider.connection.rpcEndpoint;
      const connection = new Connection(url, { commitment: "confirmed" });
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
    }

    this.cluster = config?.cluster || this.detectedCluster;
    this.program = getGlamProgram(this.cluster, this.provider);

    this.jupiterApi = config?.jupiterApi || JUPITER_API_DEFAULT;
    this.blockhashWithCache = new BlockhashWithCache(
      this.provider,
      !!isBrowser,
    );
  }

  get detectedCluster(): ClusterNetwork {
    const rpcUrl = this.provider.connection.rpcEndpoint;
    if (rpcUrl.includes("devnet")) {
      return ClusterNetwork.Devnet;
    }
    if (rpcUrl.includes("localhost") || rpcUrl.includes("127.0.0.1")) {
      return ClusterNetwork.Custom;
    }
    return ClusterNetwork.Mainnet;
  }

  isMainnet(): boolean {
    return this.cluster === ClusterNetwork.Mainnet;
  }

  isPhantom(): boolean {
    if (!isBrowser) return false;

    // TODO: remove when we can bypass from settings
    return false;

    // Phantom automatically estimates fees
    // https://docs.phantom.app/developer-powertools/solana-priority-fees#how-phantom-applies-priority-fees-to-dapp-transactions
    return (
      // @ts-ignore
      window?.phantom?.solana?.isPhantom && window?.phantom?.solana?.isConnected
    );
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

  private async getComputeBudgetIxs(
    vTx: VersionedTransaction,
    computeUnitLimit: number,
    getPriorityFeeMicroLamports?: (tx: VersionedTransaction) => Promise<number>,
    maxFeeLamports?: number,
    useMaxFee?: boolean,
  ): Promise<Array<TransactionInstruction>> {
    if (this.isPhantom()) {
      return [] as Array<TransactionInstruction>;
    }

    // ComputeBudgetProgram.setComputeUnitLimit costs 150 CUs
    // Add 20% more CUs to account for variable execution
    computeUnitLimit += 150;
    computeUnitLimit *= 1.2;

    let priorityFeeMicroLamports = DEFAULT_PRIORITY_FEE;
    if (useMaxFee && maxFeeLamports) {
      priorityFeeMicroLamports = Math.ceil(
        (maxFeeLamports * 1_000_000) / computeUnitLimit,
      );
    } else if (getPriorityFeeMicroLamports) {
      try {
        const feeEstimate = await getPriorityFeeMicroLamports(vTx);
        if (
          maxFeeLamports &&
          feeEstimate * computeUnitLimit > maxFeeLamports * 1_000_000
        ) {
          priorityFeeMicroLamports = Math.ceil(
            (maxFeeLamports * 1_000_000) / computeUnitLimit,
          );
          console.log(
            `Estimated priority fee: (${feeEstimate} microLamports per CU, ${computeUnitLimit} CUs, total ${(feeEstimate * computeUnitLimit) / 1_000_000} lamports)`,
          );
          console.log(
            `Estimated total fee is than max fee (${maxFeeLamports} lamports). Overriding priority fee to ${priorityFeeMicroLamports} microLamports.`,
          );
        } else {
          priorityFeeMicroLamports = Math.ceil(feeEstimate);
        }
      } catch (e) {}
    }
    console.log(
      `Final priority fee to use: ${priorityFeeMicroLamports} microLamports`,
    );

    return [
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFeeMicroLamports,
      }),
      ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnitLimit }),
    ];
  }

  async intoVersionedTransaction(
    tx: Transaction,
    {
      lookupTables,
      signer,
      computeUnitLimit,
      getPriorityFeeMicroLamports,
      maxFeeLamports,
      useMaxFee = false,
      jitoTipLamports,
      simulate = false,
    }: TxOptions,
  ): Promise<VersionedTransaction> {
    signer = signer || this.getSigner();

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

    const recentBlockhash = (await this.blockhashWithCache.get()).blockhash;

    try {
      computeUnitLimit = await getSimulationComputeUnits(
        this.provider.connection,
        instructions,
        signer,
        lookupTables,
      );
    } catch (e) {
      // by default, a simulation error doesn't prevent the tx from being sent
      // - when we run tests with failure cases, this RPC call fails with an incorrect error message so we should ignore it by default
      // - gui: wallet apps usually do the simulation themselves, we should ignore the simulation error here by default
      // - cli: we should set simulate=true
      if (simulate) throw e;
    }

    if (computeUnitLimit) {
      const vTx = new VersionedTransaction(
        new TransactionMessage({
          payerKey: signer,
          recentBlockhash,
          instructions,
        }).compileToV0Message(lookupTables),
      );
      const cuIxs = await this.getComputeBudgetIxs(
        vTx,
        computeUnitLimit,
        getPriorityFeeMicroLamports,
        maxFeeLamports,
        useMaxFee,
      );
      instructions.unshift(...cuIxs);
    }

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
    const connection = this.provider.connection;

    // Mainnet only: use dedicated connection for sending transactions if available
    const txConnection =
      this.cluster === ClusterNetwork.Mainnet
        ? new Connection(
            process.env?.NEXT_PUBLIC_TX_RPC ||
              process.env.TX_RPC ||
              connection.rpcEndpoint,
            {
              commitment: "confirmed",
            },
          )
        : connection;

    // This is just a convenient method so that in tests we can send legacy
    // txs, for example transfer SOL, create ATA, etc.
    if (tx instanceof Transaction) {
      return await sendAndConfirmTransaction(txConnection, tx, [
        signerOverride || this.getWallet().payer,
      ]);
    }

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

    const txSig = await txConnection.sendRawTransaction(serializedTx, {
      // skip simulation since we just did it to compute CUs
      // however this means that we need to reconstruct the error, if
      // the tx fails on chain execution.
      skipPreflight: true,
    });

    // await confirmation
    console.log("Confirming tx:", txSig);
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

  async getAdressLookupTableAccounts(
    keys?: string[],
  ): Promise<AddressLookupTableAccount[]> {
    if (!keys) {
      throw new Error("addressLookupTableAddresses is undefined");
    }

    const addressLookupTableAccountInfos =
      await this.provider.connection.getMultipleAccountsInfo(
        keys.map((key) => new PublicKey(key)),
      );

    return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
      const addressLookupTableAddress = keys[index];
      if (accountInfo) {
        const addressLookupTableAccount = new AddressLookupTableAccount({
          key: new PublicKey(addressLookupTableAddress),
          state: AddressLookupTableAccount.deserialize(accountInfo.data),
        });
        acc.push(addressLookupTableAccount);
      }

      return acc;
    }, new Array<AddressLookupTableAccount>());
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

  getAta(
    mint: PublicKey,
    owner: PublicKey,
    tokenProgram = TOKEN_PROGRAM_ID,
  ): PublicKey {
    return getAssociatedTokenAddressSync(mint, owner, true, tokenProgram);
  }

  getStatePda(stateModel: Partial<StateModel>): PublicKey {
    const createdKey = stateModel?.created?.key || [
      ...Buffer.from(
        anchor.utils.sha256.hash(this.getName(stateModel)),
      ).subarray(0, 8),
    ];

    const owner = stateModel.owner?.pubkey || this.getSigner();
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [Buffer.from(SEED_STATE), owner.toBuffer(), Uint8Array.from(createdKey)],
      this.program.programId,
    );
    return pda;
  }

  getVaultPda(statePda: PublicKey): PublicKey {
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [Buffer.from(SEED_VAULT), statePda.toBuffer()],
      this.program.programId,
    );
    return pda;
  }

  getVaultAta(
    glamState: PublicKey,
    mint: PublicKey,
    programId?: PublicKey,
  ): PublicKey {
    return this.getAta(mint, this.getVaultPda(glamState), programId);
  }

  /**
   * Fetch all the token accounts (including token program and token 2022 program) owned by a public key.
   *
   * @param owner
   * @returns
   */
  async getTokenAccountsByOwner(owner: PublicKey): Promise<TokenAccount[]> {
    const [tokenAccounts, token2022Accounts] = await Promise.all(
      [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID].map(
        async (programId) =>
          await this.provider.connection.getParsedTokenAccountsByOwner(owner, {
            programId,
          }),
      ),
    );
    const parseTokenAccountInfo = (accountInfo: any) => {
      const accountData = accountInfo.account.data.parsed.info;
      return {
        owner,
        pubkey: new PublicKey(accountInfo.pubkey),
        mint: new PublicKey(accountData.mint),
        decimals: accountData.tokenAmount.decimals, // number
        amount: accountData.tokenAmount.amount, // string
        uiAmount: accountData.tokenAmount.uiAmount, // number
        frozen: accountData.state === "frozen",
      };
    };
    return tokenAccounts.value
      .map((accountInfo) => ({
        ...parseTokenAccountInfo(accountInfo),
        programId: TOKEN_PROGRAM_ID,
      }))
      .concat(
        token2022Accounts.value.map((accountInfo) => ({
          ...parseTokenAccountInfo(accountInfo),
          programId: TOKEN_2022_PROGRAM_ID,
        })),
      );
  }

  async getVaultBalance(statePda: PublicKey): Promise<number> {
    const vault = this.getVaultPda(statePda);
    const lamports = await this.provider.connection.getBalance(vault);
    return lamports / LAMPORTS_PER_SOL;
  }

  async getVaultTokenBalance(
    glamState: PublicKey,
    mint: PublicKey,
    programId?: PublicKey,
  ): Promise<number> {
    const ata = this.getVaultAta(glamState, mint);
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

  async fetchMintWithOwner(asset: PublicKey) {
    const connection = this.provider.connection;
    const info = await connection.getAccountInfo(asset, "confirmed");

    if (!info) {
      throw new Error(`Mint ${asset.toBase58()} not found`);
    }

    const tokenProgram = info.owner;
    const mint = unpackMint(asset, info, tokenProgram);
    return { mint, tokenProgram };
  }

  getOpenfundsPda(statePda: PublicKey): PublicKey {
    const [pda, _] = PublicKey.findProgramAddressSync(
      [Buffer.from(SEED_METADATA), statePda.toBuffer()],
      this.program.programId,
    );
    return pda;
  }

  getMintPda(statePda: PublicKey, mintIdx: number = 0): PublicKey {
    const [pda, _] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(SEED_MINT),
        Uint8Array.from([mintIdx % 256]),
        statePda.toBuffer(),
      ],
      this.program.programId,
    );
    return pda;
  }

  getMintAta(user: PublicKey, mintPda: PublicKey): PublicKey {
    return this.getAta(mintPda, user, TOKEN_2022_PROGRAM_ID);
  }

  getName(stateModel: Partial<StateModel>) {
    const name =
      stateModel.name ||
      (stateModel.mints && stateModel.mints[0]?.name) ||
      stateModel.rawOpenfunds?.legalFundNameIncludingUmbrella;
    if (!name) {
      throw new Error("Name not be inferred from state model");
    }
    return name;
  }

  public async fetchStateAccount(statePda: PublicKey): Promise<StateAccount> {
    return await this.program.account.stateAccount.fetch(statePda);
  }

  public async fetchOpenfundsMetadataAccount(
    state: PublicKey,
  ): Promise<OpenfundsMetadataAccount> {
    const openfunds = this.getOpenfundsPda(state);
    return await this.program.account.openfundsMetadataAccount.fetch(openfunds);
  }

  public async fetchMintAccount(
    state: PublicKey,
    mintIdx: number,
  ): Promise<Mint> {
    const connection = this.provider.connection;
    return await getMint(
      connection,
      this.getMintPda(state, mintIdx),
      connection.commitment,
      TOKEN_2022_PROGRAM_ID,
    );
  }

  /**
   * Generates instructions to wrap SOL into wSOL if the vault doesn't have enough wSOL
   *
   * @param lamports Desired amount of wSOL
   * @returns
   */
  public async maybeWrapSol(
    glamState: PublicKey,
    amount: number | anchor.BN,
    signer?: PublicKey,
  ): Promise<TransactionInstruction | null> {
    const glamVault = this.getVaultPda(glamState);
    const vaultWsolAta = this.getVaultAta(glamState, WSOL);
    let wsolBalance = new anchor.BN(0);
    try {
      wsolBalance = new anchor.BN(
        (
          await this.provider.connection.getTokenAccountBalance(vaultWsolAta)
        ).value.amount,
      );
    } catch (err) {}
    const solBalance = new anchor.BN(
      await this.provider.connection.getBalance(glamVault),
    );
    const delta = new anchor.BN(amount).sub(wsolBalance); // wSOL amount needed
    if (solBalance.lt(delta)) {
      throw new Error(
        "Insufficient funds in vault to complete the transaction",
      );
    }
    if (delta.gt(new anchor.BN(0)) && solBalance.gte(delta)) {
      return await this.program.methods
        .wsolWrap(delta)
        .accountsPartial({
          glamState,
          glamVault,
          glamSigner: signer || this.getSigner(),
          vaultWsolAta,
          wsolMint: WSOL,
        })
        .instruction();
    }

    return null;
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

  public async listGlamStates(): Promise<PublicKey[]> {
    const bytes = Uint8Array.from([
      0x31, 0x68, 0xa8, 0xd6, 0x86, 0xb4, 0xad, 0x9a,
    ]);
    const accounts = await this.provider.connection.getParsedProgramAccounts(
      this.program.programId,
      {
        filters: [{ memcmp: { offset: 0, bytes: bs58.encode(bytes) } }],
      },
    );
    return accounts.map((a) => a.pubkey);
  }

  /**
   * Fetch glam state from onchain accounts and build a StateModel
   *
   * @param statePda
   * @returns
   */
  public async fetchState(statePda: PublicKey): Promise<StateModel> {
    const stateAccount = await this.fetchStateAccount(statePda);
    const openfundsMetadataAccount =
      await this.fetchOpenfundsMetadataAccount(statePda);

    if (stateAccount.mints.length > 0) {
      const firstMint = await this.fetchMintAccount(statePda, 0);
      return StateModel.fromOnchainAccounts(
        statePda,
        stateAccount,
        openfundsMetadataAccount,
        firstMint,
        this.program.programId,
      );
    }

    return StateModel.fromOnchainAccounts(
      statePda,
      stateAccount,
      openfundsMetadataAccount,
      undefined,
      this.program.programId,
    );
  }

  public async fetchAllGlamStates(): Promise<StateModel[]> {
    const stateAccounts = await this.program.account.stateAccount.all();
    const openfundsMetadataAccounts =
      await this.program.account.openfundsMetadataAccount.all();

    let openfundsCache = new Map<string, OpenfundsMetadataAccount>();
    openfundsMetadataAccounts.forEach((of) => {
      openfundsCache.set(of.publicKey.toBase58(), of.account);
    });

    /* fetch first mint */
    let mintCache = new Map<string, Mint>();
    const connection = this.provider.connection;
    const mintAddresses = stateAccounts
      .map((s) => s.account.mints[0])
      .filter((addr) => !!addr);
    const mintAccounts =
      await connection.getMultipleAccountsInfo(mintAddresses);
    mintAccounts.forEach((info, j) => {
      const mintInfo = unpackMint(
        mintAddresses[j],
        info,
        TOKEN_2022_PROGRAM_ID,
      );
      mintCache.set(mintAddresses[j].toBase58(), mintInfo);
    });

    return stateAccounts.map((s) =>
      StateModel.fromOnchainAccounts(
        s.publicKey,
        s.account,
        openfundsCache.get(s.account.metadata?.pubkey.toBase58() || ""),
        mintCache.get(s.account.mints[0]?.toBase58() || ""),
        this.program.programId,
      ),
    );
  }
}
