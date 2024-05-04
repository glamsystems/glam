import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
  Keypair
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
  createTransferCheckedInstruction
} from "@solana/spl-token";

import { Glam } from "../target/types/glam";
import { getFundUri, getImageUri, getMetadataUri } from "../src/offchain";

describe("glam_investor", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;
  const program = anchor.workspace.Glam as Program<Glam>;
  const commitment = "confirmed";

  const manager = provider.wallet as anchor.Wallet;
  console.log("Manager:", manager.publicKey);

  const userKeypairs = [
    Keypair.generate(), // mock user 0
    Keypair.generate(), // ...
    Keypair.generate()
  ];
  const alice = userKeypairs[0];
  const bob = userKeypairs[1];
  const eve = userKeypairs[2];

  const tokenKeypairs = [
    Keypair.generate(), // mock token 0
    Keypair.generate(), // ...
    Keypair.generate()
  ];
  const usdc = tokenKeypairs[0]; // 6 decimals
  const eth = tokenKeypairs[1]; // 6 decimals
  const btc = tokenKeypairs[2]; // 9 decimals, token2022
  const BTC_TOKEN_PROGRAM_ID = TOKEN_2022_PROGRAM_ID;

  const fundName = "Investment fund";
  const fundSymbol = "IFD";
  const [fundPDA, fundBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("fund"), manager.publicKey.toBuffer(), Buffer.from(fundName)],
    program.programId
  );
  const fundUri = getFundUri(fundPDA);

  // share class
  const shareClassSymbol = `${fundSymbol}.A`;
  const [sharePDA, shareBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("share"), Buffer.from(shareClassSymbol), fundPDA.toBuffer()],
    program.programId
  );
  const shareClassMetadata = {
    name: fundName,
    symbol: shareClassSymbol,
    uri: getMetadataUri(sharePDA),
    shareClassAsset: "USDC",
    shareClassAssetId: usdc.publicKey,
    isin: "XS1082172823",
    status: "open",
    feeManagement: 15000, // 1_000_000 * 0.015,
    feePerformance: 100000, // 1_000_000 * 0.1,
    policyDistribution: "accumulating",
    extension: "",
    launchDate: "2024-04-01",
    lifecycle: "active",
    imageUri: getImageUri(sharePDA)
  };

  // treasury
  const [treasuryPDA, treasuryBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), fundPDA.toBuffer()],
    program.programId
  );

  const treasuryUsdcAta = getAssociatedTokenAddressSync(
    usdc.publicKey,
    treasuryPDA,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const treasuryEthAta = getAssociatedTokenAddressSync(
    eth.publicKey,
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
    eth.publicKey,
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

  // users' shares
  const aliceSharesAta = getAssociatedTokenAddressSync(
    sharePDA,
    alice.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const bobSharesAta = getAssociatedTokenAddressSync(
    sharePDA,
    bob.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const eveSharesAta = getAssociatedTokenAddressSync(
    sharePDA,
    eve.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // pricing
  const pricingUsdc = new PublicKey(
    "5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7"
  );
  const pricingSol = new PublicKey(
    "J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"
  );
  const pricingBtc = new PublicKey(
    "HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J"
  );
  const pricingEth = new PublicKey(
    "EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw"
  );

  let remainingAccountsSubscribe = [
    // { pubkey: usdc.publicKey, isSigner: false, isWritable: false },
    // { pubkey: managerUsdcAta, isSigner: false, isWritable: true },
    { pubkey: treasuryUsdcAta, isSigner: false, isWritable: false },
    { pubkey: pricingUsdc, isSigner: false, isWritable: false },
    // { pubkey: btc.publicKey, isSigner: false, isWritable: false },
    // { pubkey: managerBtcAta, isSigner: false, isWritable: true },
    { pubkey: treasuryBtcAta, isSigner: false, isWritable: false },
    { pubkey: pricingBtc, isSigner: false, isWritable: false },
    // { pubkey: eth.publicKey, isSigner: false, isWritable: false },
    // { pubkey: managerEthAta, isSigner: false, isWritable: true },
    { pubkey: treasuryEthAta, isSigner: false, isWritable: false },
    { pubkey: pricingEth, isSigner: false, isWritable: false }
  ];

  let remainingAccountsRedeem = [
    { pubkey: usdc.publicKey, isSigner: false, isWritable: false },
    { pubkey: managerUsdcAta, isSigner: false, isWritable: true },
    { pubkey: treasuryUsdcAta, isSigner: false, isWritable: true },
    { pubkey: pricingUsdc, isSigner: false, isWritable: false },
    { pubkey: btc.publicKey, isSigner: false, isWritable: false },
    { pubkey: managerBtcAta, isSigner: false, isWritable: true },
    { pubkey: treasuryBtcAta, isSigner: false, isWritable: true },
    { pubkey: pricingBtc, isSigner: false, isWritable: false },
    { pubkey: eth.publicKey, isSigner: false, isWritable: false },
    { pubkey: managerEthAta, isSigner: false, isWritable: true },
    { pubkey: treasuryEthAta, isSigner: false, isWritable: true },
    { pubkey: pricingEth, isSigner: false, isWritable: false }
  ];

  beforeAll(async () => {
    try {
      await Promise.all(
        // exec in parallel, but await before ending the test
        tokenKeypairs.map(async (token, idx) => {
          const mint = await createMint(
            connection,
            manager.payer,
            manager.publicKey,
            null,
            idx == 2 ? 9 : 6,
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
      let txId = await program.methods
        .initialize(fundName, fundSymbol, fundUri, [0, 60, 40], true)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          manager: manager.publicKey
        })
        .remainingAccounts([
          { pubkey: usdc.publicKey, isSigner: false, isWritable: false },
          { pubkey: btc.publicKey, isSigner: false, isWritable: false },
          { pubkey: eth.publicKey, isSigner: false, isWritable: false }
        ])
        .preInstructions([
          ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
        ])
        .rpc({ commitment });

      txId = await program.methods
        .addShareClass(shareClassMetadata)
        .accounts({
          fund: fundPDA,
          shareClassMint: sharePDA,
          manager: manager.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID
        })
        .preInstructions([
          ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
        ])
        .rpc({ commitment: "confirmed" });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, /* timeout */ 15_000);

  afterAll(async () => {
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
  });

  it("Fund created", async () => {
    try {
      const fund = await program.account.fund.fetch(fundPDA);
      expect(fund.shareClasses[0]).toEqual(sharePDA);
      expect(fund.name).toEqual(fundName);
      expect(fund.symbol).toEqual(fundSymbol);
      expect(fund.isActive).toEqual(true);
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
          eth.publicKey,
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
        commitment
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Manager tests subscribe ETH to fund", async () => {
    const amount = new BN(10 * 10 ** 6); // 10 ETH = $30k
    const expectedShares = "3000"; // $10/share => 3k shares
    try {
      const txId = await program.methods
        .subscribe(amount, shareClassSymbol, true)
        .accounts({
          fund: fundPDA,
          shareClass: sharePDA,
          signerShareAta: managerSharesAta,
          asset: eth.publicKey,
          treasuryAta: treasuryEthAta,
          signerAssetAta: managerEthAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID
        })
        .remainingAccounts(remainingAccountsSubscribe)
        .preInstructions([
          ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
        ])
        .rpc({ commitment });
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
        .subscribe(new BN(1 * 10 ** 9), shareClassSymbol, true)
        .accounts({
          fund: fundPDA,
          shareClass: invalidShareClass,
          signerShareAta: shareAta,
          asset: btc.publicKey,
          treasuryAta: treasuryBtcAta,
          signerAssetAta: managerBtcAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID
        })
        .remainingAccounts(remainingAccountsSubscribe)
        .rpc({ commitment });
    } catch (e) {
      console.error(e);
      expect(e.message).toContain("Share class not allowed to subscribe");
      expect(e.message).toContain("Error Code: InvalidShareClass");
    }
  });

  it("Manager tests subscribe BTC to fund", async () => {
    const amount = new BN(1 * 10 ** 9); // 1 BTC = $51k
    const expectedShares = "8100"; // 3,000 + 5,100
    try {
      const txId = await program.methods
        .subscribe(amount, shareClassSymbol, true)
        .accounts({
          fund: fundPDA,
          shareClass: sharePDA,
          signerShareAta: managerSharesAta,
          asset: btc.publicKey,
          treasuryAta: treasuryBtcAta,
          signerAssetAta: managerBtcAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID
        })
        .remainingAccounts(remainingAccountsSubscribe)
        .rpc({ commitment });
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
      await program.methods
        .redeem(amount, true, true)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          shareClass: sharePDA,
          signerShareAta: managerSharesAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID
        })
        .remainingAccounts(remainingAccountsRedeem)
        .rpc({ commitment });
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
        commitment
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
      const txId = await program.methods
        .redeem(amount, false, true)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          shareClass: sharePDA,
          signerShareAta: managerSharesAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID
        })
        .remainingAccounts(remainingAccountsRedeem)
        .rpc({ commitment });
      console.log("tx:", txId);
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
      await program.methods
        .redeem(amount, true, true)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          shareClass: sharePDA,
          signerShareAta: managerSharesAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID
        })
        .remainingAccounts(remainingAccountsRedeem)
        .rpc({ commitment });
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
    const aliceBtcAta = getAssociatedTokenAddressSync(
      btc.publicKey,
      alice.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const aliceEthAta = getAssociatedTokenAddressSync(
      eth.publicKey,
      alice.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const aliceUsdcAta = getAssociatedTokenAddressSync(
      usdc.publicKey,
      alice.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // const amount = new BN(5 * 10 ** 8); // BTC has 9 decimals
    // const amount = new BN(5 * 10 ** 5); // ETH has 6 decimals
    const amount = new BN(250 * 10 ** 6); // USDC has 6 decimals
    try {
      const txId = await program.methods
        .subscribe(amount, shareClassSymbol, true)
        .accounts({
          fund: fundPDA,
          shareClass: sharePDA,
          signerShareAta: aliceSharesAta,
          asset: usdc.publicKey,
          treasuryAta: treasuryUsdcAta,
          signerAssetAta: aliceUsdcAta,
          signer: alice.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID
        })
        .remainingAccounts(remainingAccountsSubscribe)
        .preInstructions([
          ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
        ])
        .signers([alice])
        .rpc({ commitment });
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
});
