import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
} from "@solana/web3.js";
import {
  DRIFT_PROGRAM_ID,
  getDriftStateAccountPublicKey,
  getUserAccountPublicKeySync,
  getUserStatsAccountPublicKey,
  MarketType,
  OrderParams,
  DriftClient as _DriftClient,
  initialize as _initialize,
  PositionDirection,
  BulkAccountLoader,
  decodeUser,
  User,
} from "@drift-labs/sdk";

import { BaseClient, TxOptions } from "./base";
import { AccountMeta } from "@solana/web3.js";

interface OrderConstants {
  perpBaseScale: number;
  quoteScale: number;
}

export interface PerpMarketConfig {
  fullName: string;
  categories: string[];
  symbol: string;
  baseAsset: string;
  decimals: number;
  marketIndex: number;
  launchTs: string;
  oracle: string;
  oraceSource: string;
  pythPullOraclePDA: string;
  pythFeedId: string;
  marketPDA: string;
}

export interface SpotMarketConfig {
  symbol: string;
  decimals: number;
  marketIndex: number;
  launchTs?: string;
  oracle: string;
  oracleSource: string;
  pythPullOraclePDA: string;
  pythFeedId: string;
  marketPDA: string;
  mint: string;
  serumMarket?: string;
  phoenixMarket?: string;
  openBookMarket?: string;
  vaultPDA: string;
}

export interface DriftMarketConfigs {
  orderConstants: OrderConstants;
  perp: PerpMarketConfig[];
  spot: SpotMarketConfig[];
}

const DRIFT_VAULT = new PublicKey(
  "JCNCMFXo5M5qwUPg2Utu1u6YWp3MbygxqBsBeXXJfrw"
);
const DRIFT_MARGIN_PRECISION = 10_000;

const defaultOracles = [
  new PublicKey("BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF"), // sol pricing oracle
  new PublicKey("En8hkHLkRe9d9DraYmBTrus518BvmVH448YcvmrFM6Ce"), // usdc pricing oracle
];

const defaultMarkets = [
  new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"), // sol spot market
  new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), // usdc spot market
];

export class DriftClient {
  // @ts-ignore: Property '_driftClient' has no initializer and is not definitely assigned in the constructor.
  _driftClient: _DriftClient;

  public constructor(readonly base: BaseClient) {
    const wallet = this.base.getWallet();

    // Set up the drift client if wallet is connected
    if (wallet) {
      const env = "mainnet-beta";
      const sdkConfig = _initialize({ env });
      this._driftClient = new _DriftClient({
        connection: this.base.provider.connection,
        wallet,
        programID: new PublicKey(DRIFT_PROGRAM_ID),
        env,
        accountSubscription: {
          type: "polling",
          accountLoader: new BulkAccountLoader(
            this.base.provider.connection,
            "confirmed",
            5000
          ),
        },
      });
    }
  }

  /*
   * Client methods
   */

  public async initialize(fund: PublicKey): Promise<TransactionSignature> {
    const tx = await this.initializeTx(fund);
    return await this.base.sendAndConfirm(tx);
  }

