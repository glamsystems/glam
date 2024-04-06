/*
  TESTS to interact with devnet

  Change Anchor.toml:
  
  1.
  #cluster = "localnet"
  cluster = "devnet"

  2.
  #test = ...
  test = "../node_modules/.bin/nx run anchor:jest --verbose --testNamePattern devnet"

  Then run tests with:
  
  anchor test --skip-deploy --skip-build

*/
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  ComputeBudgetProgram,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
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
import {
  DriftClient,
  getDriftStateAccountPublicKey,
  getUserAccountPublicKey,
  getUserStatsAccountPublicKey,
  getDriftSignerPublicKey,
} from "@drift-labs/sdk";
import { Glam } from "../target/types/glam";

describe("glam_devnet", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  const manager = provider.wallet as anchor.Wallet;
  // console.log("Manager:", manager.publicKey);

  const program = anchor.workspace.Glam as Program<Glam>;
  const commitment = "confirmed";

  const usdc = new PublicKey("8zGuJQqwhZafTah7Uc7Z4tXRnguqkn5KLFAP8oV6PHe2"); // 6 decimals
  const wsol = new PublicKey("So11111111111111111111111111111111111111112");  // 9 decimals
  const wbtc = new PublicKey("3BZPwbcqB5kKScF3TEXxwNfx5ipV13kbRVDvfVp5c6fv"); // 6 decimals
  const BTC_TOKEN_PROGRAM_ID = TOKEN_PROGRAM_ID;

  const DRIFT_PROGRAM_ID = new PublicKey(
    "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH"
  );

  const fundName = "Glam Investment Fund BTC-SOL";
  const fundSymbol = "GBS";
  let shareClassMetadata = {
    name: fundName,
    symbol: fundSymbol,
    shareClassAsset: "USDC",
    shareClassAssetId: usdc,
    isin: "XS1082172823",
    status: "open",
    feeManagement: 15000, // 10_000 * 0.015,
    feePerformance: 100000, // 10_000 * 0.1,
    policyDistribution: "accumulating",
    extension: "",
    launchDate: "2024-04-01",
    lifecycle: "active",
  };

  const [fundPDA, fundBump] = PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode("fund"),
      manager.publicKey.toBuffer(),
      anchor.utils.bytes.utf8.encode(fundName)
    ],
    program.programId
  );
  const fundUri = `https://devnet.glam.systems/#/products/${fundPDA.toBase58()}`;

  const [treasuryPDA, treasuryBump] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("treasury"), fundPDA.toBuffer()],
    program.programId
  );

  const [sharePDA, shareBump] = PublicKey.findProgramAddressSync(
    [anchor.utils.bytes.utf8.encode("share-0"), fundPDA.toBuffer()],
    program.programId
  );
  shareClassMetadata.uri = `https://api.glam.systems/metadata/${sharePDA.toBase58()}`;
  shareClassMetadata.imageUri = `https://api.glam.systems/image/${sharePDA.toBase58()}.png`;

  // treasury
  const treasuryUsdcAta = getAssociatedTokenAddressSync(
    usdc,
    treasuryPDA,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const treasurySolAta = getAssociatedTokenAddressSync(
    wsol,
    treasuryPDA,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const treasuryBtcAta = getAssociatedTokenAddressSync(
    wbtc,
    treasuryPDA,
    true,
    BTC_TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // manager
  const managerUsdcAta = getAssociatedTokenAddressSync(
    usdc,
    manager.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const managerSolAta = getAssociatedTokenAddressSync(
    wsol,
    manager.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const managerBtcAta = getAssociatedTokenAddressSync(
    wbtc,
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

  const pricingUsdc = new PublicKey("5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7");
  const pricingSol =  new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");
  const pricingBtc =  new PublicKey("HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J");

  let remainingAccountsSubscribe = [
    // { pubkey: usdc, isSigner: false, isWritable: false },
    // { pubkey: managerUsdcAta, isSigner: false, isWritable: true },
    { pubkey: treasuryUsdcAta, isSigner: false, isWritable: true },
    { pubkey: pricingUsdc, isSigner: false, isWritable: false },
    // { pubkey: wsol, isSigner: false, isWritable: false },
    // { pubkey: managerSolAta, isSigner: false, isWritable: true },
    { pubkey: treasurySolAta, isSigner: false, isWritable: true },
    { pubkey: pricingSol, isSigner: false, isWritable: false },
    // { pubkey: wbtc, isSigner: false, isWritable: false },
    // { pubkey: managerBtcAta, isSigner: false, isWritable: true },
    { pubkey: treasuryBtcAta, isSigner: false, isWritable: true },
    { pubkey: pricingBtc, isSigner: false, isWritable: false },
  ];

  let remainingAccountsRedeem = [
    { pubkey: usdc, isSigner: false, isWritable: false },
    { pubkey: managerUsdcAta, isSigner: false, isWritable: true },
    { pubkey: treasuryUsdcAta, isSigner: false, isWritable: true },
    { pubkey: pricingUsdc, isSigner: false, isWritable: false },
    { pubkey: wsol, isSigner: false, isWritable: false },
    { pubkey: managerSolAta, isSigner: false, isWritable: true },
    { pubkey: treasurySolAta, isSigner: false, isWritable: true },
    { pubkey: pricingSol, isSigner: false, isWritable: false },
    { pubkey: wbtc, isSigner: false, isWritable: false },
    { pubkey: managerBtcAta, isSigner: false, isWritable: true },
    { pubkey: treasuryBtcAta, isSigner: false, isWritable: true },
    { pubkey: pricingBtc, isSigner: false, isWritable: false },
  ];

  beforeAll(async () => {}, 15_000);

  // Subscribe to the fund
  it("Manager tests subscribe USDC to fund", async () => {
    console.log("managerUsdcAta", managerUsdcAta);
    // const amount = new BN(200 * 10 ** 6); // 200 USDC
    const amount = new BN(1 * 10 ** 5); // 0.1 BTC
    // const expectedShares = "20"; // $10/share => 20 shares
    try {
      await program.methods
        .subscribe(amount, true)
        .accounts({
          fund: fundPDA,
          shareClass: sharePDA,
          signerShareAta: managerSharesAta,
          asset: wbtc,
          treasuryAta: treasuryBtcAta,
          signerAssetAta: managerBtcAta,
          signer: manager.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID
        })
        .remainingAccounts(remainingAccountsSubscribe)
        .rpc({ commitment });
    } catch (e) {
      // subscribe
      console.error(e);
      throw e;
    }

    const shares = await getMint(
      connection,
      sharePDA,
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    // expect(shares.supply.toString()).toEqual(expectedShares); //TODO: compare BigInt?

    const managerShares = await getAccount(
      connection,
      managerSharesAta,
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    // expect(managerShares.amount).toEqual(shares.supply);
  });

  /*
  it("Manager redeems 100% of fund", async () => {
    // note: this only works if the manager owns all the shares
    let shares = await getMint(
      connection,
      sharePDA,
      commitment,
      TOKEN_2022_PROGRAM_ID
    );
    const amount = new BN(shares.supply);
    // const amount = new BN(10_000_000_000); // 10 shares
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
      treasurySolAta,
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
  */

  /*
  it("Update trader", async () => {
    const userAccountPublicKey = await getUserAccountPublicKey(
      DRIFT_PROGRAM_ID,
      treasuryPDA,
      0
    );
    // const trader = new PublicKey("aLice3kGNMajHriHX8R1e1LmqAzojuidxSiU9JT6hVo")
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
        .rpc({commitment}); // await 'confirmed'

      await connection.getParsedTransaction(txId, {commitment});
      console.log("driftInitialize", txId);
    } catch(e) {
      console.error(e);
      throw e;
    }
  }, 10_000);
  */

  /*
  it('Deposit 100 USDC in Drift trading account', async () => {
    const userAccountPublicKey = await getUserAccountPublicKey(
      DRIFT_PROGRAM_ID,
      treasuryPDA,
      0
    );
    const userStatsAccountPublicKey = await getUserStatsAccountPublicKey(
      DRIFT_PROGRAM_ID,
      treasuryPDA
    );
    const statePublicKey = await getDriftStateAccountPublicKey(
      DRIFT_PROGRAM_ID,
    );

    const driftClient = new DriftClient({
      connection,
      wallet: manager,
      env: 'devnet',
    });
    
    await driftClient.subscribe();

    const marketIndex = 0; // USDC
    // const amount = driftClient.convertToSpotPrecision(marketIndex, 100); // $100
    // expect(amount).toEqual(new BN( 100_000_000 ));
    // const associatedTokenAccount = await driftClient.getAssociatedTokenAccount(marketIndex);    
    // expect(associatedTokenAccount).toEqual(managerUsdcAta);
    // const spotMarketAccount = await driftClient.getSpotMarketAccount(marketIndex);
    // console.log("spotMarketAccount", spotMarketAccount);
    const amount = new BN( 100_000_000 );
    const spotMarketAccountUsdc = new PublicKey("GXWqPpjQpdz7KZw9p7f5PX2eGxHAhvpNXiviFkAB8zXg");

    const driftSpotSol =  new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh");
    const driftSpotUsdc = new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3");
  
    let remainingAccountsDeposit = [
      { pubkey: pricingSol, isSigner: false, isWritable: false },
      { pubkey: pricingUsdc, isSigner: false, isWritable: false },
      { pubkey: driftSpotSol, isSigner: false, isWritable: true },
      { pubkey: driftSpotUsdc, isSigner: false, isWritable: true },
    ];
  
    // let remainingAccountsWithdraw = [
    //   { pubkey: pricingUsdc, isSigner: false, isWritable: false },
    //   { pubkey: pricingSol, isSigner: false, isWritable: false },
    //   { pubkey: driftSpotUsdc, isSigner: false, isWritable: false },
    //   { pubkey: driftSpotSol, isSigner: false, isWritable: false },
    // ];
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
          driftProgram: DRIFT_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccountsDeposit)
        .rpc({commitment}); // await 'confirmed'

      await connection.getParsedTransaction(txId, {commitment});
      console.log("driftDeposit", txId);
    } catch(e) {
      console.error(e);
      throw e;
    }
  }, 30_000);
  */

  /*
  it('Withdraw 50 USDC in Drift trading account', async () => {
    const userAccountPublicKey = await getUserAccountPublicKey(
      DRIFT_PROGRAM_ID,
      treasuryPDA,
      0
    );
    const userStatsAccountPublicKey = await getUserStatsAccountPublicKey(
      DRIFT_PROGRAM_ID,
      treasuryPDA
    );
    const statePublicKey = await getDriftStateAccountPublicKey(
      DRIFT_PROGRAM_ID,
    );
    const signerPublicKey = await getDriftSignerPublicKey(
      DRIFT_PROGRAM_ID,
    );

    const driftClient = new DriftClient({
      connection,
      wallet: manager,
      env: 'devnet',
    });
    
    await driftClient.subscribe();

    const marketIndex = 0; // USDC
    const amount = new BN( 50_000_000 );
    const spotMarketAccountUsdc = new PublicKey("GXWqPpjQpdz7KZw9p7f5PX2eGxHAhvpNXiviFkAB8zXg");

    const driftSpotSol =  new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh");
    const driftSpotUsdc = new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3");
  
    let remainingAccountsWithdraw = [
      { pubkey: pricingUsdc, isSigner: false, isWritable: false },
      { pubkey: pricingSol, isSigner: false, isWritable: false },
      { pubkey: driftSpotUsdc, isSigner: false, isWritable: true },
      { pubkey: driftSpotSol, isSigner: false, isWritable: true },
    ];
    try {
      const txId = await program.methods
        .driftWithdraw(amount)
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          treasuryAta: treasuryUsdcAta,
          driftAta: spotMarketAccountUsdc,
          userStats: userStatsAccountPublicKey,
          user: userAccountPublicKey,
          state: statePublicKey,
          manager: manager.publicKey,
          driftSigner: signerPublicKey,
          driftProgram: DRIFT_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts(remainingAccountsWithdraw)
        .rpc({commitment}); // await 'confirmed'

      await connection.getParsedTransaction(txId, {commitment});
      console.log("driftWithdraw", txId);
    } catch(e) {
      console.error(e);
      throw e;
    }
  }, 30_000);
  */






  /*
      TESTS TO CREATE - do NOT rerun
  */


/*
  // This is the test used to initialize the 1st devnet fund, do NOT rerun
  it("Initialize fund", async () => {
    try {
      const txId = await program.methods
        .initialize(
          fundName,
          fundSymbol,
          fundUri,
          [0, 60, 40],
          true,
          shareClassMetadata
        )
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          share: sharePDA,
          manager: manager.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID
        })
        .remainingAccounts([
          { pubkey: usdc, isSigner: false, isWritable: false },
          { pubkey: wsol, isSigner: false, isWritable: false },
          { pubkey: wbtc, isSigner: false, isWritable: false }
        ])
        .preInstructions([
          ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
        ])
        .rpc({ commitment }); // await 'confirmed'
    } catch (e) {
      // beforeAll
      console.error(e);
      throw e;
    }

    const fund = await program.account.fund.fetch(fundPDA);
    expect(fund.shareClassesLen).toEqual(1);
    expect(fund.assetsLen).toEqual(3);
    expect(fund.name).toEqual(fundName);
    expect(fund.symbol).toEqual(fundSymbol);
    expect(fund.isActive).toEqual(true);
  });
*/

  /*
  it("Update fund", async () => {
    const newFundSymbol = "FF0";
    await program.methods
      .update(null, newFundSymbol, null, true)
      .accounts({
        fund: fundPDA,
        manager: manager.publicKey
      })
      .rpc({ commitment });
    const fund = await program.account.fund.fetch(fundPDA);
    expect(fund.symbol).toEqual(newFundSymbol);
    expect(fund.isActive).toEqual(true);
  });
  */
  /*
  // This is the test used to create ATAs, do NOT rerun
  it("Create ATAs", async () => {
    //TODO: remove creation of ATA
    // currently we need to manually create the ATAs
    try {
      const tx1 = new Transaction().add(
        // Treasury
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          treasuryUsdcAta,
          treasuryPDA,
          usdc,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          treasurySolAta,
          treasuryPDA,
          wsol,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          treasuryBtcAta,
          treasuryPDA,
          wbtc,
          BTC_TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
        // Shares
        createAssociatedTokenAccountInstruction(
          manager.publicKey,
          managerSharesAta,
          manager.publicKey,
          sharePDA,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        ),
      );
      await sendAndConfirmTransaction(connection, tx1, [manager.payer], {
        skipPreflight: true,
        commitment
      });
    } catch (e) {
      // create ATAs
      console.error(e);
      throw e;
    }
  });
  */

  /*
  // This is the test used to create the Drift account, do NOT rerun
  it('Create Drift trading account', async () => {
    const userAccountPublicKey = await getUserAccountPublicKey(
      DRIFT_PROGRAM_ID,
      treasuryPDA,
      0
    );
    const userStatsAccountPublicKey = await getUserStatsAccountPublicKey(
      DRIFT_PROGRAM_ID,
      treasuryPDA
    );
    const statePublicKey = await getDriftStateAccountPublicKey(
      DRIFT_PROGRAM_ID,
    );
    // console.log("userAccountPublicKey", userAccountPublicKey);
    // console.log("userStatsAccountPublicKey", userStatsAccountPublicKey);
    // console.log("statePublicKey", statePublicKey);
    // console.log("fundPDA", fundPDA);
    // console.log("treasuryPDA", treasuryPDA);

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
          driftProgram: DRIFT_PROGRAM_ID,
        })
        .rpc({commitment}); // await 'confirmed'

      await connection.getParsedTransaction(txId, {commitment});
      console.log("driftInitialize", txId);
    } catch(e) {
      console.error(e);
      throw e;
    }
  }, 10_000);
  */

  /*
  it('Close Drift trading account', async () => {
    const userAccountPublicKey = await getUserAccountPublicKey(
      DRIFT_PROGRAM_ID,
      treasuryPDA,
      0
    );
    const userStatsAccountPublicKey = await getUserStatsAccountPublicKey(
      DRIFT_PROGRAM_ID,
      treasuryPDA
    );
    const statePublicKey = await getDriftStateAccountPublicKey(
      DRIFT_PROGRAM_ID,
    );
    try {
      const txId = await program.methods
        .driftClose()
        .accounts({
          fund: fundPDA,
          treasury: treasuryPDA,
          userStats: userStatsAccountPublicKey,
          user: userAccountPublicKey,
          state: statePublicKey,
          manager: manager.publicKey,
          driftProgram: DRIFT_PROGRAM_ID,
        })
        .rpc({commitment}); // await 'confirmed'

      await connection.getParsedTransaction(txId, {commitment});
      console.log("driftClose", txId);
    } catch(e) {
      console.error(e);
      throw e;
    }
  }, 10_000);
  */

  /*
  it("Close fund", async () => {
    await program.methods
      .close()
      .accounts({
        fund: '2exrMpmVboCb57t94KHZWKEv7nrcoa5rQSawE19atsrt',
        manager: manager.publicKey
      })
      .rpc();

    // The account should no longer exist, returning null.
    const closedAccount = await program.account.fund.fetchNullable(fundPDA);
    expect(closedAccount).toBeNull();
  });
  */
});
