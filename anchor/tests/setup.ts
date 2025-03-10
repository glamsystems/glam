import { PublicKey } from "@solana/web3.js";
import {
  GlamClient,
  WSOL,
  MSOL,
  USDC,
  StateModel,
  MintOpenfundsModel,
  FundOpenfundsModel,
} from "../src";
import { Connection } from "@solana/web3.js";

export const sleep = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const str2seed = (str: String) =>
  Uint8Array.from(
    Array.from(str)
      .map((letter) => letter.charCodeAt(0))
      .concat(new Array(32 - str.length).fill(0)),
  );

export const airdrop = async (
  connection: Connection,
  pubkey: PublicKey,
  lamports: number,
) => {
  const airdropTx = await connection.requestAirdrop(pubkey, lamports);
  await connection.confirmTransaction(
    {
      ...(await connection.getLatestBlockhash()),
      signature: airdropTx,
    },
    "confirmed",
  );
  console.log(
    `Airdropped ${lamports} lamports to ${pubkey.toBase58()}:`,
    airdropTx,
  );
};

export const stateModelForTest = {
  mints: [
    {
      // Glam Token
      name: "Glam Fund SOL-mSOL",
      symbol: "GBS",
      uri: "",
      asset: USDC,
      imageUri: "",
      isRawOpenfunds: true,
      // Glam Policies
      allowlist: [] as PublicKey[],
      blocklist: [] as PublicKey[],
      lockUpPeriodInSeconds: 0, // number or BN
      permanentDelegate: new PublicKey(0), // PublicKey, new PublicKey(0) => mint
      defaultAccountStateFrozen: false, // bool
      // Openfunds Share Class
      rawOpenfunds: {
        isin: "XS1082172823",
        shareClassCurrency: "SOL",
        fullShareClassName: "Glam Fund SOL-mSOL",
        currencyOfMinimalSubscription: "SOL",
        investmentStatus: "open",
        minimalInitialSubscriptionCategory: "amount",
        minimalInitialSubscriptionInAmount: "1000",
        minimalInitialSubscriptionInShares: "0",
        shareClassExtension: "",
        shareClassDistributionPolicy: "accumulating",
        shareClassLaunchDate: new Date().toISOString().split("T")[0],
        shareClassLifecycle: "active",
        launchPrice: "100",
        launchPriceCurrency: "USD",
        launchPriceDate: new Date().toISOString().split("T")[0],
      } as Partial<MintOpenfundsModel>,
    },
  ],
  // Glam
  accountType: { vault: {} },
  enabled: true,
  assets: [WSOL, MSOL],
  // Openfunds (Fund)
  rawOpenfunds: {
    fundDomicileAlpha2: "XS",
    // legalFundNameIncludingUmbrella: "Glam Fund SOL-mSOL",
    fundLaunchDate: new Date().toISOString().split("T")[0],
    investmentObjective: "demo",
    fundCurrency: "SOL",
    openEndedOrClosedEndedFundStructure: "open-ended fund",
    fiscalYearEnd: "12-31",
    legalForm: "other",
  } as FundOpenfundsModel,
  // Openfunds Company (simplified)
  company: {
    fundGroupName: "Glam Systems",
    manCo: "Glam Management",
    domicileOfManCo: "CH",
    emailAddressOfManCo: "hello@glam.systems",
    fundWebsiteOfManCo: "https://glam.systems",
  },
  // Openfunds Manager (simplified)
  owner: {
    portfolioManagerName: "glam.sol",
  },
} as Partial<StateModel>;

export const createGlamStateForTest = async (
  glamClient: GlamClient = new GlamClient(),
  stateForTest: Partial<StateModel> = stateModelForTest,
) => {
  const [txId, statePda] = await glamClient.state.createState(stateForTest);
  console.log(`State ${statePda} initialized, txId: ${txId}`);

  return {
    statePda,
    vaultPda: glamClient.getVaultPda(statePda),
    mintPda: glamClient.getMintPda(statePda, 0),
  };
};

export const quoteResponseForTest = {
  inputMint: "So11111111111111111111111111111111111111112",
  inAmount: "50000000",
  outputMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  outAmount: "41795874",
  otherAmountThreshold: "41666307",
  swapMode: "ExactIn",
  slippageBps: 31,
  computedAutoSlippage: 31,
  platformFee: null,
  priceImpactPct: "0.0000597286440159288820727949",
  routePlan: [
    {
      swapInfo: {
        ammKey: "MAR1zHjHaQcniE2gXsDptkyKUnNfMEsLBVcfP7vLyv7",
        label: "Mercurial",
        inputMint: "So11111111111111111111111111111111111111112",
        outputMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
        inAmount: "50000000",
        outAmount: "41795874",
        feeAmount: "4180",
        feeMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
      },
      percent: 100,
    },
  ],
  contextSlot: 272229534,
  timeTaken: 0.002053234,
};

