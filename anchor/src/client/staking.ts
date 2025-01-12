import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
  StakeProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_STAKE_HISTORY_PUBKEY,
  STAKE_CONFIG_ID,
  ParsedAccountData,
} from "@solana/web3.js";
import { MSOL } from "../constants";
import { BaseClient, TxOptions } from "./base";
import { MarinadeClient } from "./marinade";
import { getStakePoolAccount } from "@solana/spl-stake-pool";

interface StakePoolAccountData {
  programId: PublicKey;
  depositAuthority: PublicKey;
  withdrawAuthority: PublicKey;
  poolMint: PublicKey;
  feeAccount: PublicKey;
  reserveStake: PublicKey;
  tokenProgramId: PublicKey;
  validatorList: PublicKey;
}

type StakeAccountInfo = {
  address: PublicKey;
  lamports: number;
  state: string;
  voter?: PublicKey; // if undefined, the stake account is not delegated
};

export class StakingClient {
  public constructor(
    readonly base: BaseClient,
    readonly marinade: MarinadeClient,
  ) {}

  /*
   * High-level API methods
   */
  public async unstake(
    fund: PublicKey,
    asset: PublicKey,
    amount: number | BN,
    txOptions: TxOptions = {} as TxOptions,
  ): Promise<TransactionSignature> {
    const assetStr = asset.toBase58();

    let tx;
    if (assetStr === MSOL.toBase58()) {
      // Marinade
      tx = await this.marinade.delayedUnstakeTx(
        fund,
        new BN(amount),
        txOptions,
      );
    } else {
      // Other LSTs
      const assetMeta = this.base.getAssetMeta(assetStr);
      if (!assetMeta || !assetMeta.stateAccount) {
        throw new Error("Invalid LST: " + asset);
      }
      tx = await this.stakePoolWithdrawStakeTx(
        fund,
        assetMeta.stateAccount,
        new BN(amount),
        true,
        txOptions,
      );
    }
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * Client methods
   */

  public async stakePoolDepositSol(
    fund: PublicKey,
    stakePool: PublicKey,
    amount: BN,
  ): Promise<TransactionSignature> {
    const tx = await this.stakePoolDepositSolTx(fund, stakePool, amount);
    return await this.base.sendAndConfirm(tx);
  }

  public async stakePoolDepositStake(
    fund: PublicKey,
    stakePool: PublicKey,
    stakeAccount: PublicKey,
  ): Promise<TransactionSignature> {
    const tx = await this.stakePoolDepositStakeTx(
      fund,
      stakePool,
      stakeAccount,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async stakePoolWithdrawStake(
    fund: PublicKey,
    stakePool: PublicKey,
    amount: BN,
  ): Promise<TransactionSignature> {
    const tx = await this.stakePoolWithdrawStakeTx(fund, stakePool, amount);
    return await this.base.sendAndConfirm(tx);
  }

  public async initializeAndDelegateStake(
    fund: PublicKey,
    vote: PublicKey,
    amount: BN,
  ): Promise<TransactionSignature> {
    const tx = await this.initializeAndDelegateStakeTx(fund, vote, amount);
    return await this.base.sendAndConfirm(tx);
  }

  public async deactivateStakeAccounts(
    fund: PublicKey,
    stakeAccounts: PublicKey[],
  ): Promise<TransactionSignature> {
    const tx = await this.deactivateStakeAccountsTx(fund, stakeAccounts);
    return await this.base.sendAndConfirm(tx);
  }

  public async withdrawFromStakeAccounts(
    fund: PublicKey,
    stakeAccounts: PublicKey[],
  ): Promise<TransactionSignature> {
    const tx = await this.withdrawFromStakeAccountsTx(fund, stakeAccounts);
    return await this.base.sendAndConfirm(tx);
  }

  public async mergeStakeAccounts(
    fund: PublicKey,
    toStake: PublicKey,
    fromStake: PublicKey,
  ): Promise<TransactionSignature> {
    const tx = await this.mergeStakeAccountsTx(fund, toStake, fromStake);
    return await this.base.sendAndConfirm(tx);
  }

  public async splitStakeAccount(
    fund: PublicKey,
    existingStake: PublicKey,
    lamports: BN,
  ): Promise<{ newStake: PublicKey; txSig: TransactionSignature }> {
    const newStakeAccountId = Date.now().toString();
    const [newStake, bump] = this.getStakeAccountPda(fund, newStakeAccountId);
    const tx = await this.splitStakeAccountTx(
      fund,
      existingStake,
      lamports,
      newStake,
      newStakeAccountId,
      bump,
    );
    return { newStake, txSig: await this.base.sendAndConfirm(tx) };
  }

  public async redelegateStake(
    fund: PublicKey,
    existingStake: PublicKey,
    vote: PublicKey,
  ): Promise<{ newStake: PublicKey; txSig: TransactionSignature }> {
    const newStakeAccountId = Date.now().toString();
    const [newStake, bump] = this.getStakeAccountPda(fund, newStakeAccountId);
    const tx = await this.redelegateStakeTx(
      fund,
      existingStake,
      vote,
      newStake,
      newStakeAccountId,
      bump,
    );
    return { newStake, txSig: await this.base.sendAndConfirm(tx) };
  }

  /*
   * Utils
   */

  getStakeAccountPda(
    fundPDA: PublicKey,
    accountId: string,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("stake_account"),
        Buffer.from(accountId),
        fundPDA.toBuffer(),
      ],
      this.base.program.programId,
    );
  }

  getStakePoolWithdrawAuthority(programId: PublicKey, stakePool: PublicKey) {
    const [publicKey] = PublicKey.findProgramAddressSync(
      [stakePool.toBuffer(), Buffer.from("withdraw")],
      programId,
    );
    return publicKey;
  }

  getStakePoolDepositAuthority(
    programId: PublicKey,
    stakePool: PublicKey,
  ): PublicKey {
    const [publicKey] = PublicKey.findProgramAddressSync(
      [stakePool.toBuffer(), Buffer.from("deposit")],
      programId,
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
        },
      );
    // order by lamports desc
    return accounts
      .sort((a, b) => b.account.lamports - a.account.lamports)
      .map((a) => a.pubkey);
  }

