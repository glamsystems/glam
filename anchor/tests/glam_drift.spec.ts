import * as anchor from "@coral-xyz/anchor";
import { DriftMarketConfigs, GlamClient } from "../src";
import { airdrop, createGlamStateForTest } from "./setup";
import {
  getOrderParams,
  MarketType,
  OrderType,
  PositionDirection,
} from "@drift-labs/sdk";
import { jest } from "@jest/globals";

const mockPositionsData = {
  spotPositions: [
    {
      scaledBalance: 8173,
      openBids: 0,
      openAsks: 0,
      cumulativeDeposits: 18446744073705673000,
      marketIndex: 0,
      balanceType: "Deposit",
      openOrders: 0,
      cumulativeDepositInterest: "11245879976",
      cumulativeBorrowInterest: "12560874142",
      balance: "0.000009",
    },
    {
      scaledBalance: 46,
      openBids: 0,
      openAsks: 0,
      cumulativeDeposits: 18446744073709255000,
      marketIndex: 1,
      balanceType: "Deposit",
      openOrders: 0,
      cumulativeDepositInterest: "10370779453",
      cumulativeBorrowInterest: "11047388421",
      balance: "0.000000047",
    },
  ],
  perpPositions: [],
};
// @ts-ignore
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockPositionsData),
  }),
) as jest.Mock;

describe("glam_drift", () => {
  const glamClient = new GlamClient();
  const commitment = "confirmed";

  let statePda, vaultPda;
  const marketConfigs: DriftMarketConfigs = {
    orderConstants: {
      perpBaseScale: 9,
      quoteScale: 6,
    },
    perp: [
      {
        fullName: "Solana",
        categories: ["Solana", "L1", "Infra"],
        symbol: "SOL-PERP",
        baseAsset: "SOL",
        marketIndex: 0,
        launchTs: "2022-11-04T11:15:05Z",
        oracle: "BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF",
        oracleSource: "PythPull",
        pythPullOraclePDA: "BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF",
        pythFeedId:
          "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
        marketPDA: "8UJgxaiQx5nTrdDgph5FiahMmzduuLTLf5WmsPegYA6W",
      },
    ],
    spot: [
      {
        symbol: "USDC",
        marketIndex: 0,
        decimals: 6,
        oracle: "En8hkHLkRe9d9DraYmBTrus518BvmVH448YcvmrFM6Ce",
        oracleSource: "PythStableCoinPull",
        pythPullOraclePDA: "En8hkHLkRe9d9DraYmBTrus518BvmVH448YcvmrFM6Ce",
        pythFeedId:
          "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
        marketPDA: "6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3",
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        vaultPDA: "GXWqPpjQpdz7KZw9p7f5PX2eGxHAhvpNXiviFkAB8zXg",
      },
      {
        symbol: "SOL",
        marketIndex: 1,
        decimals: 9,
        oracle: "BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF",
        oracleSource: "PythPull",
        pythPullOraclePDA: "BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF",
        pythFeedId:
          "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
        marketPDA: "3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh",
        mint: "So11111111111111111111111111111111111111112",
        serumMarket: "8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6",
        phoenixMarket: "4DoNfFBfF7UokCC2FQzriy7yHK6DY6NVdYpuekQ5pRgg",
        openBookMarket: "AFgkED1FUVfBe2trPUDqSqK9QKd4stJrfzq5q1RwAFTa",
        vaultPDA: "DfYCNezifxAEsQbAJ1b3j6PX3JVBe8fu11KBhxsbw5d2",
      },
    ],
  };

  it("Create and initialize glam state", async () => {
    const stateData = await createGlamStateForTest();
    statePda = stateData.statePda;
    vaultPda = stateData.vaultPda;

    const state = await glamClient.fetchStateAccount(statePda);
    expect(state.mints.length).toEqual(1);
    expect(state.name).toEqual("Glam Fund SOL-mSOL");

    // Enable drift integration
    const updated = {
      integrationAcls: [{ name: { drift: {} }, features: [] }],
    };
    try {
      const txSig = await glamClient.state.updateState(statePda, updated);
      console.log("Enable drift integration tx:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Airdrop 10 SOL to vault", async () => {
    const connection = glamClient.provider.connection;
    const lamports = 10_000_000_000;
    await airdrop(connection, vaultPda, lamports);
  });

  it("Drift initialize", async () => {
    try {
      const txId = await glamClient.drift.initialize(statePda);
      console.log("driftInitialize", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Drift: update trader", async () => {
    const trader = glamClient.getSigner();
    try {
      const txId = await glamClient.drift.updateUserDelegate(statePda, trader);
      console.log("driftUpdateUserDelegate", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Drift: deposit 10 SOL to trading account", async () => {
    const amount = new anchor.BN(10_000_000_000);

    try {
      const txId = await glamClient.drift.deposit(
        statePda,
        amount,
        1,
        0,
        marketConfigs,
      );

      console.log("driftDeposit", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Drift: withdraw 1 SOL to trading account", async () => {
    const amount = new anchor.BN(1_000_000_000);
    try {
      const txId = await glamClient.drift.withdraw(
        statePda,
        amount,
        1,
        0,
        marketConfigs,
      );

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
      const txId = await glamClient.drift.placeOrder(
        statePda,
        orderParams,
        0,
        marketConfigs,
      );
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
        statePda,
        MarketType.PERP,
        0,
        PositionDirection.LONG,
        0,
        marketConfigs,
      );

      console.log("driftCancelOrders", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Drift: constrain market", async () => {
    try {
      const txId = await glamClient.state.updateState(statePda, {
        driftMarketIndexesPerp: [2, 3],
      });
      console.log("driftPlaceOrders", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Drift: place perp order again - should fail", async () => {
    const orderParams = getOrderParams({
      orderType: OrderType.LIMIT,
      marketType: MarketType.PERP,
      direction: PositionDirection.LONG,
      marketIndex: 0,
      baseAssetAmount: new anchor.BN(10_0000_000),
      price: new anchor.BN(100_000_000), // set a very low limit price
    });

    try {
      const txId = await glamClient.drift.placeOrder(
        statePda,
        orderParams,
        0,
        marketConfigs,
      );
      expect(txId).toBeUndefined();
    } catch (err) {
      const errMsg = err.message + err.logs;
      expect(errMsg).toContain("Signer is not authorized");
    }
  });
});
