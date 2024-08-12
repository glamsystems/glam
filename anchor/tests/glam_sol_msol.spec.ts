import * as anchor from "@coral-xyz/anchor";
import { BN, Wallet } from "@coral-xyz/anchor";
import {
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  SystemProgram,
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
  createTransferCheckedInstruction,
} from "@solana/spl-token";

import {
  fundTestExample,
  createFundForTest,
  quoteResponseForTest,
  swapInstructionsForTest,
} from "./setup";
import { GlamClient, MSOL, WSOL } from "../src";

describe("glam_sol_msol", () => {
  const glamClient = new GlamClient();

  const useWsolInsteadOfEth = true;

  const userKeypairs = [
    Keypair.generate(), // alice
    Keypair.generate(), // bob
    Keypair.generate(), // eve
  ];
  const alice = userKeypairs[0];
  const bob = userKeypairs[1];
  const eve = userKeypairs[2];
  const glamClientAlice = new GlamClient({ wallet: new Wallet(alice) });
  const glamClientBob = new GlamClient({ wallet: new Wallet(bob) });
  const glamClientEve = new GlamClient({ wallet: new Wallet(eve) });

  const client = new GlamClient();
  const manager = (client.provider as anchor.AnchorProvider)
    .wallet as anchor.Wallet;

  const fundExample = {
    ...fundTestExample,
    name: "Glam SOL-mSOL",
    assets: [WSOL, MSOL],
  } as any;

  const fundPDA = client.getFundPDA(fundExample);
  const treasuryPDA = client.getTreasuryPDA(fundPDA);
  const sharePDA = client.getShareClassPDA(fundPDA, 0);

  const connection = client.provider.connection;
  const commitment = "confirmed";

  beforeAll(async () => {
    try {
      await Promise.all(
        userKeypairs.map(async (user) => {
          // send 10 SOL to each user
          const airdrop = await connection.requestAirdrop(
            user.publicKey,
            10_000_000_000
          );
          return await connection.confirmTransaction(airdrop);
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

  it("Fund created", async () => {
    try {
      const fund = await glamClient.fetchFundAccount(fundPDA);
      expect(fund.name).toEqual(fundExample.name);
    } catch (e) {
      console.error(e);
    }
  });

  it("Alice subscribes to fund with 1 SOL", async () => {
    const amount = new BN(1_000_000_000);
    try {
      const txId = await glamClientAlice.investor.subscribe(
        fundPDA,
        WSOL,
        amount,
        0,
        true
      );
      console.log("tx:", txId);
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
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("1.00");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect((Number(sharesAta.amount) / 1e9).toFixed(2)).toEqual("1.00");
  });

  it("Bob subscribes to fund with 2 SOL", async () => {
    const amount = new BN(2_000_000_000);
    try {
      const txId = await glamClientBob.investor.subscribe(
        fundPDA,
        WSOL,
        amount,
        0,
        true
      );
      console.log("tx:", txId);
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
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("3.00");
    const sharesAta = await getAccount(
      connection,
      glamClientBob.getShareClassAta(bob.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect((Number(sharesAta.amount) / 1e9).toFixed(2)).toEqual("2.00");
  });

  it("Alice subscribes to fund with 3 SOL", async () => {
    const amount = new BN(3_000_000_000);
    try {
      const txId = await glamClientAlice.investor.subscribe(
        fundPDA,
        WSOL,
        amount,
        0,
        true
      );
      console.log("tx:", txId);
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
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("6.00");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect((Number(sharesAta.amount) / 1e9).toFixed(2)).toEqual("4.00");
  });

  it("Alice redeems 2 shares", async () => {
    const amount = new BN(2_000_000_000);
    try {
      const txId = await glamClientAlice.investor.redeem(
        fundPDA,
        amount,
        true,
        0,
        true
      );
      console.log("tx:", txId);
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
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("4.00");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect((Number(sharesAta.amount) / 1e9).toFixed(2)).toEqual("2.00");
    const wsolAta = await getAccount(
      connection,
      getAssociatedTokenAddressSync(WSOL, alice.publicKey),
      commitment,
      TOKEN_PROGRAM_ID
    );
    expect((Number(wsolAta.amount) / 1e9).toFixed(2)).toEqual("2.00");
  });

  /*
   * Modify share price
   */

  it("Alice subscribes to fund with 3 SOL", async () => {
    /* The fund has 4 SOL for 4 shares (share price is 1 SOL).
       We airdrop 2 SOL.
       The fund has 6 SOL for 4 shares (share price is 1.5 SOL).
       With 3 SOL, Alice gets 2 shares.
       The fund has 9 SOL for 6 shares. */
    const airdrop = await connection.requestAirdrop(treasuryPDA, 2_000_000_000);
    await connection.confirmTransaction(airdrop);

    const amount = new BN(3_000_000_000);
    try {
      const txId = await glamClientAlice.investor.subscribe(
        fundPDA,
        WSOL,
        amount,
        0,
        true
      );
      console.log("tx:", txId);
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
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("6.00");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect((Number(sharesAta.amount) / 1e9).toFixed(2)).toEqual("4.00");
  });

  it("Alice redeems 2 shares", async () => {
    /* The fund has 9 SOL for 6 shares (share price is 1.5 SOL).
       We airdrop 3 SOL.
       The fund has 12 SOL for 6 shares (share price is 2 SOL).
       With 1 share, Alice gets 2 SOL.
       The fund has 10 SOL for 5 shares. */
    const airdrop = await connection.requestAirdrop(treasuryPDA, 3_000_000_000);
    await connection.confirmTransaction(airdrop);

    const amount = new BN(1_000_000_000);
    try {
      const txId = await glamClientAlice.investor.redeem(
        fundPDA,
        amount,
        true,
        0,
        true
      );
      console.log("tx:", txId);
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
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("5.00");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect((Number(sharesAta.amount) / 1e9).toFixed(2)).toEqual("3.00");
    const wsolAta = await getAccount(
      connection,
      getAssociatedTokenAddressSync(WSOL, alice.publicKey),
      commitment,
      TOKEN_PROGRAM_ID
    );
    expect((Number(wsolAta.amount) / 1e9).toFixed(2)).toEqual("2.00");
  });

  /*
   * mSOL
   */

  it("Manager swaps some SOL", async () => {
    /* The fund has 10 SOL for 5 shares.
       We swap .05 SOL for .41795954 mSOL.
       mSOL price is 1.186356194 SOL.
       The value of the fund is almost unchanged. */

    const manager = glamClient.getManager();
    const inputSignerAta = glamClient.getManagerAta(WSOL);
    const outputSignerAta = glamClient.getManagerAta(MSOL);

    const quoteResponse = quoteResponseForTest;
    const swapInstructions = swapInstructionsForTest(
      manager,
      inputSignerAta,
      outputSignerAta
    );

    const amount = 50_000_000;
    try {
      const txId = await glamClient.jupiter.swap(
        fundPDA,
        undefined,
        quoteResponse,
        swapInstructions
      );
      console.log("swap e2e txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Alice subscribes to fund with 3 SOL", async () => {
    /* The fund has ~10 SOL for 5 shares. */
    const amount = new BN(3_000_000_000);
    try {
      const txId = await glamClientAlice.investor.subscribe(
        fundPDA,
        WSOL,
        amount,
        0,
        true
      );
      console.log("tx:", txId);
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
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("6.50");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect((Number(sharesAta.amount) / 1e9).toFixed(2)).toEqual("4.50");
  });

  it("Alice redeems 2 shares", async () => {
    /* The fund has ~13 SOL for 6.5 shares. */
    const amount = new BN(1_000_000_000);
    try {
      const txId = await glamClientAlice.investor.redeem(
        fundPDA,
        amount,
        true,
        0,
        true
      );
      console.log("tx:", txId);
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
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("5.50");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect((Number(sharesAta.amount) / 1e9).toFixed(2)).toEqual("3.50");
    const wsolAta = await getAccount(
      connection,
      getAssociatedTokenAddressSync(WSOL, alice.publicKey),
      commitment,
      TOKEN_PROGRAM_ID
    );
    expect((Number(wsolAta.amount) / 1e9).toFixed(2)).toEqual("1.99"); // rounding err because of mSOL price
  });
});
