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
} from "@drift-labs/sdk";

import { BaseClient, ApiTxOptions } from "./base";
import { WSOL } from "../constants";

const DRIFT_VAULT = new PublicKey(
  "JCNCMFXo5M5qwUPg2Utu1u6YWp3MbygxqBsBeXXJfrw"
);
const ACCOUNTS_FOR_DEPOSIT_WITHDRAW = {
  SOL: {
    spotMarketVault: new PublicKey(
      "DfYCNezifxAEsQbAJ1b3j6PX3JVBe8fu11KBhxsbw5d2"
    ),
    remainingAccounts: [
      {
        pubkey: new PublicKey("BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF"), // sol pricing oracle
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"), // sol spot market account
        isSigner: false,
        isWritable: true,
      },
    ],
  },
};
const remainingAccountsForOrders = [
  {
    pubkey: new PublicKey("BAtFj4kQttZRVep3UZS2aZRDixkGYgWsbqTBVDbnSsPF"), // sol pricing oracle
    isWritable: false,
    isSigner: false,
  },
  {
    pubkey: new PublicKey("En8hkHLkRe9d9DraYmBTrus518BvmVH448YcvmrFM6Ce"), // usdc pricing oracle
    isWritable: false,
    isSigner: false,
  },
  {
    pubkey: new PublicKey("3x85u7SWkmmr7YQGYhtjARgxwegTLJgkSLRprfXod6rh"), // sol spot market account
    isWritable: true,
    isSigner: false,
  },
  {
    pubkey: new PublicKey("6gMq3mRCKf8aP3ttTyYhuijVZ2LGi14oDsBbkgubfLB3"), // usdc spot market
    isWritable: true,
    isSigner: false,
  },
  {
    pubkey: new PublicKey("8UJgxaiQx5nTrdDgph5FiahMmzduuLTLf5WmsPegYA6W"), // sol perp market account
    isWritable: true,
    isSigner: false,
  },
];

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
    marginRatio: number,
    subAccountId: number = 0
  ): Promise<TransactionSignature> {
    const tx = await this.updateUserCustomMarginRatioTx(
      fund,
      marginRatio,
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

  public async placeOrders(
    fund: PublicKey,
    orderParams: OrderParams[],
    subAccountId: number = 0
  ): Promise<TransactionSignature> {
    const tx = await this.placeOrdersTx(fund, orderParams, subAccountId);
    return await this.base.sendAndConfirm(tx);
  }

  public async cancelOrders(
    fund: PublicKey,
    marketType: MarketType,
    marketIndex: number,
    direction: PositionDirection,
    subAccountId: number = 0
  ): Promise<TransactionSignature> {
    const tx = await this.cancelOrdersTx(
      fund,
      marketType,
      marketIndex,
      direction,
      subAccountId
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

    const tx = await this.base.program.methods
      .driftInitialize()
      .accounts({
        fund,
        user,
        userStats,
        state,
        //@ts-ignore IDL ts type is unhappy
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
    marginRatio: number,
    subAccountId: number = 0,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const [user] = this.getUser(fund, subAccountId);

    const tx = await this.base.program.methods
      .driftUpdateUserCustomMarginRatio(subAccountId, marginRatio)
      .accounts({
        fund,
        user,
        //@ts-ignore IDL ts type is unhappy
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
        //@ts-ignore IDL ts type is unhappy
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
        //@ts-ignore IDL ts type is unhappy
        manager,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  /**
   * @param marketIndex SOL spot market index is 1
   * TODO: fetch accounts according to marketIndex
   */
  public async depositTx(
    fund: PublicKey,
    amount: anchor.BN,
    marketIndex: number = 1,
    subAccountId: number = 0,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    if (marketIndex !== 1) {
      throw new Error("Only SOL spot market index is supported for now");
    }

    const manager = apiOptions.signer || this.base.getManager();

    const [user, userStats] = this.getUser(fund, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const tx = await this.base.program.methods
      .driftDeposit(marketIndex, amount)
      .accounts({
        fund,
        treasuryAta: this.base.getTreasuryAta(fund, WSOL),
        driftAta: ACCOUNTS_FOR_DEPOSIT_WITHDRAW.SOL.spotMarketVault,
        user,
        userStats,
        state,
        manager,
      })
      .remainingAccounts(ACCOUNTS_FOR_DEPOSIT_WITHDRAW.SOL.remainingAccounts)
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
    if (marketIndex !== 1) {
      throw new Error("Only SOL spot market index is supported for now");
    }

    const manager = apiOptions.signer || this.base.getManager();

    const [user, userStats] = this.getUser(fund, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const tx = await this.base.program.methods
      .driftWithdraw(marketIndex, amount)
      .accounts({
        fund,
        treasuryAta: this.base.getTreasuryAta(fund, WSOL),
        driftAta: ACCOUNTS_FOR_DEPOSIT_WITHDRAW.SOL.spotMarketVault,
        user,
        userStats,
        state,
        manager,
        driftSigner: DRIFT_VAULT,
      })
      .remainingAccounts(ACCOUNTS_FOR_DEPOSIT_WITHDRAW.SOL.remainingAccounts)
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  public async placeOrdersTx(
    fund: PublicKey,
    orderParams: OrderParams[],
    subAccountId: number = 0,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();

    const [user, userStats] = this.getUser(fund, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const tx = await this.base.program.methods
      .driftPlaceOrders(orderParams)
      .accounts({
        fund,
        user,
        state,
        manager,
      })
      .remainingAccounts(remainingAccountsForOrders)
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
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();

    const [user, userStats] = this.getUser(fund, subAccountId);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    const tx = await this.base.program.methods
      .driftCancelOrders(marketType, marketIndex, direction)
      .accounts({
        fund,
        user,
        state,
        manager,
      })
      .remainingAccounts(remainingAccountsForOrders)
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }
}
