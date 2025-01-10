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
  PositionDirection,
  decodeUser,
  SpotPosition,
  PerpPosition,
} from "@drift-labs/sdk";

import { BaseClient, TxOptions } from "./base";
import { AccountMeta } from "@solana/web3.js";
import { WSOL } from "../constants";
import { createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";

interface OrderConstants {
  perpBaseScale: number;
  quoteScale: number;
}

export interface PerpMarketConfig {
  fullName: string;
  categories: string[];
  symbol: string;
  baseAsset: string;
  marketIndex: number;
  launchTs: string;
  oracle: string;
  oracleSource: string;
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

export interface GlamDriftUser {
  delegate: string;
  name: string;
  spotPositions: SpotPosition[];
  perpPositions: PerpPosition[];
  marginMode: string;
  subAccountId: number;
  isMarginTradingEnabled: boolean;
}

const DRIFT_VAULT = new PublicKey(
  "JCNCMFXo5M5qwUPg2Utu1u6YWp3MbygxqBsBeXXJfrw",
);
const DRIFT_MARGIN_PRECISION = 10_000;

export class DriftClient {
  public constructor(readonly base: BaseClient) {}

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
    subAccountId: number = 0,
  ): Promise<TransactionSignature> {
    const tx = await this.updateUserCustomMarginRatioTx(
      fund,
      maxLeverage,
      subAccountId,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async updateUserMarginTradingEnabled(
    fund: PublicKey,
    marginTradingEnabled: boolean,
    subAccountId: number = 0,
  ): Promise<TransactionSignature> {
    const tx = await this.updateUserMarginTradingEnabledTx(
      fund,
      marginTradingEnabled,
      subAccountId,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async updateUserDelegate(
    fund: PublicKey,
    delegate: PublicKey,
    subAccountId: number = 0,
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
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.depositTx(
      fund,
      amount,
      marketIndex,
      subAccountId,
      marketConfigs,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async withdraw(
    fund: PublicKey,
    amount: anchor.BN,
    marketIndex: number = 1,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.withdrawTx(
      fund,
      amount,
      marketIndex,
      subAccountId,
      marketConfigs,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async placeOrder(
    fund: PublicKey,
    orderParams: OrderParams,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.placeOrderTx(
      fund,
      orderParams,
      subAccountId,
      marketConfigs,
      txOptions,
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
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.cancelOrdersTx(
      fund,
      marketType,
      marketIndex,
      direction,
      subAccountId,
      marketConfigs,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * Utils
   */

  DRIFT_PROGRAM = new PublicKey(DRIFT_PROGRAM_ID);

  public getUser(fund: PublicKey, subAccountId: number = 0): PublicKey[] {
    const treasury = this.base.getVaultPda(fund);
    return [
      getUserAccountPublicKeySync(this.DRIFT_PROGRAM, treasury, subAccountId),
      getUserStatsAccountPublicKey(this.DRIFT_PROGRAM, treasury),
    ];
  }

  async getPositions(fund: PublicKey, subAccountId: number = 0) {
    const treasury = this.base.getVaultPda(fund);
    const response = await fetch(
      `https://api.glam.systems/v0/drift/user?authority=${treasury.toBase58()}&accountId=${subAccountId}`,
    );
    const data = await response.json();
    const { spotPositions, perpPositions } = data as GlamDriftUser;

    return { spotPositions, perpPositions };
  }

  async fetchPolicyConfig(fund: any) {
    let driftUserAccount;
    if (fund) {
      const [driftUserAddress] = this.getUser(fund.id);
      const connection = this.base.provider.connection;
      const info = await connection.getAccountInfo(
        driftUserAddress,
        connection.commitment,
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
    marketConfigs: DriftMarketConfigs,
  ): Promise<AccountMeta[]> {
    const { spotPositions, perpPositions } = await this.getPositions(
      fund,
      subAccountId,
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

    console.log("spotMarketIndexes:", spotMarketIndexes);
    console.log("perpMarketIndexes:", perpMarketIndexes);

    const oracles = spotMarketIndexes
      .map((i) => marketConfigs.spot[i].oracle)
      .concat(perpMarketIndexes.map((i) => marketConfigs.perp[i].oracle));
    const markets = spotMarketIndexes
      .map((i) => marketConfigs.spot[i].marketPDA)
      .concat(perpMarketIndexes.map((i) => marketConfigs.perp[i].marketPDA));

    console.log("oracles:", oracles);

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
        })),
      );
  }

  /*
   * API methods
   */

  public async initializeTx(
    fund: PublicKey,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();

    const [user, userStats] = this.getUser(fund);
    const driftState = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    // @ts-ignore Type instantiation is excessively deep and possibly infinite.
    const tx = await this.base.program.methods
      .driftInitialize()
      .accounts({
        state: fund,
        user,
        userStats,
        driftState,
        signer,
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
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const [user] = this.getUser(fund, subAccountId);

    // https://github.com/drift-labs/protocol-v2/blob/babed162b08b1fe34e49a81c5aa3e4ec0a88ecdf/programs/drift/src/math/constants.rs#L183-L184
    const marginRatio = DRIFT_MARGIN_PRECISION / maxLeverage;

    const tx = await this.base.program.methods
      .driftUpdateUserCustomMarginRatio(subAccountId, marginRatio)
      .accountsPartial({
        state: fund,
        user,
        signer,
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
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const [user] = this.getUser(fund, subAccountId);

    const tx = await this.base.program.methods
      .driftUpdateUserMarginTradingEnabled(subAccountId, marginTradingEnabled)
      .accountsPartial({
        state: fund,
        user,
        signer,
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
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const [user] = this.getUser(fund, subAccountId);

    const tx = await this.base.program.methods
      .driftUpdateUserDelegate(subAccountId, delegate)
      .accountsPartial({
        state: fund,
        user,
        signer,
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
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const [user, userStats] = this.getUser(fund, subAccountId);
    const driftState = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const { mint, oracle, marketPDA, vaultPDA } =
      marketConfigs.spot[marketIndex];

    const preInstructions = [];
    if (mint === WSOL.toBase58()) {
      const wrapSolIx = await this.base.maybeWrapSol(fund, amount, signer);
      if (wrapSolIx) {
        preInstructions.push(wrapSolIx);
      }
    }

    const tx = await this.base.program.methods
      .driftDeposit(marketIndex, amount)
      .accountsPartial({
        state: fund,
        vaultAta: this.base.getVaultAta(fund, new PublicKey(mint)),
        driftAta: new PublicKey(vaultPDA),
        user,
        userStats,
        driftState,
        signer,
      })
      .remainingAccounts([
        { pubkey: new PublicKey(oracle), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(marketPDA), isSigner: false, isWritable: true },
      ])
      .preInstructions(preInstructions)
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
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();

    const [user, userStats] = this.getUser(fund, subAccountId);
    const driftState = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const { mint: m, vaultPDA: d } = marketConfigs.spot[marketIndex];
    const mint = new PublicKey(m);
    const driftAta = new PublicKey(d); // drift vault ata
    const vault = this.base.getVaultPda(fund);
    const vaultAta = this.base.getVaultAta(fund, mint); // glam vault ata

    const remainingAccounts = await this.composeRemainingAccounts(
      fund,
      subAccountId,
      MarketType.SPOT,
      marketIndex,
      marketConfigs,
    );

    const { tokenProgram } = await this.base.fetchMintWithOwner(mint);

    // Create vault ata in case it doesn't exist
    const preInstructions = [
      createAssociatedTokenAccountIdempotentInstruction(
        signer,
        vaultAta,
        vault,
        mint,
        tokenProgram,
      ),
    ];

    const tx = await this.base.program.methods
      .driftWithdraw(marketIndex, amount)
      .accountsPartial({
        state: fund,
        vaultAta: vaultAta,
        driftAta,
        user,
        userStats,
        driftState,
        signer,
        driftSigner: DRIFT_VAULT,
      })
      .remainingAccounts(remainingAccounts)
      .preInstructions(preInstructions)
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
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const { marketIndex, marketType } = orderParams;
    const remainingAccounts = await this.composeRemainingAccounts(
      fund,
      subAccountId,
      marketType,
      marketIndex,
      marketConfigs,
    );

    const signer = txOptions.signer || this.base.getSigner();
    const [user] = this.getUser(fund, subAccountId);
    const driftState = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const tx = await this.base.program.methods
      .driftPlaceOrders([orderParams])
      .accountsPartial({
        state: fund,
        user,
        driftState,
        signer,
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
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const [user] = this.getUser(fund, subAccountId);
    const driftState = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const remainingAccounts = await this.composeRemainingAccounts(
      fund,
      subAccountId,
      marketType,
      marketIndex,
      marketConfigs,
    );

    const tx = await this.base.program.methods
      .driftCancelOrders(marketType, marketIndex, direction)
      .accountsPartial({
        state: fund,
        user,
        driftState,
        signer,
      })
      .remainingAccounts(remainingAccounts)
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }
}
