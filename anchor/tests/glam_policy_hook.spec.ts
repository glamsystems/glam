import * as anchor from "@coral-xyz/anchor";
import { BN, Wallet } from "@coral-xyz/anchor";
import {
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
  Keypair,
} from "@solana/web3.js";
import {
  createMint,
  createAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  mintTo,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getAccount,
  createTransferCheckedWithTransferHookInstruction,
} from "@solana/spl-token";

import {
  stateModelForTest,
  createGlamStateForTest,
  str2seed,
  sleep,
} from "./setup";
import { GlamClient, WSOL } from "../src";

describe("glam_policy_hook", () => {
  const glamClient = new GlamClient();
  const wallet = glamClient.getWallet();

  const userKeypairs = [
    Keypair.generate(), // alice
  ];
  const alice = userKeypairs[0];
  const glamClientAlice = new GlamClient({ wallet: new Wallet(alice) });

  const tokenKeypairs = [
    Keypair.fromSeed(str2seed("usdc")), // mock token 0
    Keypair.fromSeed(str2seed("btc")),
  ];
  const usdc = tokenKeypairs[0]; // 6 decimals
  const btc = tokenKeypairs[1]; // 8 decimals, token2022
  const BTC_TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;

  const mint = {
    ...stateModelForTest.mints![0],
    lockUpPeriodInSeconds: 5,
    lockUpComment: "lock-up test",
    permanentDelegate: new PublicKey(0),
  } as any;

  const stateModel = {
    ...stateModelForTest,
    name: "Glam Investment",
    assets: [WSOL, usdc.publicKey, btc.publicKey],
    mints: [mint],
  } as any;

  const statePda = glamClient.getStatePda(stateModel);
  const sharePDA = glamClient.getShareClassPda(statePda, 0);

  const connection = glamClient.provider.connection;
  const commitment = "confirmed";

  // manager
  const managerSharesAta = getAssociatedTokenAddressSync(
    sharePDA,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  // alice
  const aliceSharesAta = getAssociatedTokenAddressSync(
    sharePDA,
    alice.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  beforeAll(async () => {
    try {
      await Promise.all(
        // exec in parallel, but await before ending the test
        tokenKeypairs.map(async (token, idx) => {
          const mint = await createMint(
            glamClient.provider.connection,
            wallet.payer,
            wallet.publicKey,
            null,
            idx == 0 ? 6 : 8,
            token,
            { commitment }, // await 'confirmed'
            idx == 1 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
          );

          // create ATAs for each user
          for (const user of userKeypairs) {
            // send 1 SOL to each user
            const airdrop = await connection.requestAirdrop(
              user.publicKey,
              1_000_000_000,
            );
            await connection.confirmTransaction(airdrop);

            const userATA = await createAssociatedTokenAccount(
              connection,
              user,
              token.publicKey,
              user.publicKey,
              {},
              idx == 1 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
            );
            await mintTo(
              connection,
              user,
              token.publicKey,
              userATA,
              wallet.payer,
              idx == 1 ? 10_000_000_000 : 1000_000_000,
              [],
              {},
              idx == 1 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
            );
          }

          const managerAta = await createAssociatedTokenAccount(
            connection,
            wallet.payer,
            token.publicKey,
            wallet.publicKey,
            {},
            idx == 1 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
          );

          await mintTo(
            connection,
            wallet.payer,
            token.publicKey,
            managerAta,
            wallet.payer,
            idx == 1 ? 1000_000_000_000 : 1000_000_000,
            [],
            { commitment }, // await 'confirmed'
            idx == 1 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
          );
        }),
      );

      //
      // create fund
      //
      await createGlamStateForTest(glamClient, stateModel);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, /* timeout */ 15_000);

  it("Fund created", async () => {
    try {
      const state = await glamClient.fetchState(statePda);
      expect(state.mints[0]?.lockUpPeriodInSeconds).toEqual(5);
      expect(state.mints[0]?.symbol).toEqual("GBS");
      expect(state.mints[0]?.permanentDelegate).toEqual(sharePDA);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Manager subscribes SOL to fund", async () => {
    const amount = new BN(50 * 10 ** 9);
    const expectedShares = amount.toString(); // 1 SOL = 1 share
    try {
      const txId = await glamClient.investor.subscribe(statePda, WSOL, amount);
      console.log("subscribe sol:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const shares = await getMint(
      connection,
      sharePDA,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(shares.supply.toString()).toEqual(expectedShares);

    const managerShares = await getAccount(
      connection,
      managerSharesAta,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(managerShares.amount).toEqual(shares.supply);
  }, 15_000);

  it("Manager redeems + transfers shares to Alice: both fail for lock-up", async () => {
    const amount = new BN(10 * 10 ** 9);

    try {
      const txId = await glamClient.investor.redeem(statePda, amount);
      expect(txId).toBeUndefined();
    } catch (err) {
      expect(err.message).toContain("Policy violation: lock-up period");
    }

    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        aliceSharesAta,
        alice.publicKey,
        sharePDA,
        TOKEN_2022_PROGRAM_ID,
      ),
      await createTransferCheckedWithTransferHookInstruction(
        connection,
        managerSharesAta,
        sharePDA,
        aliceSharesAta,
        wallet.publicKey,
        amount,
        9,
        [],
        commitment,
        TOKEN_2022_PROGRAM_ID,
      ),
    );

    try {
      const txId = await sendAndConfirmTransaction(connection, tx, [
        wallet.payer,
      ]);
      expect(txId).toBeUndefined();
    } catch (err) {
      expect(err.message).toContain("Policy violation: lock-up period");
    }
  });

  it("Wait of lock-up. Then manager redeems + transfers shares to Alice: both succeed", async () => {
    console.log("Zzz...");
    await sleep(10_000);
    const amount = new BN(10 * 10 ** 9);

    try {
      const txId = await glamClient.investor.redeem(statePda, amount);
      console.log("manager redeems shares:", txId);
    } catch (err) {
      throw err;
    }

    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        aliceSharesAta,
        alice.publicKey,
        sharePDA,
        TOKEN_2022_PROGRAM_ID,
      ),
      await createTransferCheckedWithTransferHookInstruction(
        connection,
        managerSharesAta,
        sharePDA,
        aliceSharesAta,
        wallet.publicKey,
        amount,
        9,
        [],
        commitment,
        TOKEN_2022_PROGRAM_ID,
      ),
    );

    try {
      const txId = await sendAndConfirmTransaction(connection, tx, [
        wallet.payer,
      ]);
      console.log("manager transfers shares:", txId);
    } catch (err) {
      throw err;
    }

    try {
      const txId = await glamClientAlice.investor.redeem(statePda, amount);
      console.log("alice redeems shares:", txId);
    } catch (err) {
      throw err;
    }
  }, 15_000);
});
