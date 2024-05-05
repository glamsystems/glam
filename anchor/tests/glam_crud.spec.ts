import * as anchor from "@coral-xyz/anchor";
import * as util from "util";
import { BN, Program, IdlTypes } from "@coral-xyz/anchor";
import { PublicKey, Keypair, ComputeBudgetProgram } from "@solana/web3.js";
import { GlamClient, Glam } from "../src";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { DRIFT_PROGRAM_ID } from "@drift-labs/sdk";

import {
  DriftClient,
  getDriftStateAccountPublicKey,
  getUserAccountPublicKey,
  getUserStatsAccountPublicKey,
  getDriftSignerPublicKey
} from "@drift-labs/sdk";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";

describe("glam_crud", () => {
  const client = new GlamClient();

  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  const manager = provider.wallet as anchor.Wallet;
  console.log("Manager:", manager.publicKey);

  const program = anchor.workspace.Glam as Program<Glam>;
  const commitment = "confirmed";

  const usdc = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2"); // 6 decimals
  const eth = new PublicKey("So11111111111111111111111111111111111111112"); // 6 decimals
  const btc = new PublicKey("3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv"); // 9 decimals
  const BTC_TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;

  const fundName = "Glam Investment Fund BTC";
  const fundSymbol = "GBTC";
  const [fundPDA, fundBump] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("fund"),
      manager.publicKey.toBuffer(),
      Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8])
    ],
    program.programId
  );
  const fundUri = `https://devnet.glam.systems/products/${fundPDA.toBase58()}`;
  const openfundUri = `https://api.glam.systems/openfund/${fundPDA.toBase58()}`;

  const [treasuryPDA, treasuryBump] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("treasury"), fundPDA.toBuffer()],
    program.programId
  );

  const [openfundPDA, openfundBump] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("openfund"), fundPDA.toBuffer()],
    program.programId
  );

  const [sharePDA, shareBump] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("share"),
      Uint8Array.from([0]),
      fundPDA.toBuffer()
    ],
    program.programId
  );
  const shareClassMetadata = {
    name: fundName,
    symbol: fundSymbol,
    uri: `https://api.glam.systems/metadata/${sharePDA.toBase58()}`,
    shareClassAsset: "USDC",
    shareClassAssetId: usdc,
    isin: "XS1082172823",
    status: "open",
    feeManagement: 15000, // 1_000_000 * 0.015,
    feePerformance: 100000, // 1_000_000 * 0.1,
    policyDistribution: "accumulating",
    extension: "",
    launchDate: "2024-04-01",
    lifecycle: "active",
    imageUri: `https://api.glam.systems/image/${sharePDA.toBase58()}.png`
  };

  beforeAll(async () => {}, 15_000);

  it("Initialize fund", async () => {
    try {
      const [txId, fundPDA] = await client.createFund({
        shareClasses: [
          {
            // Glam Token
            symbol: "GBS",
            name: "Glam Investment Fund BTC-SOL",
            asset: usdc,
            // Openfund Share Class
            isin: "XS1082172823",
            shareClassCurrency: "USDC",
            fullShareClassName: null, // auto
            hasPerformanceFee: false,
            hasSubscriptionFeeInFavourOfDistributor: false,
            investmentStatus: "open", //TODO: auto
            shareClassDistributionPolicy: "accumulating", //TODO: auto
            shareClassExtension: "",
            shareClassLaunchDate: null, // auto
            shareClassLifecycle: "active", //TODO: auto
            // launchPrice: null,
            // launchPriceCurrency: null,
            // launchPriceDate: null,
            hasAppliedSubscriptionFeeInFavourOfFund: false,
            hasAppliedRedemptionFeeInFavourOfFund: false,
            hasLockUpForRedemption: false,
            hasRedemptionFeeInFavourOfDistributor: false,
            isValidISIN: false
            // lockUpComment: null,
            // lockUpPeriodInDays: null,
            // roundingMethodForPrices: null,
            // roundingMethodForRedemptionInAmount: null,
            // roundingMethodForRedemptionInShares: null,
            // roundingMethodForSubscriptionInAmount: null,
            // roundingMethodForSubscriptionInShares: null,
          }
        ],
        // Glam
        isEnabled: true,
        assets: [usdc, btc, eth],
        assetsWeights: [0, 60, 40],
        // Openfund (Fund)
        fundDomicileAlpha2: "XS",
        legalFundNameIncludingUmbrella: null, // auto
        fiscalYearEnd: "12-31",
        fundCurrency: null, // auto
        fundLaunchDate: null, // auto
        investmentObjective: "demo",
        // investmentObjective:
        //   "The Glam Investment Fund seeks to reflect generally the performance of the price of Bitcoin and Solana.",
        isFundOfFunds: false,
        isPassiveFund: true, //TODO: auto
        legalForm: "other",
        openEndedOrClosedEndedFundStructure: "open-ended fund", //TODO: auto
        // Openfund Company (simplified)
        company: {
          name: "Glam Systems",
          email: "hello@glam.systems",
          website: "https://glam.systems"
        },
        // Openfund Manager (simplified)
        manager: {
          name: "0x0ece.sol"
        }
      });
      console.log(`Fund initialized: ${txId}`);

      // const fund = await program.account.fundAccount.fetch(fundPDA);
      const fund = await client.fetchFund(fundPDA);
      console.log(util.inspect(fund, false, null));
    } catch (e) {
      console.error(e);
      throw e;
    }

    // expect(fund.shareClassesLen).toEqual(1);
    // expect(fund.assetsLen).toEqual(3);
    // expect(fund.name).toEqual(fundName);
    // expect(fund.symbol).toEqual(fundSymbol);
    // expect(fund.uri).toEqual(fundUri);
    // expect(fund.isActive).toEqual(true);
  });
  /*
  it("Update fund", async () => {
    const newFundName = "Updated fund name";
    await program.methods
      .update(newFundName, null, null, false)
      .accounts({
        fund: fundPDA,
        manager: manager.publicKey
      })
      .rpc({ commitment });
    const fund = await program.account.fund.fetch(fundPDA);
    expect(fund.name).toEqual(newFundName);
    expect(fund.isActive).toEqual(false);
  });

  it("Drift initialize", async () => {
    const userAccountPublicKey = await getUserAccountPublicKey(
      new PublicKey(DRIFT_PROGRAM_ID),
      treasuryPDA,
      0
    );
    const userStatsAccountPublicKey = await getUserStatsAccountPublicKey(
      new PublicKey(DRIFT_PROGRAM_ID),
      treasuryPDA
    );
    const statePublicKey = await getDriftStateAccountPublicKey(
      new PublicKey(DRIFT_PROGRAM_ID)
    );
    console.log("statePublicKey", statePublicKey.toBase58());
    const txId = await program.methods
      .driftInitialize(null)
      .accounts({
        fund: fundPDA,
        treasury: treasuryPDA,
        userStats: userStatsAccountPublicKey,
        user: userAccountPublicKey,
        state: statePublicKey,
        manager: manager.publicKey,
        driftProgram: new PublicKey(DRIFT_PROGRAM_ID)
      })
      .rpc({ commitment });
    console.log("driftInitialize", txId);
  });
  it("Drift: update trader", async () => {
    const userAccountPublicKey = await getUserAccountPublicKey(
      new PublicKey(DRIFT_PROGRAM_ID),
      treasuryPDA,
      0
    );
    const trader = manager.publicKey;

    try {
      const txId = await program.methods
        .driftUpdateDelegatedTrader(trader)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          user: userAccountPublicKey,
          manager: manager.publicKey,
          driftProgram: DRIFT_PROGRAM_ID
        })
        .rpc({ commitment });

      console.log("driftUpdateDelegatedTrader", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, 10_000);

  /*
  it("Deposit 100 USDC in Drift trading account", async () => {
    const userAccountPublicKey = await getUserAccountPublicKey(
      new PublicKey(DRIFT_PROGRAM_ID),
      treasuryPDA,
      0
    );
    const userStatsAccountPublicKey = await getUserStatsAccountPublicKey(
      new PublicKey(DRIFT_PROGRAM_ID),
      treasuryPDA
    );
    const statePublicKey = await getDriftStateAccountPublicKey(
      new PublicKey(DRIFT_PROGRAM_ID)
    );

    const driftClient = new DriftClient({
      connection,
      wallet: manager,
      env: "devnet"
    });

    await driftClient.subscribe();

    const marketIndex = 0; // USDC
    const amount = new BN(100_000_000);
    const spotMarketAccountUsdc = new PublicKey(
      "GXWqPpjQpdz7KZw9p7f5PX2eGxHAhvpNXiviFkAB8zXg"
    );
    const pricingUsdc = new PublicKey(
      "5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7"
    );
    const pricingSol = new PublicKey(
      "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"
    );
    const driftSpotSol = new PublicKey(
      "3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"
    );
    const driftSpotUsdc = new PublicKey(
      "6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"
    );

    let remainingAccountsDeposit = [
      { pubkey: pricingSol, isSigner: false, isWritable: false },
      { pubkey: pricingUsdc, isSigner: false, isWritable: false },
      { pubkey: driftSpotSol, isSigner: false, isWritable: true },
      { pubkey: driftSpotUsdc, isSigner: false, isWritable: true }
    ];
    const usdc = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2");
    const treasuryUsdcAta = getAssociatedTokenAddressSync(
      usdc,
      treasuryPDA,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    console.log("treasuryUsdcAta", treasuryUsdcAta.toBase58());

    try {
      const txId = await program.methods
        .driftDeposit(amount)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          treasuryAta: treasuryUsdcAta,
          driftAta: spotMarketAccountUsdc,
          userStats: userStatsAccountPublicKey,
          user: userAccountPublicKey,
          state: statePublicKey,
          manager: manager.publicKey,
          tokenMint: usdc,
          driftProgram: new PublicKey(DRIFT_PROGRAM_ID),
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
        })
        .remainingAccounts(remainingAccountsDeposit)
        .rpc({ commitment });

      await connection.getParsedTransaction(txId, { commitment });
      console.log("driftDeposit", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, 30_000);

  it("Close fund", async () => {
    const fund = await program.account.fund.fetchNullable(fundPDA);
    expect(fund).not.toBeNull();

    await program.methods
      .close()
      .accounts({
        fund: fundPDA,
        manager: manager.publicKey
      })
      .rpc({ commitment });

    // The account should no longer exist, returning null.
    const closedAccount = await program.account.fund.fetchNullable(fundPDA);
    expect(closedAccount).toBeNull();
  });
*/
});
