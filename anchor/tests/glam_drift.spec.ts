import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Glam } from "../target/types/glam";
import { DRIFT_PROGRAM_ID } from "@drift-labs/sdk";

import {
  getDriftStateAccountPublicKey,
  getUserAccountPublicKey,
  getUserStatsAccountPublicKey,
} from "@drift-labs/sdk";
import { createFundForTest } from "./setup";

describe("glam_drift", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const manager = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Glam as Program<Glam>;
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
        .driftInitialize(null)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          userStats: userStatsAccountPublicKey,
          user: userAccountPublicKey,
          state: statePublicKey,
          manager: manager.publicKey,
          driftProgram: new PublicKey(DRIFT_PROGRAM_ID),
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
    const trader = manager.publicKey;

    try {
      const txId = await program.methods
        .driftUpdateDelegatedTrader(trader)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          user: userAccountPublicKey,
          manager: manager.publicKey,
          driftProgram: DRIFT_PROGRAM_ID,
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
  */
});
