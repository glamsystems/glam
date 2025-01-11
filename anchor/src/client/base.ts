import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
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
import { WSOL, USDC } from "../constants";

import {
  Glam,
  GlamIDL,
  GlamIDLJson,
  GlamProgram,
  getGlamProgramId,
} from "../glamExports";
import { ClusterNetwork, GlamClientConfig } from "../clientConfig";
import {
  StateAccount,
  MetadataAccount,
  StateModel,
  ShareClassModel,
} from "../models";
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
  jitoTipLamports?: number;
  preInstructions?: TransactionInstruction[];
};

export type TokenAccount = {
  owner: PublicKey;
  pubkey: PublicKey;
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
    }

    // autodetect mainnet
    const defaultCluster = this.provider.connection.rpcEndpoint.includes(
      "mainnet",
    )
      ? ClusterNetwork.Mainnet
      : ClusterNetwork.Devnet;
    this.cluster = config?.cluster || defaultCluster;

    if (this.cluster === ClusterNetwork.Mainnet) {
      this.program = new Program(GlamIDL, this.provider) as GlamProgram;
    } else {
      const GlamIDLDevnet = { ...GlamIDLJson };
      GlamIDLDevnet.address = getGlamProgramId(
        ClusterNetwork.Devnet,
      ).toBase58();
      this.program = new Program(
        GlamIDLDevnet as Glam,
        this.provider,
      ) as GlamProgram;
    }

    this.jupiterApi = config?.jupiterApi || JUPITER_API_DEFAULT;
    this.blockhashWithCache = new BlockhashWithCache(
      this.provider,
      !!isBrowser,
    );
  }

  isMainnet(): boolean {
    return this.cluster === ClusterNetwork.Mainnet;
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
    lookupTables = lookupTables || [];
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

  getAta(
    mint: PublicKey,
    owner?: PublicKey,
    tokenProgram = TOKEN_PROGRAM_ID,
  ): PublicKey {
    return getAssociatedTokenAddressSync(
      mint,
      owner || this.getSigner(),
      true,
      tokenProgram,
    );
  }

  getStatePda(stateModel: Partial<StateModel>): PublicKey {
    const createdKey = stateModel?.created?.key || [
      ...Buffer.from(
        anchor.utils.sha256.hash(this.getName(stateModel)),
      ).subarray(0, 8),
    ];

    const owner = stateModel.owner?.pubkey || this.getSigner();
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("fund"),
        owner.toBuffer(),
        Uint8Array.from(createdKey),
      ],
      this.program.programId,
    );
    return pda;
  }

  getVaultPda(fundPDA: PublicKey): PublicKey {
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), fundPDA.toBuffer()],
      this.program.programId,
    );
    return pda;
  }

  getVaultAta(
    statePda: PublicKey,
    mint: PublicKey,
    programId?: PublicKey,
  ): PublicKey {
    return this.getAta(mint, this.getVaultPda(statePda), programId);
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

  async getTreasuryBalance(fundPDA: PublicKey): Promise<number> {
    const treasury = this.getVaultPda(fundPDA);
    const lamports = await this.provider.connection.getBalance(treasury);
    return lamports / LAMPORTS_PER_SOL;
  }

  async getTreasuryTokenBalance(
    fundPDA: PublicKey,
    mint: PublicKey,
    programId?: PublicKey,
  ): Promise<number> {
    const ata = this.getVaultAta(fundPDA, mint);
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
      [Buffer.from("openfunds"), statePda.toBuffer()],
      this.program.programId,
    );
    return pda;
  }

  getShareClassPda(statePda: PublicKey, mintIdx: number = 0): PublicKey {
    return ShareClassModel.mintAddress(statePda, mintIdx);
  }

  getShareClassAta(user: PublicKey, shareClassPDA: PublicKey): PublicKey {
    return this.getAta(shareClassPDA, user, TOKEN_2022_PROGRAM_ID);
  }

  getName(stateModel: Partial<StateModel>) {
    const name =
      stateModel.name ||
      stateModel.rawOpenfunds?.legalFundNameIncludingUmbrella ||
      (stateModel.mints && stateModel.mints[0]?.name);
    if (!name) {
      throw new Error("Name not be inferred from state model");
    }
    return name;
  }

  // @ts-ignore
  public async fetchStateAccount(statePda: PublicKey): Promise<StateAccount> {
    // stateAccount is a type alias of fundAccount
    return await this.program.account.fundAccount.fetch(statePda);
  }

  public async fetchMetadataAccount(
    fundPDA: PublicKey,
  ): Promise<MetadataAccount> {
    const openfunds = this.getOpenfundsPda(fundPDA);
    // metadataAccount is a type alias of fundMetadataAccount
    return await this.program.account.fundMetadataAccount.fetch(openfunds);
  }

  public async fetchShareClassAccount(
    fundPDA: PublicKey,
    mintIdx: number,
  ): Promise<Mint> {
    const shareClassMint = this.getShareClassPda(fundPDA, mintIdx);
    const connection = this.provider.connection;
    return await getMint(
      connection,
      shareClassMint,
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
    fundPda: PublicKey,
    amount: number | anchor.BN,
    signer?: PublicKey,
  ): Promise<TransactionInstruction | null> {
    const vaultPda = this.getVaultPda(fundPda);
    const vaultWsolAta = this.getVaultAta(fundPda, WSOL);
    let wsolBalance = new anchor.BN(0);
    try {
      wsolBalance = new anchor.BN(
        (
          await this.provider.connection.getTokenAccountBalance(vaultWsolAta)
        ).value.amount,
      );
    } catch (err) {}
    const solBalance = new anchor.BN(
      await this.provider.connection.getBalance(vaultPda),
    );
    const delta = new anchor.BN(amount).sub(wsolBalance); // wSOL amount needed
    if (solBalance.lt(delta)) {
      throw new Error(
        "Insufficient funds in vault to complete the transaction",
      );
    }
    if (delta.gt(new anchor.BN(0)) && solBalance.gt(delta)) {
      return await this.program.methods
        .wsolWrap(delta)
        .accountsPartial({
          state: fundPda,
          vault: vaultPda,
          vaultWsolAta,
          wsolMint: WSOL,
          signer: signer || this.getSigner(),
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

  public async listFunds(): Promise<PublicKey[]> {
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
   * Fetch fund data from onchain accounts and build a FundModel
   *
   * @param statePda
   * @returns
   */
  public async fetchState(statePda: PublicKey): Promise<StateModel> {
    const stateAccount = await this.fetchStateAccount(statePda);
    const metadataAccount = await this.fetchMetadataAccount(statePda);

    if (stateAccount.mints.length > 0) {
      const firstShareClass = await this.fetchShareClassAccount(statePda, 0);
      return StateModel.fromOnchainAccounts(
        statePda,
        stateAccount,
        metadataAccount,
        firstShareClass,
      );
    }

    return StateModel.fromOnchainAccounts(
      statePda,
      stateAccount,
      metadataAccount,
    );
  }

  public async fetchAllFunds(): Promise<StateModel[]> {
    const fundAccounts = await this.program.account.fundAccount.all();

    const openfundsAccounts =
      await this.program.account.fundMetadataAccount.all();

    let openfundsCache = new Map<string, MetadataAccount>();
    openfundsAccounts.forEach((of) => {
      openfundsCache.set(of.publicKey.toBase58(), of.account);
    });

    /* fetch first mint */
    let mintCache = new Map<string, Mint>();
    const connection = this.provider.connection;
    const mintAddresses = fundAccounts
      .map((f) => f.account.mints[0])
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

    return fundAccounts.map((f) =>
      StateModel.fromOnchainAccounts(
        f.publicKey,
        f.account,
        openfundsCache.get(f.account.metadata.toBase58()),
        mintCache.get(f.account.mints[0] ? f.account.mints[0].toBase58() : ""),
      ),
    );
  }
}
