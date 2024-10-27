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
} from "@drift-labs/sdk";

import { BaseClient, ApiTxOptions } from "./base";

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

interface MarketAccounts {
  oracle?: PublicKey;
  spotMarket?: PublicKey;
  perpMarket?: PublicKey; // only for perp orders
}

export class DriftClient {
  // @ts-ignore: Property '_driftClient' has no initializer and is not definitely assigned in the constructor.
  _driftClient: _DriftClient;

  public constructor(readonly base: BaseClient) {
    const wallet = this.base.getWallet();

    // Set up the drift client of wallet is connected
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
            1000
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
    subAccountId: number = 0
  ): Promise<TransactionSignature> {
    const tx = await this.depositTx(fund, amount, marketIndex, subAccountId);
    return await this.base.sendAndConfirm(tx);
  }

  public async withdraw(
    fund: PublicKey,
    amount: anchor.BN,
    marketIndex: number = 1,
    subAccountId: number = 0
  ): Promise<TransactionSignature> {
    const tx = await this.withdrawTx(fund, amount, marketIndex, subAccountId);
    return await this.base.sendAndConfirm(tx);
  }

  public async placeOrder(
    fund: PublicKey,
    orderParams: OrderParams,
    subAccountId: number = 0,
    marketAccounts: MarketAccounts = {} as MarketAccounts
  ): Promise<TransactionSignature> {
    const tx = await this.placeOrderTx(
      fund,
      orderParams,
      subAccountId,
      marketAccounts
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async cancelOrders(
    fund: PublicKey,
    marketType: MarketType,
    marketIndex: number,
    direction: PositionDirection,
    subAccountId: number = 0,
    marketAccounts: MarketAccounts = {} as MarketAccounts
  ): Promise<TransactionSignature> {
    const tx = await this.cancelOrdersTx(
      fund,
      marketType,
      marketIndex,
      direction,
      subAccountId,
      marketAccounts
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
    return market;
  }

  async getPerpMarketAccount(marketIndex: number) {
    const drift = await this.getDriftClient();
    const market = drift.getPerpMarketAccount(marketIndex);
    if (!market) {
      throw new Error(`Perp market not found: ${marketIndex}`);
    }
    return market;
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

  /*
   * API methods
   */

  public async initializeTx(
    fund: PublicKey,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();

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
      ...apiOptions,
    });
  }

  public async updateUserCustomMarginRatioTx(
    fund: PublicKey,
    maxLeverage: number, // 1=1x, 2=2x ... 50=50x leverage
    subAccountId: number = 0,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
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
      ...apiOptions,
    });
  }

  public async updateUserMarginTradingEnabledTx(
    fund: PublicKey,
    marginTradingEnabled: boolean,
    subAccountId: number = 0,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
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
      ...apiOptions,
    });
  }

  public async updateUserDelegateTx(
    fund: PublicKey,
    delegate: PublicKey,
    subAccountId: number = 0,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
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
      ...apiOptions,
    });
  }

  public async depositTx(
    fund: PublicKey,
    amount: anchor.BN,
    marketIndex: number = 1,
    subAccountId: number = 0,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const {
      pubkey: market,
      mint,
      vault,
      oracle,
    } = await this.getSpotMarketAccount(marketIndex);

    const [user, userStats] = this.getUser(fund, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const manager = apiOptions.signer || this.base.getManager();

    const tx = await this.base.program.methods
      .driftDeposit(marketIndex, amount)
      .accounts({
        fund,
        treasuryAta: this.base.getTreasuryAta(fund, mint),
        driftAta: vault,
        user,
        userStats,
        state,
        manager,
      })
      .remainingAccounts([
        { pubkey: oracle, isSigner: false, isWritable: false },
        { pubkey: market, isSigner: false, isWritable: true },
      ])
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  public async withdrawTx(
    fund: PublicKey,
    amount: anchor.BN,
    marketIndex: number = 1,
    subAccountId: number = 0,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const {
      pubkey: market,
      mint,
      vault,
      oracle,
    } = await this.getSpotMarketAccount(marketIndex);

    const [user, userStats] = this.getUser(fund, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const manager = apiOptions.signer || this.base.getManager();

    const tx = await this.base.program.methods
      .driftWithdraw(marketIndex, amount)
      .accounts({
        fund,
        treasuryAta: this.base.getTreasuryAta(fund, mint),
        driftAta: vault,
        user,
        userStats,
        state,
        manager,
        driftSigner: DRIFT_VAULT,
      })
      .remainingAccounts([
        { pubkey: oracle, isSigner: false, isWritable: false },
        { pubkey: market, isSigner: false, isWritable: true },
      ])
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  public async placeOrderTx(
    fund: PublicKey,
    orderParams: OrderParams,
    subAccountId: number = 0,
    marketAccounts: MarketAccounts = {} as MarketAccounts,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();

    const [user] = this.getUser(fund, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const { oracle, spotMarket, perpMarket } = marketAccounts;
    const oracles = !oracle ? defaultOracles : defaultOracles.concat([oracle]);
    const markets = !spotMarket
      ? defaultMarkets
      : defaultMarkets.concat([spotMarket]);
    const remainingAccounts = oracles.concat(markets).map((pubkey) => ({
      pubkey,
      isWritable: false,
      isSigner: false,
    }));
    if (orderParams.marketType === MarketType.PERP) {
      remainingAccounts.push({
        pubkey: perpMarket,
        isWritable: true,
        isSigner: false,
      });
    }
    console.log("remainingAccounts", remainingAccounts);

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
      ...apiOptions,
    });
  }

  public async cancelOrdersTx(
    fund: PublicKey,
    marketType: MarketType,
    marketIndex: number,
    direction: PositionDirection,
    subAccountId: number = 0,
    marketAccounts: MarketAccounts = {} as MarketAccounts,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();

    const [user] = this.getUser(fund, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const { oracle, spotMarket, perpMarket } = marketAccounts;
    const oracles = !oracle ? defaultOracles : defaultOracles.concat([oracle]);
    const markets = !spotMarket
      ? defaultMarkets
      : defaultMarkets.concat([spotMarket]);
    const remainingAccounts = oracles.concat(markets).map((pubkey) => ({
      pubkey,
      isWritable: false,
      isSigner: false,
    }));
    if (marketType === MarketType.PERP) {
      remainingAccounts.push({
        pubkey: perpMarket,
        isWritable: true,
        isSigner: false,
      });
    }

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
      ...apiOptions,
    });
  }
}
