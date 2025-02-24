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
  ModifyOrderParams,
} from "@drift-labs/sdk";

import { BaseClient, TxOptions } from "./base";
import { AccountMeta } from "@solana/web3.js";
import { WSOL } from "../constants";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { StateModel } from "../models";

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

  public async initialize(statePda: PublicKey): Promise<TransactionSignature> {
    const tx = await this.initializeTx(statePda);
    return await this.base.sendAndConfirm(tx);
  }

  public async updateUserCustomMarginRatio(
    statePda: PublicKey,
    maxLeverage: number, // 1=1x, 2=2x ... 50=50x leverage
    subAccountId: number = 0,
  ): Promise<TransactionSignature> {
    const tx = await this.updateUserCustomMarginRatioTx(
      statePda,
      maxLeverage,
      subAccountId,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async updateUserMarginTradingEnabled(
    statePda: PublicKey,
    marginTradingEnabled: boolean,
    subAccountId: number = 0,
  ): Promise<TransactionSignature> {
    const tx = await this.updateUserMarginTradingEnabledTx(
      statePda,
      marginTradingEnabled,
      subAccountId,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async updateUserDelegate(
    statePda: PublicKey | String,
    delegate: PublicKey | String,
    subAccountId: number = 0,
  ): Promise<TransactionSignature> {
    const tx = await this.updateUserDelegateTx(
      new PublicKey(statePda),
      new PublicKey(delegate),
      subAccountId,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async deleteUser(
    statePda: PublicKey | String,
    subAccountId: number = 0,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.deleteUserTx(
      new PublicKey(statePda),
      subAccountId,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async deposit(
    statePda: PublicKey,
    amount: anchor.BN,
    marketIndex: number = 1,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.depositTx(
      statePda,
      amount,
      marketIndex,
      subAccountId,
      marketConfigs,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async withdraw(
    statePda: PublicKey,
    amount: anchor.BN,
    marketIndex: number = 1,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.withdrawTx(
      statePda,
      amount,
      marketIndex,
      subAccountId,
      marketConfigs,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async placeOrder(
    statePda: PublicKey,
    orderParams: OrderParams,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.placeOrderTx(
      statePda,
      orderParams,
      subAccountId,
      marketConfigs,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async modifyOrder(
    statePda: PublicKey,
    modifyOrderParams: ModifyOrderParams,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.modifyOrderTx(
      statePda,
      modifyOrderParams,
      subAccountId,
      marketConfigs,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async cancelOrders(
    statePda: PublicKey,
    marketType: MarketType,
    marketIndex: number,
    direction: PositionDirection,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.cancelOrdersTx(
      statePda,
      marketType,
      marketIndex,
      direction,
      subAccountId,
      marketConfigs,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async cancelOrdersByIds(
    statePda: PublicKey,
    orderIds: number[],
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.cancelOrdersByIdsTx(
      statePda,
      orderIds,
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

  public getUser(statePda: PublicKey, subAccountId: number = 0): PublicKey[] {
    const vault = this.base.getVaultPda(statePda);
    return [
      getUserAccountPublicKeySync(this.DRIFT_PROGRAM, vault, subAccountId),
      getUserStatsAccountPublicKey(this.DRIFT_PROGRAM, vault),
    ];
  }

  async getPositions(statePda: PublicKey, subAccountId: number = 0) {
    const vault = this.base.getVaultPda(statePda);
    const response = await fetch(
      `https://api.glam.systems/v0/drift/user?authority=${vault.toBase58()}&accountId=${subAccountId}`,
    );
    const data = await response.json();
    const { spotPositions, perpPositions } = data as GlamDriftUser;

    return { spotPositions, perpPositions };
  }

  async fetchPolicyConfig(glamState: StateModel) {
    let driftUserAccount;
    if (glamState && glamState.id) {
      const [driftUserAddress] = this.getUser(glamState.id);
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
    if (delegate && delegate.equals(new PublicKey(0))) {
      delegate = undefined;
    }
    return {
      driftAccessControl: delegate ? 0 : 1,
      driftDelegatedAccount: delegate || null,
      driftMarketIndexesPerp: glamState?.driftMarketIndexesPerp || [],
      driftOrderTypes: glamState?.driftOrderTypes || [],
      driftMaxLeverage: driftUserAccount?.maxMarginRatio
        ? DRIFT_MARGIN_PRECISION / driftUserAccount?.maxMarginRatio
        : null,
      driftEnableSpot: driftUserAccount?.isMarginTradingEnabled || false,
      driftMarketIndexesSpot: glamState?.driftMarketIndexesSpot || [],
    };
  }

  async composeRemainingAccounts(
    glamState: PublicKey,
    subAccountId: number,
    marketConfigs: DriftMarketConfigs,
    marketType?: MarketType,
    marketIndex?: number,
  ): Promise<AccountMeta[]> {
    const { spotPositions, perpPositions } = await this.getPositions(
      glamState,
      subAccountId,
    );
    const spotMarketIndexes = spotPositions.map((p) => p.marketIndex);
    const perpMarketIndexes = perpPositions.map((p) => p.marketIndex);

    // Note that marketIndex is could be 0, need to explicitly check undefined
    if (
      marketType === MarketType.SPOT &&
      marketIndex !== undefined &&
      !spotMarketIndexes.includes(marketIndex)
    ) {
      spotMarketIndexes.push(marketIndex);
    } else if (
      marketType === MarketType.PERP &&
      marketIndex !== undefined &&
      !perpMarketIndexes.includes(marketIndex)
    ) {
      perpMarketIndexes.push(marketIndex);
    }

    const oracles = spotMarketIndexes
      .map((i) => marketConfigs.spot[i].oracle)
      .concat(perpMarketIndexes.map((i) => marketConfigs.perp[i].oracle));
    const markets = spotMarketIndexes
      .map((i) => marketConfigs.spot[i].marketPDA)
      .concat(perpMarketIndexes.map((i) => marketConfigs.perp[i].marketPDA));

    console.log("composeRemainingAccounts for:", marketType, marketIndex);
    console.log("markets:", markets);
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
    glamState: PublicKey,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const glamVault = this.base.getVaultPda(glamState);

    const [user, userStats] = this.getUser(glamState);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const GLAM_NAME = "GLAM *.+".split("").concat(Array(24).fill(0));
    const initializeUserIx = await this.base.program.methods
      //@ts-ignore
      .driftInitializeUser(0, GLAM_NAME)
      .accounts({
        glamState,
        user,
        userStats,
        state,
        glamSigner,
      })
      .instruction();

    const tx = await this.base.program.methods
      .driftInitializeUserStats()
      .accounts({
        glamState,
        state,
        userStats,
        glamSigner,
      })
      .postInstructions([initializeUserIx])
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async updateUserCustomMarginRatioTx(
    glamState: PublicKey,
    maxLeverage: number, // 1=1x, 2=2x ... 50=50x leverage
    subAccountId: number = 0,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const glamVault = this.base.getVaultPda(glamState);
    const [user] = this.getUser(glamState, subAccountId);

    // https://github.com/drift-labs/protocol-v2/blob/babed162b08b1fe34e49a81c5aa3e4ec0a88ecdf/programs/drift/src/math/constants.rs#L183-L184
    const marginRatio = DRIFT_MARGIN_PRECISION / maxLeverage;

    const tx = await this.base.program.methods
      .driftUpdateUserCustomMarginRatio(subAccountId, marginRatio)
      .accounts({
        glamState,
        glamSigner,
        user,
      })
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async updateUserMarginTradingEnabledTx(
    glamState: PublicKey,
    marginTradingEnabled: boolean,
    subAccountId: number = 0,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const [user] = this.getUser(glamState, subAccountId);

    const tx = await this.base.program.methods
      .driftUpdateUserMarginTradingEnabled(subAccountId, marginTradingEnabled)
      .accounts({
        glamState,
        glamSigner,
        user,
      })
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async updateUserDelegateTx(
    glamState: PublicKey,
    delegate: PublicKey,
    subAccountId: number = 0,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const [user] = this.getUser(glamState, subAccountId);

    const tx = await this.base.program.methods
      .driftUpdateUserDelegate(subAccountId, delegate)
      .accounts({
        glamState,
        glamSigner,
        user,
      })
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async deleteUserTx(
    glamState: PublicKey,
    subAccountId: number = 0,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const [user, userStats] = this.getUser(glamState, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const tx = await this.base.program.methods
      .driftDeleteUser()
      .accounts({
        glamState,
        state,
        user,
        userStats,
        glamSigner,
      })
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async depositTx(
    statePda: PublicKey,
    amount: anchor.BN,
    marketIndex: number = 1,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const [user, userStats] = this.getUser(statePda, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const { mint, oracle, marketPDA, vaultPDA } =
      marketConfigs.spot[marketIndex];

    const preInstructions = [];
    if (mint === WSOL.toBase58()) {
      const wrapSolIx = await this.base.maybeWrapSol(
        statePda,
        amount,
        glamSigner,
      );
      if (wrapSolIx) {
        preInstructions.push(wrapSolIx);
      }
    }

    const tx = await this.base.program.methods
      .driftDeposit(marketIndex, amount, false)
      .accounts({
        glamState: statePda,
        state,
        user,
        userStats,
        spotMarketVault: new PublicKey(vaultPDA),
        userTokenAccount: this.base.getVaultAta(statePda, new PublicKey(mint)),
        glamSigner,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts([
        { pubkey: new PublicKey(oracle), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(marketPDA), isSigner: false, isWritable: true },
      ])
      .preInstructions(preInstructions)
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async withdrawTx(
    statePda: PublicKey,
    amount: anchor.BN,
    marketIndex: number = 1,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();

    const [user, userStats] = this.getUser(statePda, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const { mint: m, vaultPDA: d } = marketConfigs.spot[marketIndex];
    const mint = new PublicKey(m);
    const driftAta = new PublicKey(d); // drift vault ata
    const vault = this.base.getVaultPda(statePda);
    const vaultAta = this.base.getVaultAta(statePda, mint); // glam vault ata

    const remainingAccounts = await this.composeRemainingAccounts(
      statePda,
      subAccountId,
      marketConfigs,
      MarketType.SPOT,
      marketIndex,
    );

    const { tokenProgram } = await this.base.fetchMintWithOwner(mint);

    // Create vault ata in case it doesn't exist
    const preInstructions = [
      createAssociatedTokenAccountIdempotentInstruction(
        glamSigner,
        vaultAta,
        vault,
        mint,
        tokenProgram,
      ),
    ];

    const tx = await this.base.program.methods
      .driftWithdraw(marketIndex, amount, false)
      .accounts({
        glamState: statePda,
        state,
        user,
        userStats,
        glamSigner,
        spotMarketVault: driftAta,
        userTokenAccount: vaultAta,
        driftSigner: DRIFT_VAULT,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts(remainingAccounts)
      .preInstructions(preInstructions)
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async placeOrderTx(
    glamState: PublicKey,
    orderParams: OrderParams,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const { marketIndex, marketType } = orderParams;
    const remainingAccounts = await this.composeRemainingAccounts(
      glamState,
      subAccountId,
      marketConfigs,
      marketType,
      marketIndex,
    );

    const glamSigner = txOptions.signer || this.base.getSigner();
    const [user] = this.getUser(glamState, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const tx = await this.base.program.methods
      // @ts-ignore
      .driftPlaceOrders([orderParams])
      .accounts({
        glamState,
        user,
        state,
        glamSigner,
      })
      .remainingAccounts(remainingAccounts)
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async modifyOrderTx(
    statePda: PublicKey,
    modifyOrderParams: ModifyOrderParams,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    // const { marketIndex, marketType } = orderParams;
    // const remainingAccounts = await this.composeRemainingAccounts(
    //   statePda,
    //   subAccountId,
    //   marketConfigs,
    //   marketType,
    //   marketIndex,
    // );

    const signer = txOptions.signer || this.base.getSigner();
    const [user] = this.getUser(statePda, subAccountId);
    const driftState = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const tx = await this.base.program.methods
      // @ts-ignore
      .driftModifyOrder(1, modifyOrderParams)
      .accounts({
        glamState: statePda,
        glamSigner: signer,
        user,
        state: driftState,
      })
      // .remainingAccounts(remainingAccounts)
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async cancelOrdersTx(
    glamState: PublicKey,
    marketType: MarketType,
    marketIndex: number,
    direction: PositionDirection,
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const glamVault = this.base.getVaultPda(glamState);
    const [user] = this.getUser(glamState, subAccountId);
    const driftState = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const remainingAccounts = await this.composeRemainingAccounts(
      glamState,
      subAccountId,
      marketConfigs,
      marketType,
      marketIndex,
    );

    const tx = await this.base.program.methods
      // @ts-ignore
      .driftCancelOrders(marketType, marketIndex, direction)
      .accounts({
        glamState,
        glamSigner,
        user,
        state: driftState,
      })
      .remainingAccounts(remainingAccounts)
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async cancelOrdersByIdsTx(
    glamState: PublicKey,
    orderIds: number[],
    subAccountId: number = 0,
    marketConfigs: DriftMarketConfigs,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const [user] = this.getUser(glamState, subAccountId);
    const driftState = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const remainingAccounts = await this.composeRemainingAccounts(
      glamState,
      subAccountId,
      marketConfigs,
    );

    const tx = await this.base.program.methods
      .driftCancelOrdersByIds(orderIds)
      .accounts({
        glamState,
        glamSigner,
        user,
        state: driftState,
      })
      .remainingAccounts(remainingAccounts)
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }
}
