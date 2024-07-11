import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
  StakeProgram,
  SYSVAR_CLOCK_PUBKEY,
} from "@solana/web3.js";

import { BaseClient, ApiTxOptions } from "./base";
import {
  getStakePoolAccount,
  STAKE_POOL_PROGRAM_ID,
} from "@solana/spl-stake-pool";

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

  public async depositSol(
    fund: PublicKey,
    stakePool: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const tx = await this.depositSolTx(fund, stakePool, amount, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async withdrawStake(
    fund: PublicKey,
    stakePool: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const tx = await this.withdrawStakeTx(fund, stakePool, amount, {});
    return await this.base.sendAndConfirm(tx);
  }

  // public async deactivateStakeAccounts(
  //   fund: PublicKey,
  //   stakeAccounts: PublicKey[]
  // ): Promise<TransactionSignature> {
  //   const tx = await this.delayedUnstakeClaimTx(fund, stakeAccounts, {});
  //   return await this.base.sendAndConfirm(tx);
  // }

  // public async withdrawFromStakeAccounts(
  //   fund: PublicKey,
  //   stakeAccounts: PublicKey[]
  // ): Promise<TransactionSignature> {
  //   const tx = await this.liquidUnstakeTx(fund, amount, {});
  //   return await this.base.sendAndConfirm(tx);
  // }

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

  async getStakeAccounts(withdrawAuthority: PublicKey): Promise<PublicKey[]> {
    const accounts =
      await this.base.provider.connection.getParsedProgramAccounts(
        StakeProgram.programId,
        {
          filters: [
            {
              dataSize: 200,
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
    const stakePoolWithdrawAuthority = this.getStakePoolWithdrawAuthorityPDA(
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

  getStakePoolWithdrawAuthorityPDA(
    programId: PublicKey,
    stakePoolAddress: PublicKey
  ) {
    const [publicKey] = PublicKey.findProgramAddressSync(
      [stakePoolAddress.toBuffer(), Buffer.from("withdraw")],
      programId
    );
    return publicKey;
  }

  /*
   * API methods
   */

  public async depositSolTx(
    fund: PublicKey,
    stakePool: PublicKey,
    amount: BN,
    apiOptions: ApiTxOptions
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

  public async withdrawStakeTx(
    fund: PublicKey,
    stakePool: PublicKey,
    amount: BN,
    apiOptions: ApiTxOptions
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

    console.log("validatorStakeAccounts:", validatorStakeAccounts);

    const stakeAccountId = Date.now().toString();
    const [stakeAccountPda, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("stake_account"),
        Buffer.from(stakeAccountId),
        fund.toBuffer(),
      ],
      this.base.program.programId
    );
    const tx = await this.base.program.methods
      .stakePoolWithdrawStake(amount, bump, stakeAccountId)
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
        sysvarClock: SYSVAR_CLOCK_PUBKEY,
        nativeStakeProgram: StakeProgram.programId,
        tokenProgram,
      })
      .transaction();
    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  public async withdrawSolTx() {}
}