export const swapInstructionsForTest = (
  vault: PublicKey,
  inputVaultAta: PublicKey,
  outputVaultAta: PublicKey,
) => ({
  tokenLedgerInstruction: null,
  computeBudgetInstructions: [
    {
      programId: "ComputeBudget111111111111111111111111111111",
      accounts: [],
      data: "AsBcFQA=",
    },
  ],
  setupInstructions: [
    {
      programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      accounts: [
        {
          pubkey: "FsbYwp2VmCdouBbJLKTGo5Gf8RsUUQWVZzA1gvRbsk89",
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: "Ghk24stAfSCWywoUygdzkhWxZkXZHTmjBWaprkrC3EDh",
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: "FsbYwp2VmCdouBbJLKTGo5Gf8RsUUQWVZzA1gvRbsk89",
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: "So11111111111111111111111111111111111111112",
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: "11111111111111111111111111111111",
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          isSigner: false,
          isWritable: false,
        },
      ],
      data: "AQ==",
    },
    {
      programId: "11111111111111111111111111111111",
      accounts: [
        {
          pubkey: "FsbYwp2VmCdouBbJLKTGo5Gf8RsUUQWVZzA1gvRbsk89",
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: "Ghk24stAfSCWywoUygdzkhWxZkXZHTmjBWaprkrC3EDh",
          isSigner: false,
          isWritable: true,
        },
      ],
      data: "AgAAAIDw+gIAAAAA",
    },
    {
      programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      accounts: [
        {
          pubkey: "Ghk24stAfSCWywoUygdzkhWxZkXZHTmjBWaprkrC3EDh",
          isSigner: false,
          isWritable: true,
        },
      ],
      data: "EQ==",
    },
    {
      programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      accounts: [
        {
          pubkey: "FsbYwp2VmCdouBbJLKTGo5Gf8RsUUQWVZzA1gvRbsk89",
          isSigner: true,
          isWritable: true,
        },
        {
          pubkey: "2pqUNdx8Rvf63PQGTB3wMGnmGKjofBTrcQCyqgzbvKPP",
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: "FsbYwp2VmCdouBbJLKTGo5Gf8RsUUQWVZzA1gvRbsk89",
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: "11111111111111111111111111111111",
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          isSigner: false,
          isWritable: false,
        },
      ],
      data: "AQ==",
    },
  ],
  swapInstruction: {
    programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    accounts: [
      {
        pubkey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: vault.toBase58(),
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: inputVaultAta.toBase58(),
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: outputVaultAta.toBase58(),
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: "D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf",
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: "MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky",
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: "MAR1zHjHaQcniE2gXsDptkyKUnNfMEsLBVcfP7vLyv7",
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: "GcJckEnDiWjpjQ8sqDKuNZjJUKAFZSiuQZ9WmuQpC92a",
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: vault.toBase58(),
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: inputVaultAta.toBase58(),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: outputVaultAta.toBase58(),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: "EWy2hPdVT4uGrYokx65nAyn2GFBv7bUYA2pFPY96pw7Y",
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: "GM48qFn8rnqhyNMrBHyPJgUVwXQ1JvMbcu3b9zkThW9L",
        isSigner: false,
        isWritable: true,
      },
    ],
    data: "5RfLl3rjrSoBAAAACmQAAYDw+gIAAAAAIsF9AgAAAAAfAAA=",
  },
  cleanupInstruction: {
    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    accounts: [
      {
        pubkey: "Ghk24stAfSCWywoUygdzkhWxZkXZHTmjBWaprkrC3EDh",
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: "FsbYwp2VmCdouBbJLKTGo5Gf8RsUUQWVZzA1gvRbsk89",
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: "FsbYwp2VmCdouBbJLKTGo5Gf8RsUUQWVZzA1gvRbsk89",
        isSigner: true,
        isWritable: false,
      },
    ],
    data: "CQ==",
  },
  otherInstructions: [],
  addressLookupTableAddresses: ["6TSS8bTxDjGitZgtTc7gdVWkzKdpGLb9QDi7kXAQQXXp"],
  prioritizationFeeLamports: 0,
});
