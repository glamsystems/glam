import { Program, workspace } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { GlamClient } from "../src";

const usdc = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2"); // 6 decimals
const eth = new PublicKey("So11111111111111111111111111111111111111112"); // 6 decimals
const btc = new PublicKey("3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv"); // 9 decimals

const wsol = new PublicKey("So11111111111111111111111111111111111111112"); // 9 decimals
const msol = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"); // 9 decimals

export const shareClass0Allowlist = [
  // new PublicKey("a19a3us1Rm3YAV4NjjQzsaZ2brJWihsS1mf1fe94Ycj"),
  // new PublicKey("a1fwSFaH4w3LN8F2VNCz5WRb4KZTPZxgULG7vpNdB74"),
  // new PublicKey("a1sGZyirTFTv1SYUDHgCy3wWiTWXLRTa2vJSeDRDu9x")
];
export const shareClass0Blocklist = [
  // new PublicKey("b182JJfadsQBao9wBYdSSiUxA1vo4Bb1ETXjyrsBumP"),
  // new PublicKey("b1NWY3dDonmeFXBZRHi13BKusrbWJeYDR2mjUgNHZYH")
];

export const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const fundTestExample = {
  shareClasses: [
    {
      // Glam Token
      name: "Glam Fund SOL-mSOL",
      symbol: "GBS",
      asset: usdc,
      allowlist: shareClass0Allowlist,
      blocklist: shareClass0Blocklist,
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
      launchPriceDate: new Date().toISOString().split("T")[0]
    }
  ],
  // Glam
  isEnabled: true,
  assets: [wsol, msol],
  assetsWeights: [50, 50],
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
    fundWebsiteOfManCo: "https://glam.systems"
  },
  // Openfunds Manager (simplified)
  manager: {
    portfolioManagerName: "glam.sol"
  }
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
      manager
    });
    console.log(`Fund ${fundPDA} initialized, txId: ${txId}`);
  } catch (e) {
    console.error(e);
    throw e;
  }

  return {
    fundPDA,
    treasuryPDA: client.getTreasuryPDA(fundPDA),
    sharePDA: client.getShareClassPDA(fundPDA, 0)
  };
};
