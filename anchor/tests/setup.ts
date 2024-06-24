import { PublicKey } from "@solana/web3.js";
import { GlamClient } from "../src";

const usdc = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2"); // 6 decimals
const eth = new PublicKey("So11111111111111111111111111111111111111112"); // 6 decimals
const btc = new PublicKey("3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv"); // 9 decimals

const wsol = new PublicKey("So11111111111111111111111111111111111111112"); // 9 decimals
const msol = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"); // 9 decimals

export const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const str2seed = (str: String) =>
  Uint8Array.from(
    Array.from(str)
      .map((letter) => letter.charCodeAt(0))
      .concat(new Array(32 - str.length).fill(0))
  );

export const fundTestExample = {
  shareClasses: [
    {
      // Glam Token
      name: "Glam Fund SOL-mSOL",
      symbol: "GBS",
      asset: usdc,
      allowlist: [] as PublicKey[],
      blocklist: [] as PublicKey[],
      // Glam
      lockUpTime: 4 * 60 * 60,
      requiresMemoOnTransfer: true,
      // Openfunds Share Class
      fullShareClassName: "Glam Fund SOL-mSOL",
      isin: "XS1082172823",
      cusip: "demo",
      valor: "demo",
      shareClassCurrency: "SOL",
      shareClassLifecycle: "active",
      investmentStatus: "open",
      shareClassDistributionPolicy: "accumulating",
      shareClassLaunchDate: new Date().toISOString().split("T")[0],
      minimalInitialSubscriptionCategory: "amount",
      minimalInitialSubscriptionInShares: "0",
      minimalInitialSubscriptionInAmount: "1000",
      currencyOfMinimalSubscription: "SOL",
      minimalRedemptionCategory: "shares",
      minimalInitialRedemptionInShares: "1",
      maximumInitialRedemptionInShares: "1000",
      minimalInitialRedemptionInAmount: "0",
      maximumInitialRedemptionInAmount: null,
      currencyOfMinimalOrMaximumRedemption: "SOL",
      shareClassDividendType: "both",
      srri: "4",
      hasLockUpForRedemption: true,
      lockUpComment: "demo",
      lockUpPeriodInDays: "40",
      launchPrice: "100",
      launchPriceCurrency: "USD",
      launchPriceDate: new Date().toISOString().split("T")[0],
    },
  ],
  // Glam
  isEnabled: true,
  assets: [wsol, msol],
  assetsWeights: [50, 50],
  managers: [] as PublicKey[],
  traders: [] as PublicKey[],
  // Openfunds (Fund)
  fundDomicileAlpha2: "XS",
  legalFundNameIncludingUmbrella: "Glam Fund SOL-mSOL",
  fundLaunchDate: new Date().toISOString().split("T")[0],
  investmentObjective: "demo",
  fundCurrency: "SOL",
  openEndedOrClosedEndedFundStructure: "open-ended fund",
  fiscalYearEnd: "12-31",
  legalForm: "other",
  // Openfunds Company (simplified)
  company: {
    fundGroupName: "Glam Systems",
    manCo: "Glam Management",
    domicileOfManCo: "CH",
    emailAddressOfManCo: "hello@glam.systems",
    fundWebsiteOfManCo: "https://glam.systems",
  },
  // Openfunds Manager (simplified)
  manager: {
    portfolioManagerName: "glam.sol",
  },
};

export const createFundForTest = async (
  glamClient?: GlamClient,
  fundTest?: any
) => {
  const client = glamClient || new GlamClient();
  const manager = client.getManager();
  let txId, fundPDA;
  try {
    [txId, fundPDA] = await client.createFund({
      ...(fundTest || fundTestExample),
      manager,
    });
    console.log(`Fund ${fundPDA} initialized, txId: ${txId}`);
  } catch (e) {
    console.error(e);
    throw e;
  }

  return {
    fundPDA,
    treasuryPDA: client.getTreasuryPDA(fundPDA),
    sharePDA: client.getShareClassPDA(fundPDA, 0),
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
  manager: PublicKey,
  inputSignerAta: PublicKey,
  outputSignerAta: PublicKey
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
        pubkey: manager.toBase58(),
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: inputSignerAta.toBase58(),
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: outputSignerAta.toBase58(),
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
        pubkey: manager.toBase58(),
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: inputSignerAta.toBase58(),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: outputSignerAta.toBase58(),
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
