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
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";

import {
  stateModelForTest,
  createGlamStateForTest,
  str2seed,
  airdrop,
} from "./setup";
import { GlamClient, WSOL } from "../src";

describe("glam_investor", () => {
  const glamClient = new GlamClient();
  const wallet = glamClient.getWallet();

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

  const tokenKeypairs = [
    Keypair.fromSeed(str2seed("usdc")), // mock token 0
    Keypair.fromSeed(str2seed("eth")), // ...
    Keypair.fromSeed(str2seed("btc")),
  ];
  const usdc = tokenKeypairs[0]; // 6 decimals
  const eth = tokenKeypairs[1]; // 8 decimals
  const btc = tokenKeypairs[2]; // 8 decimals, token2022
  const BTC_TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;
  const ethOrWsol = useWsolInsteadOfEth ? WSOL : eth.publicKey;

  const stateModel = {
    ...stateModelForTest,
    name: "Glam Investment",
    assets: [usdc.publicKey, btc.publicKey, ethOrWsol],
    integrations: [{ marinade: {} }],
    // overwrite share class acls: alice and manager are allowed to subscribe,
    // bob and eve will be blocked.
    mints: [
      {
        ...stateModelForTest.mints![0],
        allowlist: [alice.publicKey, bob.publicKey, wallet.publicKey],
        blocklist: [bob.publicKey, eve.publicKey],
      },
    ],
  };

  const statePda = glamClient.getStatePda(stateModel);
  const vaultPda = glamClient.getVaultPda(statePda);
  const mintPda = glamClient.getMintPda(statePda);

  const connection = glamClient.provider.connection;
  const commitment = "confirmed";

  const vaultUsdcAta = getAssociatedTokenAddressSync(
    usdc.publicKey,
    vaultPda,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const vaultEthAta = getAssociatedTokenAddressSync(
    ethOrWsol,
    vaultPda,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const vaultBtcAta = getAssociatedTokenAddressSync(
    btc.publicKey,
    vaultPda,
    true,
    BTC_TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  // manager
  const managerUsdcAta = getAssociatedTokenAddressSync(
    usdc.publicKey,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const managerEthAta = getAssociatedTokenAddressSync(
    ethOrWsol,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const managerBtcAta = getAssociatedTokenAddressSync(
    btc.publicKey,
    wallet.publicKey,
    false,
    BTC_TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const managerSharesAta = getAssociatedTokenAddressSync(
    mintPda,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  beforeAll(async () => {
    console.log("Custom USDC mint", usdc.publicKey.toBase58());
    console.log("Custom ETH mint", eth.publicKey.toBase58());
    console.log("Custom BTC mint", btc.publicKey.toBase58());

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
            idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
          );

          // create ATAs for each user
          for (const user of userKeypairs) {
            // send 1 SOL to each user
            await airdrop(connection, user.publicKey, 1_000_000_000);

            const userATA = await createAssociatedTokenAccount(
              connection,
              user,
              token.publicKey,
              user.publicKey,
              {},
              idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
            );
            await mintTo(
              connection,
              user,
              token.publicKey,
              userATA,
              wallet.payer,
              idx == 2 ? 10_000_000_000 : 1000_000_000,
              [],
              {},
              idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
            );
          }

          const managerAta = await createAssociatedTokenAccount(
            connection,
            wallet.payer,
            token.publicKey,
            wallet.publicKey,
            {},
            idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
          );

          await mintTo(
            connection,
            wallet.payer,
            token.publicKey,
            managerAta,
            wallet.payer,
            idx == 2 ? 1000_000_000_000 : 1000_000_000,
            [],
            { commitment }, // await 'confirmed'
            idx == 2 ? BTC_TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID,
          );
        }),
      );
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, /* timeout */ 15_000);

  it("Fund created", async () => {
    try {
      const stateData = await createGlamStateForTest(glamClient, stateModel);
      const stateAccount = await glamClient.fetchStateAccount(
        stateData.statePda,
      );
      expect(statePda).toEqual(stateData.statePda);
      expect(stateAccount.mints[0]).toEqual(mintPda);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Manager tests subscribe ETH to fund", async () => {
    // At the time of the pricing account was dumped, the SOL price is around $155,
    // so 500 SOL ~= $77k. Fund base asset is USDC, and each share has a fixed initial
    // value of $100. Manager should get $77k / $100 per share = ~770 shares
    const amount = useWsolInsteadOfEth
      ? new BN(500 * 10 ** 9) // 500 SOL ~= 10 ETH = $30k
      : new BN(10 * 10 ** 8);

    try {
      const txId = await glamClient.investor.subscribe(
        statePda,
        ethOrWsol,
        amount,
      );
      console.log(`subscribe ${useWsolInsteadOfEth ? "wsol" : "eth"}:`, txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const shares = await getMint(
      connection,
      mintPda,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    console.log("total shares:", shares.supply);
    expect(shares.supply).toBeGreaterThan(770_000_000_000);
    expect(shares.supply).toBeLessThan(773_000_000_000);

    const managerShares = await getAccount(
      connection,
      managerSharesAta,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(managerShares.amount).toEqual(shares.supply);
  }, 15_000);

  it("Invalid share class disallowed", async () => {
    try {
      const keypair = Keypair.generate();
      const invalidShareClass = await createMint(
        connection,
        wallet.payer,
        keypair.publicKey,
        null,
        6,
        keypair,
        { commitment },
        TOKEN_2022_PROGRAM_ID,
      );
      const shareAta = getAssociatedTokenAddressSync(
        invalidShareClass,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );
      const txId = await glamClient.program.methods
        .subscribe(0, new BN(1 * 10 ** 8), true)
        .accounts({
          glamState: statePda,
          glamMint: invalidShareClass,
          // glamVault: vaultPda,
          // signerShareAta: shareAta,
          asset: btc.publicKey,
          vaultAta: vaultEthAta,
          signerAssetAta: managerEthAta,
          signer: wallet.publicKey,
          // tokenProgram: TOKEN_PROGRAM_ID,
          // token2022Program: TOKEN_2022_PROGRAM_ID,
        })
        .preInstructions([
          createAssociatedTokenAccountIdempotentInstruction(
            wallet.publicKey,
            shareAta,
            wallet.publicKey,
            invalidShareClass,
            TOKEN_2022_PROGRAM_ID,
          ),
        ])
        .rpc({ commitment });
    } catch (e) {
      expect(e.message).toContain("A seeds constraint was violated");
      expect(e.message).toContain("Error Code: ConstraintSeeds");
    }
  });

  it("Manager tests subscribe BTC to fund", async () => {
    // At the time BTC price account was dumped, the BTC price is around $67k
    const amount = new BN(1 * 10 ** 8);
    try {
      const txId = await glamClient.investor.subscribe(
        statePda,
        btc.publicKey,
        amount,
      );
      console.log("subscribe btc:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const shares = await getMint(
      connection,
      mintPda,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    console.log("total shares:", shares.supply);
    // expect(shares.supply.toString()).toEqual(expectedShares); //TODO: compare BigInt?

    const managerShares = await getAccount(
      connection,
      managerSharesAta,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(managerShares.amount).toEqual(shares.supply);
  });

  it("Manager redeems 50% of fund", async () => {
    let shares = await getMint(
      connection,
      mintPda,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    const amount = new BN((shares.supply / 2n).toString());
    console.log("total shares:", shares.supply, "amount:", amount);
    try {
      const txId = await glamClient.investor.redeem(statePda, amount, true);
      console.log("redeem 50%:", txId);
    } catch (e) {
      // redeem
      console.error(e);
      throw e;
    }

    shares = await getMint(
      connection,
      mintPda,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    // expect(shares.supply.toString()).toEqual(remaining.toString());

    const managerShares = await getAccount(
      connection,
      managerSharesAta,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(managerShares.amount).toEqual(shares.supply);
  });

  it("Manager adds more tokens and redeems USDC", async () => {
    // transfer 250 USDC into the treasury (e.g. fees)
    const amountExt = 250_000_000;
    try {
      const tx1 = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          vaultUsdcAta,
          vaultPda,
          usdc.publicKey,
        ),
        createTransferCheckedInstruction(
          managerUsdcAta,
          usdc.publicKey,
          vaultUsdcAta,
          wallet.publicKey,
          amountExt,
          6,
          [],
          TOKEN_PROGRAM_ID,
        ),
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: vaultPda,
          lamports: 1_000_000_000,
        }),
      );
      await sendAndConfirmTransaction(connection, tx1, [wallet.payer], {
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
      vaultUsdcAta,
      commitment,
      TOKEN_PROGRAM_ID,
    );
    const oldAmountUsdc = treasuryUsdc.amount;
    expect(oldAmountUsdc.toString()).toEqual(amountExt.toString());

    let treasuryBtc = await getAccount(
      connection,
      vaultBtcAta,
      commitment,
      BTC_TOKEN_PROGRAM_ID,
    );
    const oldAmountBtc = treasuryBtc.amount;

    let treasuryAccountInfo = await connection.getAccountInfo(
      vaultPda,
      commitment,
    );
    const oldAmountSol = treasuryAccountInfo?.lamports;

    const amount = new BN(500_000_000);
    try {
      const txId = await glamClient.investor.redeem(statePda, amount, false);
      console.log("redeem USDC:", txId);
    } catch (e) {
      // redeem
      console.error(e);
      throw e;
    }

    treasuryUsdc = await getAccount(
      connection,
      vaultUsdcAta,
      commitment,
      TOKEN_PROGRAM_ID,
    );
    const newAmountUsdc = treasuryUsdc.amount;

    treasuryBtc = await getAccount(
      connection,
      vaultBtcAta,
      commitment,
      BTC_TOKEN_PROGRAM_ID,
    );
    const newAmountBtc = treasuryBtc.amount;

    treasuryAccountInfo = await connection.getAccountInfo(vaultPda, commitment);
    const newAmountSol = treasuryAccountInfo?.lamports;

    // new usdc amount should be less than old amount
    expect(oldAmountUsdc).toBeGreaterThan(newAmountUsdc);
    // no change in btc amount
    expect(oldAmountBtc).toEqual(newAmountBtc);
    // no change in sol amount
    expect(oldAmountSol).toEqual(newAmountSol);
  });

  it("Manager redeems 100% of fund", async () => {
    let shares = await getMint(
      connection,
      mintPda,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    const amount = new BN(shares.supply.toString());
    try {
      const txId = await glamClient.investor.redeem(statePda, amount, true);
      console.log("redeem 100%:", txId);
    } catch (e) {
      // redeem
      console.error(e);
      throw e;
    }

    shares = await getMint(
      connection,
      mintPda,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(shares.supply.toString()).toEqual("0");

    const managerShares = await getAccount(
      connection,
      managerSharesAta,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    expect(managerShares.amount).toEqual(shares.supply); // 0

    const treasuryUsdc = await getAccount(
      connection,
      vaultUsdcAta,
      commitment,
      TOKEN_PROGRAM_ID,
    );
    expect(treasuryUsdc.amount).toEqual(shares.supply); // 0

    const treasuryEth = await getAccount(
      connection,
      vaultEthAta,
      commitment,
      TOKEN_PROGRAM_ID,
    );
    expect(treasuryEth.amount).toEqual(shares.supply); // 0

    const treasuryBtc = await getAccount(
      connection,
      vaultBtcAta,
      commitment,
      BTC_TOKEN_PROGRAM_ID,
    );
    expect(treasuryBtc.amount).toEqual(shares.supply); // 0

    // All lamports are sent to signer => treasury account no longer exists
    const treasuryAccountInfo = await connection.getAccountInfo(
      vaultPda,
      commitment,
    );
    expect(treasuryAccountInfo).toBeNull();
  });

  it("Alice subscribes to fund with 250 USDC", async () => {
    const amount = new BN(250 * 10 ** 6); // USDC has 6 decimals
    try {
      const txId = await glamClientAlice.investor.subscribe(
        statePda,
        usdc.publicKey,
        amount,
      );
      console.log("tx:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const shares = await getMint(
      connection,
      mintPda,
      commitment,
      TOKEN_2022_PROGRAM_ID,
    );
    // $250 for $100 per share => 2.5 shares
    // in reality it will be less due to fees but toFixed(2) rounds it up
    expect((Number(shares.supply) / 1e9).toFixed(2)).toEqual("2.50");
  });

  it("Bob is not allowed to subscribe", async () => {
    const amount = new BN(250 * 10 ** 6); // USDC has 6 decimals
    try {
      const txId = await glamClientBob.investor.subscribe(
        statePda,
        usdc.publicKey,
        amount,
      );
      console.log("tx:", txId);
      expect(txId).toBeUndefined();
    } catch (err) {
      expect(err.message).toContain("Share class not allowed to subscribe");
    }
  });

  it("Eve is not allowed to subscribe", async () => {
    const amount = new BN(250 * 10 ** 6); // USDC has 6 decimals
    try {
      const txId = await glamClientEve.investor.subscribe(
        statePda,
        usdc.publicKey,
        amount,
      );
      console.log("tx:", txId);
      expect(txId).toBeUndefined();
    } catch (err) {
      expect(err.message).toContain("Share class not allowed to subscribe");
    }
  });

  it("Manager subscribes/redeems when marinade ticket exists", async () => {
    try {
      const airdropTx = await connection.requestAirdrop(vaultPda, 10 ** 9);
      await connection.confirmTransaction({
        ...(await connection.getLatestBlockhash()),
        signature: airdropTx,
      });
      const txDeposit = await glamClient.marinade.depositSol(
        statePda,
        new anchor.BN(10 ** 9),
      );
      console.log("marinade deposit:", txDeposit);
      const txUnstake = await glamClient.marinade.delayedUnstake(
        statePda,
        new anchor.BN(10 ** 8),
      );
      console.log("marinade delayed unstake:", txUnstake);
    } catch (e) {
      console.error(e);
      throw e;
    }

    const stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.externalVaultAccounts?.length).toEqual(1);

    try {
      const txId = await glamClient.investor.subscribe(
        statePda,
        btc.publicKey,
        new BN(10 ** 8), // 1 BTC
      );
      console.log("subscribe:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    try {
      const txId = await glamClient.investor.redeem(
        statePda,
        new BN(10 ** 9), // 1 share
      );
      console.log("redeem 1 share:", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, 15_000);
});
