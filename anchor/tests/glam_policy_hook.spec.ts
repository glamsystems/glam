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
  PermanentDelegateLayout,
  defaultAccountStateInstructionData,
} from "@solana/spl-token";

import { fundTestExample, createFundForTest, str2seed, sleep } from "./setup";
import { GlamClient, WSOL } from "../src";

describe("glam_policy_hook", () => {
  const glamClient = new GlamClient();

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
  const ethOrWsol = WSOL;

  const client = new GlamClient();
  const manager = (client.provider as anchor.AnchorProvider)
    .wallet as anchor.Wallet;

  const shareClass = {
    ...fundTestExample.shareClasses[0],
    lockUpPeriodInSeconds: 3,
    lockUpComment: "lock-up test",
    permanentDelegate: new PublicKey(0),
  } as any;
  const fundExample = {
    ...fundTestExample,
    name: "Glam Investment",
    assets: [WSOL, usdc.publicKey, btc.publicKey],
    shareClasses: [shareClass],
  } as any;

  const fundPDA = client.getFundPDA(fundExample);
  const treasuryPDA = client.getTreasuryPDA(fundPDA);
  const sharePDA = client.getShareClassPDA(fundPDA, 0);

  const connection = client.provider.connection;
  const commitment = "confirmed";
  const program = client.program;

  // manager
  const managerSharesAta = getAssociatedTokenAddressSync(
    sharePDA,
    manager.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // alice
  const aliceSharesAta = getAssociatedTokenAddressSync(
    sharePDA,
    alice.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  beforeAll(async () => {
    try {
      await Promise.all(
        // exec in parallel, but await before ending the test
        tokenKeypairs.map(async (token, idx) => {
          const mint = await createMint(
            client.provider.connection,
            manager.payer,
            manager.publicKey,
            null,
            idx == 0 ? 6 : 8,
            token,
            { commitment }, // await 'confirmed'
            idx == 1 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID
          );

          // create ATAs for each user
          for (const user of userKeypairs) {
            // send 1 SOL to each user
            const airdrop = await connection.requestAirdrop(
              user.publicKey,
              1_000_000_000
            );
            await connection.confirmTransaction(airdrop);

            const userATA = await createAssociatedTokenAccount(
              connection,
              user,
              token.publicKey,
              user.publicKey,
              {},
              idx == 1 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID
            );
            await mintTo(
              connection,
              user,
              token.publicKey,
              userATA,
              manager.payer,
              idx == 1 ? 10_000_000_000 : 1000_000_000,
              [],
              {},
              idx == 1 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID
            );
          }

          const managerAta = await createAssociatedTokenAccount(
            connection,
            manager.payer,
            token.publicKey,
            manager.publicKey,
            {},
            idx == 1 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID
          );

          await mintTo(
            connection,
            manager.payer,
            token.publicKey,
            managerAta,
            manager.payer,
            idx == 1 ? 1000_000_000_000 : 1000_000_000,
            [],
            { commitment }, // await 'confirmed'
            idx == 1 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID
          );
        })
      );

      //
      // create fund
      //
      const fundData = await createFundForTest(client, fundExample);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, /* timeout */ 15_000);

  /*afterAll(async () => {
    await program.methods
      .close()
      .accounts({
        fund: fundPDA,
        manager: manager.publicKey
      })
      .rpc();

    // The account should no longer exist, returning null.
    const closedAccount = await program.account.fund.fetchNullable(fundPDA);
    expect(closedAccount).toBeNull();
  });*/

  it("Fund created", async () => {
    try {
      const fund = await program.account.fundAccount.fetch(fundPDA);
      expect(fund.shareClasses[0]).toEqual(sharePDA);
    } catch (e) {
      console.error(e);
    }
  });

  it("Manager subscribes SOL to fund", async () => {
    const amount = new BN(50 * 10 ** 9);
    const expectedShares = amount.toString(); // 1 SOL = 1 share
    try {
      const txId = await glamClient.investor.subscribe(fundPDA, WSOL, amount);
      console.log("subscribe sol:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const shares = await getMint(
      connection,
      sharePDA,
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect(shares.supply.toString()).toEqual(expectedShares);

    const managerShares = await getAccount(
      connection,
      managerSharesAta,
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect(managerShares.amount).toEqual(shares.supply);
  });

  it("Manager redeems + transfers shares to Alice: both fail for lock-up", async () => {
    const amount = new BN(10 * 10 ** 9);

    try {
      const txId = await glamClient.investor.redeem(fundPDA, amount);
      expect(txId).toBeUndefined();
    } catch (err) {
      const errMsg = err.message + err.logs;
      expect(errMsg).toContain("Policy violation: lock out period");
    }

    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        manager.publicKey,
        aliceSharesAta,
        alice.publicKey,
        sharePDA,
        TOKEN_2022_PROGRAM_ID
      ),
      await createTransferCheckedWithTransferHookInstruction(
        connection,
        managerSharesAta,
        sharePDA,
        aliceSharesAta,
        manager.publicKey,
        amount,
        9,
        [],
        commitment,
        TOKEN_2022_PROGRAM_ID
      )
    );

    try {
      const txId = await sendAndConfirmTransaction(connection, tx, [
        manager.payer,
      ]);
      expect(txId).toBeUndefined();
    } catch (err) {
      const errMsg = err.message + err.logs;
      expect(errMsg).toContain("Policy violation: lock out period");
    }
  });

  it("Wait of lock-up. Then manager redeems + transfers shares to Alice: both succeed", async () => {
    console.log("Zzz...");
    await sleep(5_000);
    const amount = new BN(10 * 10 ** 9);

    try {
      const txId = await glamClient.investor.redeem(fundPDA, amount);
      console.log("manager redeems shares:", txId);
    } catch (err) {
      throw err;
    }

    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        manager.publicKey,
        aliceSharesAta,
        alice.publicKey,
        sharePDA,
        TOKEN_2022_PROGRAM_ID
      ),
      await createTransferCheckedWithTransferHookInstruction(
        connection,
        managerSharesAta,
        sharePDA,
        aliceSharesAta,
        manager.publicKey,
        amount,
        9,
        [],
        commitment,
        TOKEN_2022_PROGRAM_ID
      )
    );

    try {
      const txId = await sendAndConfirmTransaction(connection, tx, [
        manager.payer,
      ]);
      console.log("manager transfers shares:", txId);
    } catch (err) {
      throw err;
    }

    try {
      const txId = await glamClientAlice.investor.redeem(fundPDA, amount);
      console.log("alice redeems shares:", txId);
    } catch (err) {
      throw err;
    }
  }, 10_000);
});
