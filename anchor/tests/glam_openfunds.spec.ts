import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { GlamClient } from "../src";

describe("glam_openfunds", () => {
  const client = new GlamClient();

  const manager = client.getManager();

  const usdc = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2");
  const wsol = new PublicKey("So11111111111111111111111111111111111111112");
  const btc = new PublicKey("3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv");

  // fund1: 1 share class + implicit fields
  const fund1 = {
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
        fullShareClassName: null, // auto
        isin: "XS1082172823",
        cusip: "demo",
        valor: "demo",
        shareClassCurrency: "USDC",
        shareClassLifecycle: "active",
        investmentStatus: "open",
        shareClassDistributionPolicy: "accumulating",
        shareClassLaunchDate: null, // auto
        minimalInitialSubscriptionCategory: "amount",
        minimalInitialSubscriptionInShares: 0,
        minimalInitialSubscriptionInAmount: 1_000,
        currencyOfMinimalSubscription: "USDC",
        minimalRedemptionCategory: "shares",
        minimalInitialRedemptionInShares: 1,
        maximumInitialRedemptionInShares: 1_000,
        minimalInitialRedemptionInAmount: 0,
        maximumInitialRedemptionInAmount: null,
        currencyOfMinimalOrMaximumRedemption: "USDC",
        shareClassDividendType: "both",
        srri: 4,
        hasLockUpForRedemption: true, //TODO: auto
        lockUpComment: "demo",
        lockUpPeriodInDays: 40, //TODO: auto
        launchPrice: null, // auto
        launchPriceCurrency: null, // auto
        launchPriceDate: null // auto
      }
    ],
    // Glam
    isEnabled: true,
    assets: [usdc, btc, wsol],
    assetsWeights: [0, 60, 40],
    // Openfunds (Fund)
    fundDomicileAlpha2: "XS",
    legalFundNameIncludingUmbrella: null, // auto
    fundLaunchDate: null, // auto
    investmentObjective: "demo",
    fundCurrency: "USDC",
    openEndedOrClosedEndedFundStructure: "open-ended fund",
    fiscalYearEnd: "12-31",
    legalForm: "other",
    // Openfunds Company (simplified)
    company: {
      name: "Glam Systems",
      email: "hello@glam.systems",
      website: "https://glam.systems",
      manCo: "Glam Management",
      domicileOfManCo: "CH"
    },
    // Openfunds Manager (simplified)
    manager: {
      name: "0x0ece.sol"
    }
  };

  // fund1b: 1 share class, all fields explicit
  const fund1b = {
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
    assets: [usdc, btc, wsol],
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
  };

  // fund2: 2 share classes
  //TODO

  // it("Initialize fund with 1 share class", async () => {
  //   let txId, fundPDA;
  //   try {
  //     [txId, fundPDA] = await client.createFund(fund1);
  //     console.log(`Fund ${fundPDA} initialized, txId: ${txId}`);
  //   } catch (e) {
  //     console.error(e);
  //     throw e;
  //   }
  // });

  it("Initialize fund with 1 share class (b)", async () => {
    let txId, fundPDA;
    try {
      [txId, fundPDA] = await client.createFund(fund1b);
      console.log(`Fund ${fundPDA} initialized, txId: ${txId}`);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
