import { PublicKey } from "@solana/web3.js";
import {
  FundModel,
  FundOpenfundsModel,
  GlamClient,
  ShareClassOpenfundsModel,
  USDC,
  WBTC,
  WSOL,
} from "../src";

describe("glam_openfunds", () => {
  const glamClient = new GlamClient();

  const manager = glamClient.getManager();

  // fund1: 1 share class + implicit fields
  const fund1 = {
    shareClasses: [
      {
        // Glam Token
        name: "Glam Investment Fund BTC-SOL",
        symbol: "GBS",
        asset: USDC,
        // Glam
        lockUpPeriodInSeconds: 40 * 24 * 60 * 60,
        permanentDelegate: manager,
        defaultAccountStateFrozen: false,
        // Openfunds Share Class
        rawOpenfunds: {
          fullShareClassName: null, // auto
          isin: "XS1082172823",
          shareClassCurrency: "USDC",
          shareClassLifecycle: "active",
          investmentStatus: "open",
        } as Partial<ShareClassOpenfundsModel>,
      },
    ],
    // Glam
    isEnabled: true,
    assets: [USDC, WBTC, WSOL],
    // Openfunds (Fund)
    rawOpenfunds: {
      fundDomicileAlpha2: "XS",
      legalFundNameIncludingUmbrella: null, // auto
      fundLaunchDate: null, // auto
      investmentObjective: "demo",
      fundCurrency: "USDC",
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
    manager: {
      portfolioManagerName: "0x0ece.sol",
      pubkey: manager,
      kind: { wallet: {} },
    },
  } as Partial<FundModel>;

  // fund1b: 1 share class, all fields explicit
  const fund1b = {
    shareClasses: [
      {
        // Glam Token
        name: "Glam Investment Fund BTC-SOL",
        symbol: "GBS",
        uri: "",
        fundId: new PublicKey(0),
        asset: USDC,
        imageUri: "",
        // Glam
        permanentDelegate: new PublicKey(0),
        lockUpPeriodInSeconds: 40 * 24 * 60 * 60,
        defaultAccountStateFrozen: false,
        allowlist: [],
        blocklist: [],
        isRawOpenfunds: true,
        // Openfunds Share Class
        rawOpenfunds: {
          isin: "XS1082172823",
          shareClassCurrency: "USDC",
          fullShareClassName: "Glam Investment Fund BTC-SOL",
          currencyOfMinimalSubscription: "USDC",
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
        } as Partial<ShareClassOpenfundsModel>,
      },
    ],
    // Glam
    isEnabled: true,
    assets: [USDC, WBTC, WSOL],
    // Openfunds (Fund)
    rawOpenfunds: {
      fundDomicileAlpha2: "XS",
      legalFundNameIncludingUmbrella: "Glam Investment Fund BTC-SOL (b)",
      fundLaunchDate: new Date().toISOString().split("T")[0],
      investmentObjective: "demo",
      fundCurrency: "USDC",
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
    manager: {
      portfolioManagerName: "0x0ece.sol",
      pubkey: null,
      kind: { wallet: {} },
    },
  } as Partial<FundModel>;

  // TODO: fund2 with 2 share classes

  it("Initialize fund with 1 share class", async () => {
    let txId, fundPDA;
    try {
      [txId, fundPDA] = await glamClient.fund.createFund(fund1);
      console.log(`Fund ${fundPDA} initialized, txId: ${txId}`);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Initialize fund with 1 share class (b)", async () => {
    let txId, fundPDA;
    try {
      [txId, fundPDA] = await glamClient.fund.createFund(fund1b);
      console.log(`Fund ${fundPDA} initialized, txId: ${txId}`);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
