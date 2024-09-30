import * as anchor from "@coral-xyz/anchor";
import { GlamClient, GlamProgram, WSOL } from "../src";
import { createFundForTest } from "./setup";
import {
  DRIFT_PROGRAM_ID,
  getDriftStateAccountPublicKey,
  getOrderParams,
  getUserAccountPublicKey,
  getUserStatsAccountPublicKey,
  MarketType,
  OrderType,
  PositionDirection,
  PublicKey,
} from "@drift-labs/sdk";

describe("glam_drift", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const glamClient = new GlamClient();
  const manager = glamClient.getManager();

  const program = anchor.workspace.Glam as GlamProgram;
  const commitment = "confirmed";

  const remainingAccountsForDeposit = [
    {
      pubkey: new PublicKey("BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF"),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: new PublicKey("HpMoKp3TCd3QT4MWYUKk2zCBwmhr5Df45fB6wdxYqEeh"),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: new PublicKey("GyyHYVCrZGc2AQPuvNbcP1babmU3L42ptmxZthUfD9q"),
      isSigner: false,
      isWritable: true,
    },
  ];
  const remainingAccountsForOrders = [
    {
      pubkey: new PublicKey("HpMoKp3TCd3QT4MWYUKk2zCBwmhr5Df45fB6wdxYqEeh"),
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: new PublicKey("BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF"),
      isWritable: false,
      isSigner: false,
    },

    {
      pubkey: new PublicKey("En8hkHLkRe9d9DraYmBTrus518BvmVH448YcvmrFM6Ce"),
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: new PublicKey("GyyHYVCrZGc2AQPuvNbcP1babmU3L42ptmxZthUfD9q"),
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"),
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"),
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: new PublicKey("8UJgxaiQx5nTrdDgph5FiahMmzduuLTLf5WmsPegYA6W"),
      isWritable: true,
      isSigner: false,
    },
  ];

  let fundPDA, treasuryPDA, sharePDA;
  let driftUser, driftUserStats, driftState;

  it("Create and initialize fund", async () => {
    const fundData = await createFundForTest();
    fundPDA = fundData.fundPDA;
    treasuryPDA = fundData.treasuryPDA;
    sharePDA = fundData.sharePDA;

    const fund = await program.account.fundAccount.fetch(fundPDA);
    expect(fund.shareClasses.length).toEqual(1);
    expect(fund.name).toEqual("Glam Fund SOL-mSOL");
  });

  it("Drift initialize", async () => {
    try {
      const txId = await glamClient.drift.initialize(fundPDA);
      console.log("driftInitialize", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    driftUser = await getUserAccountPublicKey(
      new PublicKey(DRIFT_PROGRAM_ID),
      treasuryPDA,
      0
    );
    driftUserStats = await getUserStatsAccountPublicKey(
      new PublicKey(DRIFT_PROGRAM_ID),
      treasuryPDA
    );
    driftState = await getDriftStateAccountPublicKey(
      new PublicKey(DRIFT_PROGRAM_ID)
    );
  });

  it("Drift: update trader", async () => {
    const trader = manager;
    try {
      const txId = await glamClient.drift.updateUserDelegate(
        fundPDA,
        0,
        trader
      );
      console.log("driftUpdateUserDelegate", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Airdrop 10 SOL to treasury and wrap it", async () => {
    const connection = glamClient.provider.connection;
    const lamports = 10_000_000_000;
    const airdropTx = await connection.requestAirdrop(treasuryPDA, lamports);
    await connection.confirmTransaction(
      {
        ...(await connection.getLatestBlockhash()),
        signature: airdropTx,
      },
      commitment
    );

    try {
      const txSig = await glamClient.wsol.wrap(
        fundPDA,
        new anchor.BN(lamports)
      );
      console.log("Wrappped 10 SOL in treasury:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Drift: deposit 10 SOL to trading account", async () => {
    const treasuryAta = glamClient.getTreasuryAta(fundPDA, WSOL);
    console.log("treasuryAta wSOL:", treasuryAta.toBase58());

    const amount = new anchor.BN(1_000_000_000);
    const spotMarketVaultSol = new PublicKey(
      "DfYCNezifxAEsQbAJ1b3j6PX3JVBe8fu11KBhxsbw5d2"
    );

    try {
      // SOL spot market index is 1
      const txId = await program.methods
        .driftDeposit(0, 1, amount) // subaccount_id: 0, market_index: 1
        .accounts({
          fund: fundPDA,
          treasuryAta,
          driftAta: spotMarketVaultSol,
          userStats: driftUserStats,
          user: driftUser,
          state: driftState,
          manager,
        })
        .remainingAccounts(remainingAccountsForDeposit)
        .rpc({ commitment });

      console.log("driftDeposit", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Drift: place perp order", async () => {
    const orderParams = getOrderParams({
      orderType: OrderType.LIMIT,
      marketType: MarketType.PERP,
      direction: PositionDirection.LONG,
      marketIndex: 0,
      baseAssetAmount: new anchor.BN(10_0000_000),
      price: new anchor.BN(100_000_000), // set a very low limit price
    });

    try {
      const txId = await program.methods
        .driftPlaceOrders([orderParams])
        .accounts({
          fund: fundPDA,
          user: driftUser,
          state: driftState,
          manager,
        })
        .remainingAccounts(remainingAccountsForOrders)
        .rpc({ commitment });

      console.log("driftPlaceOrders", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Drift: cancel orders", async () => {
    try {
      // SOL perp market index is 0
      const txId = await program.methods
        .driftCancelOrders(MarketType.PERP, 0, PositionDirection.LONG)
        .accounts({
          fund: fundPDA,
          user: driftUser,
          state: driftState,
          manager,
        })
        .remainingAccounts(remainingAccountsForOrders)
        .rpc({ commitment });

      console.log("driftCancelOrders", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
