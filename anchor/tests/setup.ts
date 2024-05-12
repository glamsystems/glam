import { Program, Wallet, workspace } from "@coral-xyz/anchor";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { GlamClient } from "../src";
import { Glam } from "../target/types/glam";
import { getMetadataUri, getImageUri, getFundUri } from "../src/offchain";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token"; // Fix import warning in VSCode

const program = workspace.Glam as Program<Glam>;

const usdc = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2"); // 6 decimals
const eth = new PublicKey("So11111111111111111111111111111111111111112"); // 6 decimals
const btc = new PublicKey("3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv"); // 9 decimals

export const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const createFundForTest = async (
  name: string,
  symbol: string,
  manager: Wallet
) => {
  const client = new GlamClient();
  let txId, fundPDA;
  try {
    [txId, fundPDA] = await client.createFund({
      shareClasses: [
        {
          // Glam Token
          name: "Glam Investment Fund BTC-SOL",
          symbol: "GBS",
          asset: usdc,
          // Glam
          permanentDelegate: manager,
          lockUpTime: 40 * 24 * 60 * 60,
          requiresMemoOnTransfer: true,
          // Openfunds Share Class
          fullShareClassName: "Glam Investment Fund BTC-SOL",
          isin: "XS1082172823",
          cusip: "demo",
          valor: "demo",
          shareClassCurrency: "USDC",
          shareClassLifecycle: "active",
          investmentStatus: "open",
          shareClassDistributionPolicy: "accumulating",
          shareClassLaunchDate: new Date().toISOString().split("T")[0],
          minimalInitialSubscriptionCategory: "amount",
          minimalInitialSubscriptionInShares: "0",
          minimalInitialSubscriptionInAmount: "1000",
          currencyOfMinimalSubscription: "USDC",
          minimalRedemptionCategory: "shares",
          minimalInitialRedemptionInShares: "1",
          maximumInitialRedemptionInShares: "1000",
          minimalInitialRedemptionInAmount: "0",
          maximumInitialRedemptionInAmount: null,
          currencyOfMinimalOrMaximumRedemption: "USDC",
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
      assets: [usdc, btc, eth],
      assetsWeights: [0, 60, 40],
      // Openfunds (Fund)
      fundDomicileAlpha2: "XS",
      legalFundNameIncludingUmbrella: "Glam Investment Fund BTC-SOL (b)",
      fundLaunchDate: new Date().toISOString().split("T")[0],
      investmentObjective: "demo",
      fundCurrency: "USDC",
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
        portfolioManagerName: "0x0ece.sol"
      }
    });
    console.log(`Fund ${fundPDA} initialized, txId: ${txId}`);
  } catch (e) {
    console.error(e);
    throw e;
  }

  return {
    fundPDA,
    fundBump: null,
    treasuryPDA: client.getTreasuryPDA(fundPDA),
    treasuryBump: null,
    sharePDA: client.getShareClassPDA(fundPDA, 0),
    shareBump: null
  };
};
