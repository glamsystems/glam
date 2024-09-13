import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
} from "@solana/web3.js";
import {
  DRIFT_PROGRAM_ID,
  getDriftStateAccountPublicKey,
  getUserAccountPublicKey,
  getUserStatsAccountPublicKey,
} from "@drift-labs/sdk";

import { BaseClient, ApiTxOptions } from "./base";

export class DriftClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async initialize(fund: PublicKey): Promise<TransactionSignature> {
    const tx = await this.initializeTx(fund, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async updateUserCustomMarginRatio(
    fund: PublicKey,
    subAccountId: number,
    marginRatio: number
  ): Promise<TransactionSignature> {
    const tx = await this.updateUserCustomMarginRatioTx(
      fund,
      subAccountId,
      marginRatio,
      {}
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async updateUserMarginTradingEnabled(
    fund: PublicKey,
    subAccountId: number,
    marginTradingEnabled: boolean
  ): Promise<TransactionSignature> {
    const tx = await this.updateUserMarginTradingEnabledTx(
      fund,
      subAccountId,
      marginTradingEnabled,
      {}
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async updateUserDelegate(
    fund: PublicKey,
    subAccountId: number,
    delegate: PublicKey
  ): Promise<TransactionSignature> {
    const tx = await this.updateUserDelegateTx(
      fund,
      subAccountId,
      delegate,
      {}
    );
    return await this.base.sendAndConfirm(tx);
  }

  /*
  public async deposit(
    fund: PublicKey,
    subAccountId: number,
    amount: BN
  ): Promise<TransactionSignature> {
    const tx = await this.depositTx(fund, subAccountId, amount, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async withdraw(
    fund: PublicKey,
    subAccountId: number,
    amount: BN
  ): Promise<TransactionSignature> {
    const tx = await this.withdrawTx(fund, subAccountId, amount, {});
    return await this.base.sendAndConfirm(tx);
  }
  */

  /*
   * Utils
   */

  DRIFT_PROGRAM = new PublicKey(DRIFT_PROGRAM_ID);

  public async getUser(fund: PublicKey): Promise<PublicKey[]> {
    const treasury = this.base.getTreasuryPDA(fund);
    return [
      await await getUserAccountPublicKey(this.DRIFT_PROGRAM, treasury, 0),
      await getUserStatsAccountPublicKey(this.DRIFT_PROGRAM, treasury),
    ];
  }

  public async getUserStats(fund: PublicKey): Promise<PublicKey> {
    const treasury = this.base.getTreasuryPDA(fund);
    return await await getUserAccountPublicKey(this.DRIFT_PROGRAM, treasury, 0);
  }

  /*
   * API methods
   */

  public async initializeTx(
    fund: PublicKey,
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();

    const [user, userStats] = await this.getUser(fund);
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
    subAccountId: number,
    marginRatio: number,
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const [user] = await this.getUser(fund);

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
    subAccountId: number,
    marginTradingEnabled: boolean,
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const [user] = await this.getUser(fund);

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
    subAccountId: number,
    delegate: PublicKey,
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const [user] = await this.getUser(fund);

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

  /*
  public async depositTx(
    fund: PublicKey,
    subAccountId: number,
    amount: BN,
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);

    const [user, userStats] = await this.getUser(fund);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    //TODO
    const tx = await this.base.program.methods
      .driftDeposit(subAccountId, amount)
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

  public async withdrawTx(
    fund: PublicKey,
    subAccountId: number,
    amount: BN,
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);

    const [user, userStats] = await this.getUser(fund);
    const state = await getDriftStateAccountPublicKey(this.DRIFT_PROGRAM);

    //TODO
    const tx = await this.base.program.methods
      .driftWithdraw(subAccountId, amount)
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
  */
}
