import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
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
  createTransferCheckedInstruction,
} from "@solana/spl-token";

import { fundTestExample, createFundForTest, str2seed } from "./setup";
import { GlamClient } from "../src";

describe("glam_investor", () => {
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

  const tokenKeypairs = [
    Keypair.fromSeed(str2seed("usdc")), // mock token 0
    Keypair.fromSeed(str2seed("eth")), // ...
    Keypair.fromSeed(str2seed("btc")),
  ];
  const usdc = tokenKeypairs[0]; // 6 decimals
  const eth = tokenKeypairs[1]; // 8 decimals
  const btc = tokenKeypairs[2]; // 8 decimals, token2022
  const BTC_TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;
  const wsol = new PublicKey("So11111111111111111111111111111111111111112");
  const ethOrWsol = useWsolInsteadOfEth ? wsol : eth.publicKey;

  // console.log("USDC", usdc.publicKey);
  // console.log("ETH", eth.publicKey);
  // console.log("BTC", btc.publicKey);

  const client = new GlamClient();
  const manager = (client.provider as anchor.AnchorProvider)
    .wallet as anchor.Wallet;

  const fundExample = {
    ...fundTestExample,
    name: "Glam Investment",
    assets: [usdc.publicKey, btc.publicKey, ethOrWsol],
    assetsWeights: [0, 60, 40],
  } as any;
  // overwrite share class acls
  // alice and manager are allowed to subcribe
  // bob and eve will be blocked
  fundExample.shareClasses[0].allowlist = [
    alice.publicKey,
    bob.publicKey,
    manager.publicKey,
  ];
  fundExample.shareClasses[0].blocklist = [bob.publicKey, eve.publicKey];

  const fundPDA = client.getFundPDA(fundExample);
  const treasuryPDA = client.getTreasuryPDA(fundPDA);
  const sharePDA = client.getShareClassPDA(fundPDA, 0);

  const connection = client.provider.connection;
  const commitment = "confirmed";
  const program = client.program;

  const treasuryUsdcAta = getAssociatedTokenAddressSync(
    usdc.publicKey,
    treasuryPDA,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const treasuryEthAta = getAssociatedTokenAddressSync(
    ethOrWsol,
    treasuryPDA,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const treasuryBtcAta = getAssociatedTokenAddressSync(
    btc.publicKey,
    treasuryPDA,
    true,
    BTC_TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // manager
  const managerUsdcAta = getAssociatedTokenAddressSync(
    usdc.publicKey,
    manager.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const managerEthAta = getAssociatedTokenAddressSync(
    ethOrWsol,
    manager.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const managerBtcAta = getAssociatedTokenAddressSync(
    btc.publicKey,
    manager.publicKey,
    false,
    BTC_TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const managerSharesAta = getAssociatedTokenAddressSync(
    sharePDA,
    manager.publicKey,
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
            idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID
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
              idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID
            );
            await mintTo(
              connection,
              user,
              token.publicKey,
              userATA,
              manager.payer,
              idx == 2 ? 10_000_000_000 : 1000_000_000,
              [],
              {},
              idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID
            );
          }

          const managerAta = await createAssociatedTokenAccount(
            connection,
            manager.payer,
            token.publicKey,
            manager.publicKey,
            {},
            idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID
          );

          await mintTo(
            connection,
            manager.payer,
            token.publicKey,
            managerAta,
            manager.payer,
            idx == 2 ? 1000_000_000_000 : 1000_000_000,
            [],
            { commitment }, // await 'confirmed'
            idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID
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

  it("Create treasury ATAs", async () => {
    // TODO: can we automatically create treasury ATAs?
    try {
      const tx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          treasuryUsdcAta,
          treasuryPDA,
          usdc.publicKey,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          treasuryEthAta,
          treasuryPDA,
          ethOrWsol,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          treasuryBtcAta,
          treasuryPDA,
          btc.publicKey,
          BTC_TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
      await sendAndConfirmTransaction(connection, tx, [manager.payer], {
        skipPreflight: true,
        commitment,
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Manager tests subscribe ETH to fund", async () => {
    const amount = useWsolInsteadOfEth
      ? new BN(500 * 10 ** 9)
      : new BN(10 * 10 ** 8); // 500 SOL ~= 10 ETH = $30k
    const expectedShares = "3000"; // $10/share => 3k shares
    try {
      const txId = await glamClient.investor.subscribe(
        fundPDA,
        ethOrWsol,
        amount
      );
      console.log("subscribe eth:", txId);
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
    console.log("total shares:", shares.supply);
    // expect((shares.supply.toString()).toEqual(expectedShares); //TODO: compare BigInt?

    const managerShares = await getAccount(
      connection,
      managerSharesAta,
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect(managerShares.amount).toEqual(shares.supply);
  });

  it("Invalid share class disallowed", async () => {
    try {
      const keypair = Keypair.generate();
      const invalidShareClass = await createMint(
        connection,
        manager.payer,
        keypair.publicKey,
        null,
        6,
        keypair,
        { commitment },
        TOKEN_2022_PROGRAM_ID
      );
      const shareAta = getAssociatedTokenAddressSync(
        invalidShareClass,
        manager.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      const txId = await program.methods
        .subscribe(new BN(1 * 10 ** 8), true)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          shareClass: invalidShareClass,
          signerShareAta: shareAta,
          asset: btc.publicKey,
          treasuryAta: treasuryBtcAta,
          signerAssetAta: managerBtcAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .rpc({ commitment });
    } catch (e) {
      // console.error(e);
      expect(e.message).toContain("A seeds constraint was violated");
      expect(e.message).toContain("Error Code: ConstraintSeeds");
    }
  });

  it("Manager tests subscribe BTC to fund", async () => {
    const amount = new BN(1 * 10 ** 8); // 1 BTC = $51k
    const expectedShares = "8100"; // 3,000 + 5,100
    try {
      const txId = await glamClient.investor.subscribe(
        fundPDA,
        btc.publicKey,
        amount
      );
      console.log("subscribe btc:", txId);
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
    console.log("total shares:", shares.supply);
    // expect(shares.supply.toString()).toEqual(expectedShares); //TODO: compare BigInt?

    const managerShares = await getAccount(
      connection,
      managerSharesAta,
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect(managerShares.amount).toEqual(shares.supply);
  });

  it("Manager redeems 50% of fund", async () => {
    let shares = await getMint(
      connection,
      sharePDA,
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    const amount = new BN(shares.supply / 2n);
    console.log("total shares:", shares.supply, "amount:", amount);
    try {
      const txId = await glamClient.investor.redeem(fundPDA, amount, true);
      console.log("redeem 50%:", txId);
    } catch (e) {
      // redeem
      console.error(e);
      throw e;
    }

    shares = await getMint(
      connection,
      sharePDA,
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    // expect(shares.supply.toString()).toEqual(remaining.toString());

    const managerShares = await getAccount(
      connection,
      managerSharesAta,
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect(managerShares.amount).toEqual(shares.supply);
  });

  it("Manager adds more tokens and redeems USDC", async () => {
    // transfer 250 USDC into the treasury (e.g. fees)
    const amountExt = new BN(250_000_000);
    try {
      const tx1 = new Transaction().add(
        createTransferCheckedInstruction(
          managerUsdcAta,
          usdc.publicKey,
          treasuryUsdcAta,
          manager.publicKey,
          amountExt,
          6,
          [],
          TOKEN_PROGRAM_ID
        )
      );
      await sendAndConfirmTransaction(connection, tx1, [manager.payer], {
        skipPreflight: true,
        commitment,
      });
    } catch (e) {
      // transfer usdc into treasury
      console.error(e);
      throw e;
    }

    let treasuryUsdc = await getAccount(
      connection,
      treasuryUsdcAta,
      commitment,
      TOKEN_PROGRAM_ID
    );
    const oldAmountUsdc = treasuryUsdc.amount;
    expect(oldAmountUsdc.toString()).toEqual(amountExt.toString());

    let treasuryBtc = await getAccount(
      connection,
      treasuryBtcAta,
      commitment,
      BTC_TOKEN_PROGRAM_ID
    );
    const oldAmountBtc = treasuryBtc.amount;

    const amount = new BN(500_000_000);
    try {
      const txId = await glamClient.investor.redeem(fundPDA, amount, false);
      console.log("redeem USDC:", txId);
    } catch (e) {
      // redeem
      console.error(e);
      throw e;
    }

    treasuryUsdc = await getAccount(
      connection,
      treasuryUsdcAta,
      commitment,
      TOKEN_PROGRAM_ID
    );
    const newAmountUsdc = treasuryUsdc.amount;

    treasuryBtc = await getAccount(
      connection,
      treasuryBtcAta,
      commitment,
      BTC_TOKEN_PROGRAM_ID
    );
    const newAmountBtc = treasuryBtc.amount;

    // new usdc amount should be less than old amount
    expect(oldAmountUsdc).toBeGreaterThan(newAmountUsdc);
    // no change in btc amount
    expect(oldAmountBtc).toEqual(newAmountBtc);
  });

  it("Manager redeems 100% of fund", async () => {
    let shares = await getMint(
      connection,
      sharePDA,
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    const amount = new BN(shares.supply);
    try {
      const txId = await glamClient.investor.redeem(fundPDA, amount, true);
      console.log("redeem 100%:", txId);
    } catch (e) {
      // redeem
      console.error(e);
      throw e;
    }

    shares = await getMint(
      connection,
      sharePDA,
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect(shares.supply.toString()).toEqual("0");

    const managerShares = await getAccount(
      connection,
      managerSharesAta,
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    expect(managerShares.amount).toEqual(shares.supply); // 0

    const treasuryUsdc = await getAccount(
      connection,
      treasuryUsdcAta,
      commitment,
      TOKEN_PROGRAM_ID
    );
    expect(treasuryUsdc.amount).toEqual(shares.supply); // 0

    const treasuryEth = await getAccount(
      connection,
      treasuryEthAta,
      commitment,
      TOKEN_PROGRAM_ID
    );
    expect(treasuryEth.amount).toEqual(shares.supply); // 0

    const treasuryBtc = await getAccount(
      connection,
      treasuryBtcAta,
      commitment,
      BTC_TOKEN_PROGRAM_ID
    );
    expect(treasuryBtc.amount).toEqual(shares.supply); // 0
  });

  it("Alice subscribes to fund with 250 USDC", async () => {
    const amount = new BN(250 * 10 ** 6); // USDC has 6 decimals
    try {
      const txId = await glamClient.investor.subscribe(
        fundPDA,
        usdc.publicKey,
        amount,
        0,
        true,
        alice
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
    // $250 for $100 per share => 2.5 shares
    // in reality it will be less due to fees but toFixed(2) rounds it up
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("2.50");
  });

  it("Bob is not allowed to subscribe", async () => {
    const amount = new BN(250 * 10 ** 6); // USDC has 6 decimals
    try {
      const txId = await glamClient.investor.subscribe(
        fundPDA,
        usdc.publicKey,
        amount,
        0,
        true,
        bob
      );
      console.log("tx:", txId);
      expect(txId).toBeUndefined();
    } catch (err) {
      // console.error(err);
      const errMsg = err.message + err.logs;
      expect(errMsg).toContain("Share class not allowed to subscribe");
      expect(errMsg).toContain("Error Code: InvalidShareClass");
    }
  });

  it("Eve is not allowed to subscribe", async () => {
    const amount = new BN(250 * 10 ** 6); // USDC has 6 decimals
    try {
      const txId = await glamClient.investor.subscribe(
        fundPDA,
        usdc.publicKey,
        amount,
        0,
        true,
        eve
      );
      console.log("tx:", txId);
      expect(txId).toBeUndefined();
    } catch (err) {
      // console.error(err);
      const errMsg = err.message + err.logs;
      expect(errMsg).toContain("Share class not allowed to subscribe");
      expect(errMsg).toContain("Error Code: InvalidShareClass");
    }
  });
});
