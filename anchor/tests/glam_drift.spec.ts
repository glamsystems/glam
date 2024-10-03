import * as anchor from "@coral-xyz/anchor";
import { GlamClient, GlamProgram } from "../src";
import { createFundForTest } from "./setup";
import {
  getOrderParams,
  MarketType,
  OrderType,
  PositionDirection,
} from "@drift-labs/sdk";

describe("glam_drift", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const glamClient = new GlamClient();
  const manager = glamClient.getManager();

  const program = anchor.workspace.Glam as GlamProgram;
  const commitment = "confirmed";

  let fundPDA, treasuryPDA, sharePDA;

  it("Create and initialize fund", async () => {
    const fundData = await createFundForTest();
    fundPDA = fundData.fundPDA;
    treasuryPDA = fundData.treasuryPDA;
    sharePDA = fundData.sharePDA;

    const fund = await program.account.fundAccount.fetch(fundPDA);
    expect(fund.shareClasses.length).toEqual(1);
    expect(fund.name).toEqual("Glam Fund SOL-mSOL");
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

  it("Drift initialize", async () => {
    try {
      const txId = await glamClient.drift.initialize(fundPDA);
      console.log("driftInitialize", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Drift: update trader", async () => {
    const trader = manager;
    try {
      const txId = await glamClient.drift.updateUserDelegate(fundPDA, trader);
      console.log("driftUpdateUserDelegate", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Drift: deposit 10 SOL to trading account", async () => {
    const amount = new anchor.BN(10_000_000_000);

    try {
      const txId = await glamClient.drift.deposit(fundPDA, amount);

      console.log("driftDeposit", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Drift: withdraw 1 SOL to trading account", async () => {
    const amount = new anchor.BN(1_000_000_000);

    try {
      const txId = await glamClient.drift.withdraw(fundPDA, amount);

      console.log("driftWithdraw", txId);
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
      const txId = await glamClient.drift.placeOrder(fundPDA, orderParams);
      console.log("driftPlaceOrders", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Drift: cancel orders", async () => {
    try {
      // SOL perp market index is 0
      const txId = await glamClient.drift.cancelOrders(
        fundPDA,
        MarketType.PERP,
        0,
        PositionDirection.LONG
      );

      console.log("driftCancelOrders", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
