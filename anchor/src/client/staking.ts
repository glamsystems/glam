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
  SystemProgram,
  TransactionInstruction,
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

const STAKE_ACCOUNT_SIZE = 200;

export class StakingClient {
  public constructor(
    readonly base: BaseClient,
    readonly marinade: MarinadeClient,
  ) {}

  /*
   * High-level API methods
   */
  public async unstake(
    glamState: PublicKey,
    asset: PublicKey,
    amount: number | BN,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const assetStr = asset.toBase58();

    let tx;
    if (assetStr === MSOL.toBase58()) {
      // Marinade
      tx = await this.marinade.orderUnstakeTx(
        glamState,
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
        glamState,
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
    glamState: PublicKey,
    stakePool: PublicKey,
    amount: BN,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.stakePoolDepositSolTx(glamState, stakePool, amount);
    return await this.base.sendAndConfirm(tx);
  }

  public async stakePoolDepositStake(
    glamState: PublicKey,
    stakePool: PublicKey,
    stakeAccount: PublicKey,
  ): Promise<TransactionSignature> {
    const tx = await this.stakePoolDepositStakeTx(
      glamState,
      stakePool,
      stakeAccount,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async stakePoolWithdrawStake(
    glamState: PublicKey,
    stakePool: PublicKey,
    amount: BN,
  ): Promise<TransactionSignature> {
    const tx = await this.stakePoolWithdrawStakeTx(
      glamState,
      stakePool,
      amount,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async initializeAndDelegateStake(
    glamState: PublicKey,
    vote: PublicKey,
    amount: BN,
  ): Promise<TransactionSignature> {
    const tx = await this.initializeAndDelegateStakeTx(glamState, vote, amount);
    return await this.base.sendAndConfirm(tx);
  }

  public async deactivateStakeAccounts(
    glamState: PublicKey,
    stakeAccounts: PublicKey[],
  ): Promise<TransactionSignature> {
    const tx = await this.deactivateStakeAccountsTx(glamState, stakeAccounts);
    return await this.base.sendAndConfirm(tx);
  }

  public async withdrawFromStakeAccounts(
    glamState: PublicKey,
    stakeAccounts: PublicKey[],
  ): Promise<TransactionSignature> {
    const tx = await this.withdrawFromStakeAccountsTx(glamState, stakeAccounts);
    return await this.base.sendAndConfirm(tx);
  }

  public async mergeStakeAccounts(
    glamState: PublicKey,
    toStake: PublicKey,
    fromStake: PublicKey,
  ): Promise<TransactionSignature> {
    const tx = await this.mergeStakeAccountsTx(glamState, toStake, fromStake);
    return await this.base.sendAndConfirm(tx);
  }

  public async splitStakeAccount(
    glamState: PublicKey,
    existingStake: PublicKey,
    lamports: BN,
  ): Promise<{ newStake: PublicKey; txSig: TransactionSignature }> {
    const { tx, newStake } = await this.splitStakeAccountTx(
      glamState,
      existingStake,
      lamports,
    );
    const txSig = await this.base.sendAndConfirm(tx);
    return { newStake, txSig };
  }

  public async redelegateStake(
    glamState: PublicKey,
    existingStake: PublicKey,
    vote: PublicKey,
  ): Promise<{ newStake: PublicKey; txSig: TransactionSignature }> {
    const { newStake, tx } = await this.redelegateStakeTx(
      glamState,
      existingStake,
      vote,
    );
    const txSig = await this.base.sendAndConfirm(tx);
    return { newStake, txSig };
  }

  /*
   * Utils
   */

  getStakeAccountPda(state: PublicKey, accountId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("stake_account"), Buffer.from(accountId), state.toBuffer()],
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

  async createStakeAccount(
    signer: PublicKey,
  ): Promise<[PublicKey, TransactionInstruction]> {
    const seed = Date.now().toString();
    const stakeAccount = await PublicKey.createWithSeed(
      signer,
      seed,
      StakeProgram.programId,
    );
    const lamports =
      await this.base.provider.connection.getMinimumBalanceForRentExemption(
        STAKE_ACCOUNT_SIZE,
      );
    const createStakeAccountIx = SystemProgram.createAccountWithSeed({
      fromPubkey: signer,
      newAccountPubkey: stakeAccount,
      basePubkey: signer,
      seed,
      lamports,
      space: STAKE_ACCOUNT_SIZE,
      programId: StakeProgram.programId,
    });

    return [stakeAccount, createStakeAccountIx];
  }

  /*
   * API methods
   */

  public async stakePoolDepositSolTx(
    glamState: PublicKey,
    stakePool: PublicKey,
    amount: BN,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const glamVault = this.base.getVaultPda(glamState);
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
      .stakePoolDepositSol(amount)
      .accountsPartial({
        glamSigner,
        glamState,
        glamVault,
        mintTo: this.base.getVaultAta(glamState, poolMint),
        stakePoolProgram,
        stakePool,
        poolMint: poolMint,
        reserveStake,
        withdrawAuthority,
        feeAccount,
        tokenProgram, // TODO: glam program instruction currently doesn't support token2022
      })
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async stakePoolDepositStakeTx(
    glamState: PublicKey,
    stakePool: PublicKey,
    stakeAccount: PublicKey,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const glamVault = this.base.getVaultPda(glamState);
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
        glamSigner,
        glamState,
        glamVault,
        vaultStakeAccount: stakeAccount,
        mintTo: this.base.getVaultAta(glamState, poolMint),
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

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async stakePoolWithdrawStakeTx(
    glamState: PublicKey,
    stakePool: PublicKey,
    amount: BN,
    deactivate: boolean = false,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const glamVault = this.base.getVaultPda(glamState);
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

    const [stakeAccount, createStakeAccountIx] =
      await this.createStakeAccount(glamSigner);

    const postInstructions = deactivate
      ? [
          await this.base.program.methods
            .deactivateStakeAccounts()
            .accountsPartial({
              glamSigner,
              glamState,
              glamVault,
              clock: SYSVAR_CLOCK_PUBKEY,
              stakeProgram: StakeProgram.programId,
            })
            .remainingAccounts([
              {
                pubkey: stakeAccount,
                isSigner: false,
                isWritable: true,
              },
            ])
            .instruction(),
        ]
      : [];

    const tx = await this.base.program.methods
      .stakePoolWithdrawStake(amount)
      .accountsPartial({
        glamSigner,
        glamState,
        glamVault,
        vaultStakeAccount: stakeAccount,
        stakePoolProgram,
        stakePool,
        poolMint,
        poolTokenAta: this.base.getVaultAta(glamState, poolMint),
        validatorList,
        validatorStakeAccount,
        withdrawAuthority,
        feeAccount,
        clock: SYSVAR_CLOCK_PUBKEY,
        stakeProgram: StakeProgram.programId,
        tokenProgram,
      })
      .preInstructions([createStakeAccountIx])
      .postInstructions(postInstructions)
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async initializeAndDelegateStakeTx(
    glamState: PublicKey,
    vote: PublicKey,
    amount: BN,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const glamVault = this.base.getVaultPda(glamState);
    const [stakeAccount, createStakeAccountIx] =
      await this.createStakeAccount(glamSigner);

    const tx = await this.base.program.methods
      .initializeAndDelegateStake(amount)
      .accountsPartial({
        glamState,
        glamSigner,
        glamVault,
        vaultStakeAccount: stakeAccount,
        vote,
        stakeConfig: STAKE_CONFIG_ID,
        stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
        stakeProgram: StakeProgram.programId,
      })
      .preInstructions([createStakeAccountIx])
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async deactivateStakeAccountsTx(
    glamState: PublicKey,
    stakeAccounts: PublicKey[],
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const glamVault = this.base.getVaultPda(glamState);
    const tx = await this.base.program.methods
      .deactivateStakeAccounts()
      .accountsPartial({
        glamState,
        glamSigner,
        glamVault,
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

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async withdrawFromStakeAccountsTx(
    glamState: PublicKey,
    stakeAccounts: PublicKey[],
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const glamVault = this.base.getVaultPda(glamState);
    const tx = await this.base.program.methods
      .withdrawFromStakeAccounts()
      .accountsPartial({
        glamSigner,
        glamState,
        glamVault,
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

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async mergeStakeAccountsTx(
    glamState: PublicKey,
    toStake: PublicKey,
    fromStake: PublicKey,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const glamVault = this.base.getVaultPda(glamState);
    const tx = await this.base.program.methods
      .mergeStakeAccounts()
      .accountsPartial({
        glamSigner,
        glamState,
        glamVault,
        toStake,
        fromStake,
        stakeProgram: StakeProgram.programId,
        stakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
      })
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async splitStakeAccountTx(
    glamState: PublicKey,
    existingStake: PublicKey,
    lamports: BN,
    txOptions: TxOptions = {},
  ) {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const glamVault = this.base.getVaultPda(glamState);
    const [newStake, createStakeAccountIx] =
      await this.createStakeAccount(glamSigner);

    const tx = await this.base.program.methods
      .splitStakeAccount(lamports)
      .accountsPartial({
        glamSigner,
        glamState,
        glamVault,
        existingStake,
        newStake,
        stakeProgram: StakeProgram.programId,
      })
      .preInstructions([createStakeAccountIx])
      .transaction();
    const vTx = await this.base.intoVersionedTransaction(tx, txOptions);

    return { tx: vTx, newStake };
  }

  public async redelegateStakeTx(
    glamState: PublicKey,
    existingStake: PublicKey,
    vote: PublicKey,
    txOptions: TxOptions = {},
  ) {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const glamVault = this.base.getVaultPda(glamState);
    const [newStake, createStakeAccountIx] =
      await this.createStakeAccount(glamSigner);

    const tx = await this.base.program.methods
      .redelegateStake()
      .accountsPartial({
        glamSigner,
        glamState,
        glamVault,
        vote,
        existingStake,
        newStake,
        stakeProgram: StakeProgram.programId,
        stakeConfig: STAKE_CONFIG_ID,
      })
      .preInstructions([createStakeAccountIx])
      .transaction();
    const vTx = await this.base.intoVersionedTransaction(tx, txOptions);

    return { tx: vTx, newStake };
  }
}