  public async updateUserCustomMarginRatio(
    fund: PublicKey,
    maxLeverage: number, // 1=1x, 2=2x ... 50=50x leverage
    subAccountId: number = 0
  ): Promise<TransactionSignature> {
    const tx = await this.updateUserCustomMarginRatioTx(
      fund,
      maxLeverage,
      subAccountId
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async updateUserMarginTradingEnabled(
    fund: PublicKey,
    marginTradingEnabled: boolean,
    subAccountId: number = 0
  ): Promise<TransactionSignature> {
    const tx = await this.updateUserMarginTradingEnabledTx(
      fund,
      marginTradingEnabled,
      subAccountId
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async updateUserDelegate(
    fund: PublicKey,
    delegate: PublicKey,
    subAccountId: number = 0
  ): Promise<TransactionSignature> {
    const tx = await this.updateUserDelegateTx(fund, delegate, subAccountId);
    return await this.base.sendAndConfirm(tx);
  }

  public async deposit(
    fund: PublicKey,
    amount: anchor.BN,
    marketIndex: number = 1,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {}
  ): Promise<TransactionSignature> {
    const tx = await this.depositTx(
      fund,
      amount,
      marketIndex,
      subAccountId,
      marketConfigs,
      txOptions
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async withdraw(
    fund: PublicKey,
    amount: anchor.BN,
    marketIndex: number = 1,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {}
  ): Promise<TransactionSignature> {
    const tx = await this.withdrawTx(
      fund,
      amount,
      marketIndex,
      subAccountId,
      marketConfigs
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async placeOrder(
    fund: PublicKey,
    orderParams: OrderParams,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {}
  ): Promise<TransactionSignature> {
    const tx = await this.placeOrderTx(
      fund,
      orderParams,
      subAccountId,
      marketConfigs,
      txOptions
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async cancelOrders(
    fund: PublicKey,
    marketType: MarketType,
    marketIndex: number,
    direction: PositionDirection,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {}
  ): Promise<TransactionSignature> {
    const tx = await this.cancelOrdersTx(
      fund,
      marketType,
      marketIndex,
      direction,
      subAccountId,
      marketConfigs,
      txOptions
    );
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * Utils
   */

  DRIFT_PROGRAM = new PublicKey(DRIFT_PROGRAM_ID);

  public getUser(fund: PublicKey, subAccountId: number = 0): PublicKey[] {
    const treasury = this.base.getTreasuryPDA(fund);
    return [
      getUserAccountPublicKeySync(this.DRIFT_PROGRAM, treasury, subAccountId),
      getUserStatsAccountPublicKey(this.DRIFT_PROGRAM, treasury),
    ];
  }

  async getPositions(fund: PublicKey, subAccountId: number = 0) {
    const driftClient = await this.getDriftClient();
    const userAccountPublicKey = this.getUser(fund, subAccountId)[0];
    const driftUser = new User({
      driftClient,
      userAccountPublicKey,
      accountSubscription: {
        type: "polling",
        accountLoader: new BulkAccountLoader(
          this.base.provider.connection,
          "confirmed",
          5000
        ),
      },
    });
    if (!driftUser.isSubscribed) {
      const res = await driftUser.subscribe();
      console.log(
        "Subscribed to drift user ",
        userAccountPublicKey.toBase58(),
        res
      );
    }

    const perpPositions = driftUser.getActivePerpPositions();
    const spotPositions = driftUser.getActiveSpotPositions();

    console.log("Perp positions", perpPositions);
    console.log("Spot positions", spotPositions);

    // Unsubscribe to avoid subsequent RPCs
    await driftUser.unsubscribe();
    await driftClient.unsubscribe();

    return { perpPositions, spotPositions };
  }

  async getDriftClient(): Promise<_DriftClient> {
    if (!this._driftClient.isSubscribed) {
      await this._driftClient.subscribe();
    }

    return this._driftClient;
  }

  async getSpotMarketAccount(marketIndex: number) {
    const drift = await this.getDriftClient();
    const market = drift.getSpotMarketAccount(marketIndex);
    if (!market) {
      throw new Error(`Spot market not found: ${marketIndex}`);
    }
    await drift.unsubscribe();
    return market;
  }

  async getPerpMarketAccount(marketIndex: number) {
    const drift = await this.getDriftClient();
    const market = drift.getPerpMarketAccount(marketIndex);
    if (!market) {
      throw new Error(`Perp market not found: ${marketIndex}`);
    }
    await drift.unsubscribe();
    return market;
  }

  async getSpotMarketAccounts(marketIndexes: number[]) {
    const drift = await this.getDriftClient();
    const markets = marketIndexes.map((i) => drift.getSpotMarketAccount(i));
    if (!markets || markets.length !== marketIndexes.length) {
      throw new Error(`Spot markets couldn't be fetched: ${marketIndexes}`);
    }
    await drift.unsubscribe();
    return markets;
  }

  async getPerpMarketAccounts(marketIndexes: number[]) {
    const drift = await this.getDriftClient();
    const markets = marketIndexes.map((i) => drift.getPerpMarketAccount(i));
    if (!markets || markets.length !== marketIndexes.length) {
      throw new Error(`Perp markets couldn't be fetched: ${marketIndexes}`);
    }
    await drift.unsubscribe();
    return markets;
  }

  async fetchPolicyConfig(fund: any) {
    let driftUserAccount;
    if (fund) {
      const [driftUserAddress] = this.getUser(fund.id);
      const connection = this.base.provider.connection;
      const info = await connection.getAccountInfo(
        driftUserAddress,
        connection.commitment
      );
      if (info) {
        driftUserAccount = decodeUser(info.data);
      }
    }
    let delegate = driftUserAccount?.delegate;
    if (
      delegate &&
      delegate.toBase58() === "11111111111111111111111111111111"
    ) {
      delegate = undefined;
    }
    return {
      driftAccessControl: delegate ? 0 : 1,
      driftDelegatedAccount: delegate || null,
      driftMarketIndexesPerp: fund?.driftMarketIndexesPerp || [],
      driftOrderTypes: fund?.driftOrderTypes || [],
      driftMaxLeverage: driftUserAccount?.maxMarginRatio
        ? DRIFT_MARGIN_PRECISION / driftUserAccount?.maxMarginRatio
        : null,
      driftEnableSpot: driftUserAccount?.isMarginTradingEnabled || false,
      driftMarketIndexesSpot: fund?.driftMarketIndexesSpot || [],
    };
  }

  async composeRemainingAccounts(
    fund: PublicKey,
    subAccountId: number,
    marketType: MarketType,
    marketIndex: number,
    marketConfigs: DriftMarketConfigs
  ): Promise<AccountMeta[]> {
    const { spotPositions, perpPositions } = await this.getPositions(
      fund,
      subAccountId
    );
    const spotMarketIndexes = spotPositions.map((p) => p.marketIndex);
    const perpMarketIndexes = perpPositions.map((p) => p.marketIndex);

    switch (marketType) {
      case MarketType.SPOT:
        if (!spotMarketIndexes.includes(marketIndex)) {
          spotMarketIndexes.push(marketIndex);
        }
        break;
      case MarketType.PERP:
        if (!perpMarketIndexes.includes(marketIndex)) {
          perpMarketIndexes.push(marketIndex);
        }
        break;
    }

    const oracles = spotMarketIndexes
      .map((i) => marketConfigs.spot[i].oracle)
      .concat(perpMarketIndexes.map((i) => marketConfigs.perp[i].oracle));
    const markets = spotMarketIndexes
      .map((i) => marketConfigs.spot[i].marketPDA)
      .concat(perpMarketIndexes.map((i) => marketConfigs.perp[i].marketPDA));

    return oracles
      .map((o) => ({
        pubkey: new PublicKey(o),
        isWritable: false,
        isSigner: false,
      }))
      .concat(
        markets.map((m) => ({
          pubkey: new PublicKey(m),
          isWritable: true,
          isSigner: false,
        }))
      );
  }

  /*
   * API methods
   */

  public async initializeTx(
    fund: PublicKey,
    txOptions: TxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = txOptions.signer || this.base.getManager();

    const [user, userStats] = this.getUser(fund);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    // @ts-ignore Type instantiation is excessively deep and possibly infinite.
    const tx = await this.base.program.methods
      .driftInitialize()
      .accounts({
        fund,
        user,
        userStats,
        state,
        manager,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async updateUserCustomMarginRatioTx(
    fund: PublicKey,
    maxLeverage: number, // 1=1x, 2=2x ... 50=50x leverage
    subAccountId: number = 0,
    txOptions: TxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = txOptions.signer || this.base.getManager();
    const [user] = this.getUser(fund, subAccountId);

    // https://github.com/drift-labs/protocol-v2/blob/babed162b08b1fe34e49a81c5aa3e4ec0a88ecdf/programs/drift/src/math/constants.rs#L183-L184
    const marginRatio = DRIFT_MARGIN_PRECISION / maxLeverage;

    const tx = await this.base.program.methods
      .driftUpdateUserCustomMarginRatio(subAccountId, marginRatio)
      .accounts({
        fund,
        user,
        manager,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async updateUserMarginTradingEnabledTx(
    fund: PublicKey,
    marginTradingEnabled: boolean,
    subAccountId: number = 0,
    txOptions: TxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = txOptions.signer || this.base.getManager();
    const [user] = this.getUser(fund, subAccountId);

    const tx = await this.base.program.methods
      .driftUpdateUserMarginTradingEnabled(subAccountId, marginTradingEnabled)
      .accounts({
        fund,
        user,
        manager,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async updateUserDelegateTx(
    fund: PublicKey,
    delegate: PublicKey,
    subAccountId: number = 0,
    txOptions: TxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = txOptions.signer || this.base.getManager();
    const [user] = this.getUser(fund, subAccountId);

    const tx = await this.base.program.methods
      .driftUpdateUserDelegate(subAccountId, delegate)
      .accounts({
        fund,
        user,
        manager,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async depositTx(
    fund: PublicKey,
    amount: anchor.BN,
    marketIndex: number = 1,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = txOptions.signer || this.base.getManager();
    const [user, userStats] = this.getUser(fund, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const { mint, oracle, marketPDA, vaultPDA } =
      marketConfigs.spot[marketIndex];

    const tx = await this.base.program.methods
      .driftDeposit(marketIndex, amount)
      .accounts({
        fund,
        treasuryAta: this.base.getTreasuryAta(fund, new PublicKey(mint)),
        driftAta: new PublicKey(vaultPDA),
        user,
        userStats,
        state,
        manager,
      })
      .remainingAccounts([
        { pubkey: new PublicKey(oracle), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(marketPDA), isSigner: false, isWritable: true },
      ])
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async withdrawTx(
    fund: PublicKey,
    amount: anchor.BN,
    marketIndex: number = 1,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = txOptions.signer || this.base.getManager();
    const [user, userStats] = this.getUser(fund, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const { mint, vaultPDA } = marketConfigs.spot[marketIndex];
    const remainingAccounts = await this.composeRemainingAccounts(
      fund,
      subAccountId,
      MarketType.SPOT,
      marketIndex,
      marketConfigs
    );

    const tx = await this.base.program.methods
      .driftWithdraw(marketIndex, amount)
      .accounts({
        fund,
        treasuryAta: this.base.getTreasuryAta(fund, new PublicKey(mint)),
        driftAta: new PublicKey(vaultPDA),
        user,
        userStats,
        state,
        manager,
        driftSigner: DRIFT_VAULT,
      })
      .remainingAccounts(remainingAccounts)
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async placeOrderTx(
    fund: PublicKey,
    orderParams: OrderParams,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {}
  ): Promise<VersionedTransaction> {
    const { marketIndex, marketType } = orderParams;
    const remainingAccounts = await this.composeRemainingAccounts(
      fund,
      subAccountId,
      marketType,
      marketIndex,
      marketConfigs
    );
    console.log("remainingAccounts", remainingAccounts);

    const manager = txOptions.signer || this.base.getManager();
    const [user] = this.getUser(fund, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const tx = await this.base.program.methods
      //@ts-ignore
      .driftPlaceOrders([orderParams])
      .accounts({
        fund,
        user,
        state,
        manager,
      })
      .remainingAccounts(remainingAccounts)
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async cancelOrdersTx(
    fund: PublicKey,
    marketType: MarketType,
    marketIndex: number,
    direction: PositionDirection,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = txOptions.signer || this.base.getManager();
    const [user] = this.getUser(fund, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const remainingAccounts = await this.composeRemainingAccounts(
      fund,
      subAccountId,
      marketType,
      marketIndex,
      marketConfigs
    );

    const tx = await this.base.program.methods
      //@ts-ignore
      .driftCancelOrders(marketType, marketIndex, direction)
      .accounts({
        fund,
        user,
        state,
        manager,
      })
      .remainingAccounts(remainingAccounts)
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }
}
