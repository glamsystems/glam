import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccount,
} from "@solana/spl-token";
import { DRIFT_PROGRAM_ID, DriftClient } from "@drift-labs/sdk";
import { Glam, GlamClient, GlamProgram } from "../src";

import {
  getDriftStateAccountPublicKey,
  getUserAccountPublicKey,
  getUserStatsAccountPublicKey,
} from "@drift-labs/sdk";
import { createFundForTest } from "./setup";

describe("glam_drift", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const glamClient = new GlamClient();
  const manager = glamClient.getManager();

  const program = anchor.workspace.Glam as GlamProgram;
  const commitment = "confirmed";

  let fundPDA, treasuryPDA, sharePDA;

  it("Create fund", async () => {
    const fundData = await createFundForTest();
    fundPDA = fundData.fundPDA;
    treasuryPDA = fundData.treasuryPDA;
    sharePDA = fundData.sharePDA;
  });

  it("Initialize fund", async () => {
    const fund = await program.account.fundAccount.fetch(fundPDA);
    expect(fund.shareClasses.length).toEqual(1);
    // expect(fund.assets.length).toEqual(3);
    // expect(fund.symbol).toEqual("GBTC");
    // expect(fund.isActive).toEqual(true);
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
    try {
      const txId = await program.methods
        .driftInitialize()
        .accounts({
          fund: fundPDA,
          user: userAccountPublicKey,
          userStats: userStatsAccountPublicKey,
          state: statePublicKey,
          manager,
        })
        .rpc({ commitment });
      console.log("driftInitialize", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Drift: update trader", async () => {
    const userAccountPublicKey = await getUserAccountPublicKey(
      new PublicKey(DRIFT_PROGRAM_ID),
      treasuryPDA,
      0
    );
    const trader = manager;

    try {
      const txId = await program.methods
        .driftUpdateUserDelegate(0, trader)
        .accounts({
          fund: fundPDA,
          user: userAccountPublicKey,
          manager,
        })
        .rpc({ commitment });

      console.log("driftUpdateUserDelegate", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

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

    const connection = glamClient.provider.connection;
    const driftClient = new DriftClient({
      connection,
      wallet: glamClient.getWallet(),
      env: "devnet",
    });

    await driftClient.subscribe();

    const marketIndex = 0; // SOL
    // https://github.com/drift-labs/protocol-v2/blob/master/sdk/src/constants/perpMarkets.ts#L18-L29
    // {
    //   fullName: 'Solana',
    //   category: ['L1', 'Infra'],
    //   symbol: 'SOL-PERP',
    //   baseAssetSymbol: 'SOL',
    //   marketIndex: 0,
    //   oracle: new PublicKey('BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF'),
    //   launchTs: 1655751353000,
    //   oracleSource: OracleSource.PYTH_PULL,
    //   pythFeedId:
    //     '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    // },

    const amount = new anchor.BN(100_000_000);
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
      { pubkey: driftSpotUsdc, isSigner: false, isWritable: true },
    ];
    const usdc = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2");
    const treasuryUsdcAta = await createAssociatedTokenAccount(
      connection,
      manager,
      usdc,
      treasuryPDA,
      { commitment }
    );
    console.log("treasuryUsdcAta", treasuryUsdcAta.toBase58());

    try {
      const txId = await program.methods
        .driftDeposit(0, amount)
        .accounts({
          fund: fundPDA,
          treasuryAta: treasuryUsdcAta,
          driftAta: spotMarketAccountUsdc,
          userStats: userStatsAccountPublicKey,
          user: userAccountPublicKey,
          state: statePublicKey,
          manager: manager.publicKey,
          tokenMint: usdc,
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
  */
});