  async getStakeAccountsWithStates(
    withdrawAuthority: PublicKey,
  ): Promise<StakeAccountInfo[]> {
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
        },
      );

    const epochInfo = await this.base.provider.connection.getEpochInfo();
    const stakes = await Promise.all(
      accounts.map(async (account) => {
        const delegation = (account.account.data as ParsedAccountData).parsed
          .info.stake?.delegation;

        let state = "undelegated";

        if (!delegation) {
          return {
            address: account.pubkey,
            lamports: account.account.lamports,
            state,
          };
        }

        // possible state if delegated: active, inactive, activating, deactivating
        const { activationEpoch, deactivationEpoch, voter } = delegation;
        if (activationEpoch == epochInfo.epoch) {
          state = "activating";
        } else if (deactivationEpoch == epochInfo.epoch) {
          state = "deactivating";
        } else if (epochInfo.epoch > deactivationEpoch) {
          state = "inactive";
        } else if (epochInfo.epoch > activationEpoch) {
          state = "active";
        }

        return {
          address: account.pubkey,
          lamports: account.account.lamports,
          voter: new PublicKey(voter),
          state,
        };
      }),
    );

    // order by lamports desc
    return stakes.sort((a, b) => b.lamports - a.lamports);
  }

  async getStakeAccountVoter(
    stakeAccount: PublicKey,
  ): Promise<PublicKey | null> {
    const connection = this.base.provider.connection;
    const accountInfo = await connection.getParsedAccountInfo(stakeAccount);
    if (!accountInfo || !accountInfo.value) {
      console.warn("No account info found:", stakeAccount.toBase58());
      return null;
    }

    const delegation = (accountInfo.value.data as ParsedAccountData).parsed.info
      .stake?.delegation;
    if (!delegation) {
      console.warn("No delegation found:", stakeAccount.toBase58());
      return null;
    }

    const { voter } = delegation;
    return new PublicKey(voter);
  }

  async getStakePoolAccountData(
    stakePool: PublicKey,
  ): Promise<StakePoolAccountData> {
    // Get stake pool account data
    const stakePoolAccount = await getStakePoolAccount(
      this.base.provider.connection,
      stakePool,
    );
    const stakePoolAccountData = stakePoolAccount.account.data;
    const stakePoolProgramId = stakePoolAccount.account.owner;
    const stakePoolWithdrawAuthority = this.getStakePoolWithdrawAuthority(
      stakePoolProgramId,
      stakePool,
    );
    const stakePoolDepositAuthority = this.getStakePoolDepositAuthority(
      stakePoolProgramId,
      stakePool,
    );

    return {
      programId: stakePoolProgramId,
      depositAuthority: stakePoolDepositAuthority,
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
    state: PublicKey,
    stakePool: PublicKey,
    amount: BN,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(state);
    const {
      programId: stakePoolProgram,
      poolMint,
      withdrawAuthority,
      feeAccount,
      tokenProgramId: tokenProgram,
      reserveStake,
    } = await this.getStakePoolAccountData(stakePool);

    console.log(`stakePool ${stakePool}, programId: ${stakePoolProgram}`);

    // @ts-ignore
    const tx = await this.base.program.methods
      .stakePoolDepositSol(amount)
      .accountsPartial({
        signer,
        state,
        vault,
        mintTo: this.base.getVaultAta(state, poolMint),
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
      ...txOptions,
    });
  }

  public async stakePoolDepositStakeTx(
    state: PublicKey,
    stakePool: PublicKey,
    stakeAccount: PublicKey,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(state);
    const {
      programId: stakePoolProgram,
      poolMint,
      depositAuthority,
      withdrawAuthority,
      feeAccount,
      validatorList,
      tokenProgramId: tokenProgram,
      reserveStake,
    } = await this.getStakePoolAccountData(stakePool);

    // All stake accounts owned by the stake pool withdraw authority
    const validatorStakeCandidates =
      await this.getStakeAccountsWithStates(withdrawAuthority);

    // Find a validator stake account to use from the list of candidates.
    // The vault stake account must have the same vote address as the chosen validator stake account.
    const vote = await this.getStakeAccountVoter(stakeAccount);
    if (!vote) {
      throw new Error(
        "Stake account is undelegated. Cannot be deposited to the pool.",
      );
    }

    const validatorStakeAccount = validatorStakeCandidates.find(
      (s) => s.voter && s.voter.equals(vote),
    )?.address;
    if (!validatorStakeAccount) {
      throw new Error("Stake account cannot be deposited to the pool");
    }

    const tx = await this.base.program.methods
      .stakePoolDepositStake()
      .accountsPartial({
        signer,
        state,
        vault,
        vaultStakeAccount: stakeAccount,
        mintTo: this.base.getVaultAta(state, poolMint),
        poolMint,
        feeAccount,
        stakePool,
        depositAuthority,
        withdrawAuthority,
        validatorList,
        validatorStakeAccount,
        reserveStakeAccount: reserveStake,
        stakePoolProgram,
        clock: SYSVAR_CLOCK_PUBKEY,
        stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
        tokenProgram,
        stakeProgram: StakeProgram.programId,
      })
      .transaction();
    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async stakePoolWithdrawStakeTx(
    state: PublicKey,
    stakePool: PublicKey,
    amount: BN,
    deactivate: boolean = false,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(state);
    const {
      programId: stakePoolProgram,
      poolMint,
      withdrawAuthority,
      feeAccount,
      tokenProgramId: tokenProgram,
      validatorList,
      reserveStake,
    } = await this.getStakePoolAccountData(stakePool);

    // The reserve stake account should NOT be used for withdrawals unless we have no other options.
    const validatorStakeCandidates = (
      await this.getStakeAccountsWithStates(withdrawAuthority)
    ).filter((s) => !s.address.equals(reserveStake));
    console.log("validatorStakeCandidates", validatorStakeCandidates);
    const validatorStakeAccount =
      validatorStakeCandidates.length === 0
        ? reserveStake
        : validatorStakeCandidates[0].address;

    const stakeAccountId = Date.now().toString();
    const [stakeAccountPda, bump] = this.getStakeAccountPda(
      state,
      stakeAccountId,
    );

    const postInstructions = deactivate
      ? [
          await this.base.program.methods
            .deactivateStakeAccounts()
            .accountsPartial({
              signer,
              state,
              vault,
              clock: SYSVAR_CLOCK_PUBKEY,
              stakeProgram: StakeProgram.programId,
            })
            .remainingAccounts([
              {
                pubkey: stakeAccountPda,
                isSigner: false,
                isWritable: true,
              },
            ])
            .instruction(),
        ]
      : [];

    const tx = await this.base.program.methods
      .stakePoolWithdrawStake(amount, stakeAccountId, bump)
      .accountsPartial({
        signer,
        state,
        vault,
        vaultStakeAccount: stakeAccountPda,
        stakePoolProgram,
        stakePool,
        poolMint,
        poolTokenAta: this.base.getVaultAta(state, poolMint),
        validatorList,
        validatorStakeAccount,
        withdrawAuthority,
        feeAccount,
        clock: SYSVAR_CLOCK_PUBKEY,
        stakeProgram: StakeProgram.programId,
        tokenProgram,
      })
      .postInstructions(postInstructions)
      .transaction();
    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async initializeAndDelegateStakeTx(
    fund: PublicKey,
    vote: PublicKey,
    amount: BN,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(fund);
    const stakeAccountId = Date.now().toString();
    const [stakeAccountPda, bump] = this.getStakeAccountPda(
      fund,
      stakeAccountId,
    );
    const tx = await this.base.program.methods
      .initializeAndDelegateStake(amount, stakeAccountId, bump)
      .accountsPartial({
        signer,
        state: fund,
        vault,
        vaultStakeAccount: stakeAccountPda,
        vote,
        stakeConfig: STAKE_CONFIG_ID,
        stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
        stakeProgram: StakeProgram.programId,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async deactivateStakeAccountsTx(
    fund: PublicKey,
    stakeAccounts: PublicKey[],
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(fund);
    const tx = await this.base.program.methods
      .deactivateStakeAccounts()
      .accountsPartial({
        signer,
        state: fund,
        vault,
        clock: SYSVAR_CLOCK_PUBKEY,
        stakeProgram: StakeProgram.programId,
      })
      .remainingAccounts(
        stakeAccounts.map((a) => ({
          pubkey: a,
          isSigner: false,
          isWritable: true,
        })),
      )
      .transaction();
    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async withdrawFromStakeAccountsTx(
    fund: PublicKey,
    stakeAccounts: PublicKey[],
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(fund);
    const tx = await this.base.program.methods
      .withdrawFromStakeAccounts()
      .accountsPartial({
        signer,
        state: fund,
        vault,
        clock: SYSVAR_CLOCK_PUBKEY,
        stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
        stakeProgram: StakeProgram.programId,
      })
      .remainingAccounts(
        stakeAccounts.map((a) => ({
          pubkey: a,
          isSigner: false,
          isWritable: true,
        })),
      )
      .transaction();
    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async mergeStakeAccountsTx(
    fund: PublicKey,
    toStake: PublicKey,
    fromStake: PublicKey,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(fund);
    const tx = await this.base.program.methods
      .mergeStakeAccounts()
      .accountsPartial({
        signer,
        state: fund,
        vault,
        toStake,
        fromStake,
        stakeProgram: StakeProgram.programId,
        stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
      })
      .transaction();
    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async splitStakeAccountTx(
    state: PublicKey,
    existingStake: PublicKey,
    lamports: BN,
    newStake: PublicKey,
    newStakeAccountId: string,
    newStakeAccountBump: number,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(state);

    const tx = await this.base.program.methods
      .splitStakeAccount(lamports, newStakeAccountId, newStakeAccountBump)
      .accountsPartial({
        signer,
        state,
        vault,
        existingStake,
        newStake,
        stakeProgram: StakeProgram.programId,
      })
      .transaction();
    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async redelegateStakeTx(
    fund: PublicKey,
    existingStake: PublicKey,
    vote: PublicKey,
    newStake: PublicKey,
    newStakeAccountId: string,
    newStakeAccountBump: number,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(fund);

    const tx = await this.base.program.methods
      .redelegateStake(newStakeAccountId, newStakeAccountBump)
      .accountsPartial({
        signer,
        state: fund,
        vault,
        vote,
        existingStake,
        newStake,
        stakeProgram: StakeProgram.programId,
        stakeConfig: STAKE_CONFIG_ID,
      })
      .transaction();
    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }
}
