import { BN, Wallet } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getAccount,
} from "@solana/spl-token";

import {
  testFundModel,
  createFundForTest,
  quoteResponseForTest,
  swapInstructionsForTest,
  sleep,
} from "./setup";
import { FundModel, GlamClient, MSOL, WSOL } from "../src";

describe("glam_sol_msol", () => {
  const glamClient = new GlamClient();

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

  const testFund = {
    ...testFundModel,
    name: "Glam SOL-mSOL",
    assets: [WSOL, MSOL],
    integrationAcls: [
      { name: { marinade: {} }, features: [] },
      { name: { jupiterSwap: {} }, features: [] },
      { name: { nativeStaking: {} }, features: [] },
    ],
  } as Partial<FundModel>;

  const fundPDA = glamClient.getFundPDA(testFund);
  const treasuryPDA = glamClient.getTreasuryPDA(fundPDA);
  const sharePDA = glamClient.getShareClassPDA(fundPDA, 0);

  const connection = glamClient.provider.connection;
  const commitment = "confirmed";

  let defaultVote;

  beforeAll(async () => {
    try {
      await Promise.all(
        userKeypairs.map(async (user) => {
          // send 10 SOL to each user
          const airdrop = await connection.requestAirdrop(
            user.publicKey,
            10_000_000_000,
          );
          return await connection.confirmTransaction(airdrop);
        }),
      );

      //
      // create fund
      //
      const fundData = await createFundForTest(glamClient, testFund);

      // default vote account
      const voteAccountStatus = await connection.getVoteAccounts();
      const vote = voteAccountStatus.current.sort(
        (a, b) => b.activatedStake - a.activatedStake,
      )[0].votePubkey;
      defaultVote = new PublicKey(vote);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, /* timeout */ 15_000);

  it("Fund created", async () => {
    try {
      const fund = await glamClient.fetchFundAccount(fundPDA);
      expect(fund.name).toEqual(testFund.name);
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
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("1.00");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID,
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
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("3.00");
    const sharesAta = await getAccount(
      connection,
      glamClientBob.getShareClassAta(bob.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID,
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
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("6.00");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(sharesAta.amount) / 1e9).toFixed(2)).toEqual("4.00");
  });

  it("Alice redeems 2 shares", async () => {
    const amount = new BN(2_000_000_000);
    try {
      const txId = await glamClientAlice.investor.redeem(fundPDA, amount, true);
      console.log("tx:", txId);
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
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("4.00");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(sharesAta.amount) / 1e9).toFixed(2)).toEqual("2.00");
    const wsolAta = await getAccount(
      connection,
      getAssociatedTokenAddressSync(WSOL, alice.publicKey),
      commitment,
      TOKEN_PROGRAM_ID,
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
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("6.00");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID,
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
      const txId = await glamClientAlice.investor.redeem(fundPDA, amount, true);
      console.log("tx:", txId);
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
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("5.00");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(sharesAta.amount) / 1e9).toFixed(2)).toEqual("3.00");
    const wsolAta = await getAccount(
      connection,
      getAssociatedTokenAddressSync(WSOL, alice.publicKey),
      commitment,
      TOKEN_PROGRAM_ID,
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

    const signer = glamClient.getSigner();
    const inputSignerAta = glamClient.getAta(WSOL);
    const outputSignerAta = glamClient.getAta(MSOL);

    const quoteResponse = quoteResponseForTest;
    const swapInstructions = swapInstructionsForTest(
      signer,
      inputSignerAta,
      outputSignerAta,
    );

    const amount = 50_000_000;
    try {
      const txId = await glamClient.jupiter.swap(
        fundPDA,
        undefined,
        quoteResponse,
        swapInstructions,
      );
      console.log("swap e2e txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Alice subscribes to fund with 3 SOL", async () => {
    /* The fund has ~10 SOL for 5 shares.

       After subscribing with 3 SOL, the fund has ~13 SOL for ~6.5 shares.
       Alice receives ~1.5 shares */

    const amount = new BN(3_000_000_000);
    try {
      const txId = await glamClientAlice.investor.subscribe(
        fundPDA,
        WSOL,
        amount,
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
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("6.50");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(sharesAta.amount) / 1e9).toFixed(2)).toEqual("4.50");
  });

  it("Alice redeems 1 share", async () => {
    /* The fund has ~13 SOL (wSOL & mSOL) for ~6.5 shares.
       After in-kind redeeming 1 share, alice gets <2 wSOL. */

    const amount = new BN(1_000_000_000);
    try {
      const txId = await glamClientAlice.investor.redeem(fundPDA, amount, true);
      console.log("tx:", txId);
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
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("5.50");
    const sharesAta = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(alice.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(sharesAta.amount) / 1e9).toFixed(2)).toEqual("3.50");

    // Alice gets less than 2 wSOL and some mSOL
    const wsolAta = await getAccount(
      connection,
      getAssociatedTokenAddressSync(WSOL, alice.publicKey),
      commitment,
      TOKEN_PROGRAM_ID,
    );
    expect((Number(wsolAta.amount) / 1e9).toFixed(2)).toEqual("1.99");
    const msolAta = await getAccount(
      connection,
      getAssociatedTokenAddressSync(MSOL, alice.publicKey),
      commitment,
      TOKEN_PROGRAM_ID,
    );
    expect((Number(msolAta.amount) / 1e9).toFixed(3)).toEqual("0.006");
  });

  it("Manager orders marinade delayed stake and delegates stake", async () => {
    try {
      let txSig = await glamClient.marinade.delayedUnstake(
        fundPDA,
        new BN(30_000_000),
      );
      console.log("delayedUnstake txSig", txSig);

      txSig = await glamClient.staking.initializeAndDelegateStake(
        fundPDA,
        defaultVote,
        new BN(2_000_000_000),
      );
      console.log("initializeAndDelegateStake txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Eve subscribes to fund with 1 SOL twice at different epochs", async () => {
    /* The fund has ~11 SOL for 5.5 shares. */
    try {
      const txId = await glamClientEve.investor.subscribe(
        fundPDA,
        WSOL,
        new BN(1_000_000_000),
      );
      console.log("eve subscribe #0 tx:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    let shares = await getMint(
      connection,
      sharePDA,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("6.00");
    const sharesAtaEpoch0 = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(eve.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(sharesAtaEpoch0.amount) / 1e9).toFixed(2)).toEqual("0.50");

    await sleep(15_000); // wait for epoch change

    /* The fund has ~12 SOL for 6.0 shares. */
    try {
      const txId = await glamClientEve.investor.subscribe(
        fundPDA,
        WSOL,
        new BN(1_000_000_000),
      );
      console.log("eve subscribe #1 tx:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    shares = await getMint(
      connection,
      sharePDA,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("6.50");
    const sharesAtaEpoch1 = await getAccount(
      connection,
      glamClientAlice.getShareClassAta(eve.publicKey, sharePDA),
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect((Number(sharesAtaEpoch1.amount) / 1e9).toFixed(2)).toEqual("1.00");

    // shares received at epoch 1 should be less than shares received at epoch 0
    // because the fund has more SOL at epoch 1 due to staking yield
    expect(sharesAtaEpoch1.amount - sharesAtaEpoch0.amount).toBeLessThan(
      sharesAtaEpoch0.amount,
    );
  }, 30_000);
});
