import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
  StakeProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_STAKE_HISTORY_PUBKEY,
  STAKE_CONFIG_ID,
} from "@solana/web3.js";

import { BaseClient, ApiTxOptions } from "./base";
import { getStakePoolAccount } from "@solana/spl-stake-pool";

interface StakePoolAccountData {
  programId: PublicKey;
  withdrawAuthority: PublicKey;
  poolMint: PublicKey;
  feeAccount: PublicKey;
  reserveStake: PublicKey;
  tokenProgramId: PublicKey;
  validatorList: PublicKey;
}

export class StakingClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async stakePoolDepositSol(
    fund: PublicKey,
    stakePool: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const tx = await this.stakePoolDepositSolTx(fund, stakePool, amount);
    return await this.base.sendAndConfirm(tx);
  }

  public async stakePoolWithdrawStake(
    fund: PublicKey,
    stakePool: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const tx = await this.stakePoolWithdrawStakeTx(fund, stakePool, amount);
    return await this.base.sendAndConfirm(tx);
  }

  public async nativeStakeDeposit(
    fund: PublicKey,
    vote: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const tx = await this.nativeStakeDepositTx(fund, vote, amount);
    return await this.base.sendAndConfirm(tx);
  }

  public async deactivateStakeAccounts(
    fund: PublicKey,
    stakeAccounts: PublicKey[]
  ): Promise<TransactionSignature> {
    const tx = await this.deactivateStakeAccountsTx(fund, stakeAccounts);
    return await this.base.sendAndConfirm(tx);
  }

  public async withdrawFromStakeAccounts(
    fund: PublicKey,
    stakeAccounts: PublicKey[]
  ): Promise<TransactionSignature> {
    const tx = await this.withdrawFromStakeAccountsTx(fund, stakeAccounts);
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * Utils
   */

  getStakeAccountPDA(
    fundPDA: PublicKey,
    accountId: string
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("stake_account"),
        Buffer.from(accountId),
        fundPDA.toBuffer(),
      ],
      this.base.programId
    );
  }

  getStakePoolWithdrawAuthority(programId: PublicKey, stakePool: PublicKey) {
    const [publicKey] = PublicKey.findProgramAddressSync(
      [stakePool.toBuffer(), Buffer.from("withdraw")],
      programId
    );
    return publicKey;
  }

  async getStakeAccounts(withdrawAuthority: PublicKey): Promise<PublicKey[]> {
    const STAKE_ACCOUNT_SIZE = 200;
    const accounts =
      await this.base.provider.connection.getParsedProgramAccounts(
        StakeProgram.programId,
        {
          filters: [
            {
              dataSize: STAKE_ACCOUNT_SIZE,
            },
            {
              memcmp: {
                offset: 12,
                bytes: withdrawAuthority.toBase58(),
              },
            },
          ],
        }
      );
    // order by lamports desc
    return accounts
      .sort((a, b) => b.account.lamports - a.account.lamports)
      .map((a) => a.pubkey);
  }

  async getStakePoolAccountData(
    stakePool: PublicKey
  ): Promise<StakePoolAccountData> {
    // Get stake pool account data
    const stakePoolAccount = await getStakePoolAccount(
      this.base.provider.connection,
      stakePool
    );
    const stakePoolAccountData = stakePoolAccount.account.data;
    const stakePoolProgramId = stakePoolAccount.account.owner;
    const stakePoolWithdrawAuthority = this.getStakePoolWithdrawAuthority(
      stakePoolProgramId,
      stakePool
    );

    return {
      programId: stakePoolProgramId,
      withdrawAuthority: stakePoolWithdrawAuthority,
      poolMint: stakePoolAccountData.poolMint,
      feeAccount: stakePoolAccountData.managerFeeAccount,
      reserveStake: stakePoolAccountData.reserveStake,
      tokenProgramId: stakePoolAccountData.tokenProgramId,
      validatorList: stakePoolAccountData.validatorList,
    };
  }

  /*
   * API methods
   */

  public async stakePoolDepositSolTx(
    fund: PublicKey,
    stakePool: PublicKey,
    amount: BN,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);
    const {
      programId: stakePoolProgram,
      poolMint,
      withdrawAuthority,
      feeAccount,
      tokenProgramId: tokenProgram,
      reserveStake,
    } = await this.getStakePoolAccountData(stakePool);

    console.log(`stakePool ${stakePool}, programId: ${stakePoolProgram}`);

    const tx = await this.base.program.methods
      .stakePoolDeposit(amount)
      .accounts({
        manager,
        fund,
        treasury,
        mintTo: this.base.getTreasuryAta(fund, poolMint),
        stakePoolProgram,
        stakePool,
        poolMint: poolMint,
        reserveStake,
        withdrawAuthority,
        feeAccount,
        tokenProgram, // TODO: glam program instruction currently doesn't support token2022
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  public async stakePoolWithdrawStakeTx(
    fund: PublicKey,
    stakePool: PublicKey,
    amount: BN,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);
    const {
      programId: stakePoolProgram,
      poolMint,
      withdrawAuthority,
      feeAccount,
      tokenProgramId: tokenProgram,
      validatorList,
    } = await this.getStakePoolAccountData(stakePool);

    const validatorStakeAccounts = await this.getStakeAccounts(
      withdrawAuthority
    );

    console.log("withdrawAuthority:", withdrawAuthority);
    console.log("validatorStakeAccounts:", validatorStakeAccounts);

    const stakeAccountId = Date.now().toString();
    const [stakeAccountPda, bump] = this.getStakeAccountPDA(
      fund,
      stakeAccountId
    );
    const tx = await this.base.program.methods
      .stakePoolWithdrawStake(amount, stakeAccountId, bump)
      .accounts({
        manager,
        fund,
        treasury,
        treasuryStakeAccount: stakeAccountPda,
        stakePoolProgram,
        stakePool,
        poolMint,
        poolTokenAta: this.base.getTreasuryAta(fund, poolMint),
        validatorList,
        validatorStakeAccount: validatorStakeAccounts[0],
        withdrawAuthority,
        feeAccount,
        clock: SYSVAR_CLOCK_PUBKEY,
        stakeProgram: StakeProgram.programId,
        tokenProgram,
      })
      .transaction();
    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  public async nativeStakeDepositTx(
    fund: PublicKey,
    vote: PublicKey,
    amount: BN,
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);
    const stakeAccountId = Date.now().toString();
    const [stakeAccountPda, bump] = this.getStakeAccountPDA(
      fund,
      stakeAccountId
    );
    const tx = await this.base.program.methods
      .nativeStakeDeposit(amount, stakeAccountId, bump)
      .accounts({
        manager,
        fund,
        treasury,
        treasuryStakeAccount: stakeAccountPda,
        vote,
        stakeConfig: STAKE_CONFIG_ID,
        stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
        stakeProgram: StakeProgram.programId,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  public async deactivateStakeAccountsTx(
    fund: PublicKey,
    stakeAccounts: PublicKey[],
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);
    const tx = await this.base.program.methods
      .deactivateStakeAccounts()
      .accounts({
        manager,
        fund,
        treasury,
        clock: SYSVAR_CLOCK_PUBKEY,
        stakeProgram: StakeProgram.programId,
      })
      .remainingAccounts(
        stakeAccounts.map((a) => ({
          pubkey: a,
          isSigner: false,
          isWritable: true,
        }))
      )
      .transaction();
    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  public async withdrawFromStakeAccountsTx(
    fund: PublicKey,
    stakeAccounts: PublicKey[],
    apiOptions: ApiTxOptions = {}
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);
    const tx = await this.base.program.methods
      .withdrawFromStakeAccounts()
      .accounts({
        manager,
        fund,
        treasury,
        clock: SYSVAR_CLOCK_PUBKEY,
        stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
        stakeProgram: StakeProgram.programId,
      })
      .remainingAccounts(
        stakeAccounts.map((a) => ({
          pubkey: a,
          isSigner: false,
          isWritable: true,
        }))
      )
      .transaction();
    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }
}
