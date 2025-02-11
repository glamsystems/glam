import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  ParsedAccountData,
  TransactionSignature,
  StakeProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Marinade } from "@marinade.finance/marinade-ts-sdk";

import { BaseClient, TxOptions } from "./base";
import { MARINADE_PROGRAM_ID, MSOL } from "../constants";

const TICKET_SIZE = 88;

export class MarinadeClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async depositSol(
    statePda: PublicKey,
    amount: BN,
  ): Promise<TransactionSignature> {
    const tx = await this.depositSolTx(statePda, amount, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async depositStake(
    statePda: PublicKey,
    stakeAccount: PublicKey,
  ): Promise<TransactionSignature> {
    const tx = await this.depositStakeTx(statePda, stakeAccount, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async liquidUnstake(
    statePda: PublicKey,
    amount: BN,
  ): Promise<TransactionSignature> {
    const tx = await this.liquidUnstakeTx(statePda, amount, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async delayedUnstake(
    statePda: PublicKey,
    amount: BN,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.delayedUnstakeTx(statePda, amount, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  public async claimTickets(
    statePda: PublicKey,
    tickets: PublicKey[],
  ): Promise<TransactionSignature> {
    const tx = await this.claimTicketsTx(statePda, tickets, {});
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * Utils
   */
  async getExistingTickets(state: PublicKey): Promise<PublicKey[]> {
    const accounts =
      await this.base.provider.connection.getParsedProgramAccounts(
        MARINADE_PROGRAM_ID,
        {
          filters: [
            {
              dataSize: 88,
            },
            {
              memcmp: {
                offset: 40,
                bytes: this.base.getVaultPda(state).toBase58(),
              },
            },
          ],
        },
      );
    return accounts.map((a) => a.pubkey);
  }

  async getTickets(state: PublicKey): Promise<
    {
      address: PublicKey;
      lamports: number;
      createdEpoch: number;
      isDue: boolean;
    }[]
  > {
    // TicketAccount {
    //   stateAddress: web3.PublicKey; // offset 8
    //   beneficiary: web3.PublicKey;  // offset 40
    //   lamportsAmount: BN;           // offset 72
    //   createdEpoch: BN;
    // }
    const accounts =
      await this.base.provider.connection.getParsedProgramAccounts(
        MARINADE_PROGRAM_ID,
        {
          filters: [
            {
              dataSize: TICKET_SIZE,
            },
            {
              memcmp: {
                offset: 40,
                bytes: this.base.getVaultPda(state).toBase58(),
              },
            },
          ],
        },
      );
    const currentEpoch = await this.base.provider.connection.getEpochInfo();
    return accounts.map((a) => {
      const lamports = Number((a.account.data as Buffer).readBigInt64LE(72));
      const createdEpoch = Number(
        (a.account.data as Buffer).readBigInt64LE(80),
      );
      return {
        address: a.pubkey,
        lamports,
        createdEpoch,
        isDue: currentEpoch.epoch > createdEpoch,
      };
    });
  }

  getMarinadeState() {
    // The addresses are the same in mainnet and devnet:
    // https://docs.marinade.finance/developers/contract-addresses
    // TODO: use marinade.getMarinadeState(); ?
    return {
      marinadeStateAddress: new PublicKey(
        "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC",
      ),
      msolMintAddress: MSOL,
      treasuryMsolAccount: new PublicKey(
        "B1aLzaNMeFVAyQ6f3XbbUyKcH2YPHu2fqiEagmiF23VR",
      ),
      reserveAddress: new PublicKey(
        "Du3Ysj1wKbxPKkuPPnvzQLQh8oMSVifs3jGZjJWXFmHN",
      ),
      mSolMintAuthority: new PublicKey(
        "3JLPCS1qM2zRw3Dp6V4hZnYHd4toMNPkNesXdX9tg6KM",
      ),
      msolLeg: new PublicKey("7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE"),
      msolLegAuthority: new PublicKey(
        "EyaSjUtSgo9aRD1f8LWXwdvkpDTmXAW54yoSHZRF14WL",
      ),
      solLeg: new PublicKey("UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q"),
    };
  }

  async getParsedStakeAccountInfo(stakeAccount: PublicKey): Promise<any> {
    const { value: stakeAccountInfo } =
      await this.base.provider.connection.getParsedAccountInfo(stakeAccount);
    if (!stakeAccountInfo) {
      throw new Error(
        `Failed to find the stake account ${stakeAccount.toBase58()}`,
      );
    }

    if (!stakeAccountInfo.owner.equals(StakeProgram.programId)) {
      throw new Error(
        `${stakeAccount.toBase58()} is not a stake account because owner is ${
          stakeAccountInfo.owner
        }`,
      );
    }

    const parsedData = stakeAccountInfo?.data as ParsedAccountData;
    const balanceLamports = stakeAccountInfo.lamports;
    const stakedLamports =
      parsedData?.parsed?.info?.stake?.delegation?.stake ?? null;

    if (parsedData.space != 200) {
      throw new Error(
        `${stakeAccount.toBase58()} is not a stake account because space is ${
          parsedData.space
        } != 200`,
      );
    }

    return {
      voter: new PublicKey(parsedData.parsed.info?.stake?.delegation?.voter),
      balanceLamports,
      stakedLamports,
    };
  }

  /*
   * API methods
   */

  public async depositSolTx(
    statePda: PublicKey,
    amount: BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(statePda);
    const marinadeState = this.getMarinadeState();
    const vaultMsolAta = this.base.getAta(marinadeState.msolMintAddress, vault);

    const tx = await this.base.program.methods
      .marinadeDepositSol(amount)
      .accountsPartial({
        state: statePda,
        vault,
        signer,
        reservePda: marinadeState.reserveAddress,
        marinadeState: marinadeState.marinadeStateAddress,
        msolMint: marinadeState.msolMintAddress,
        msolMintAuthority: marinadeState.mSolMintAuthority,
        liqPoolMsolLeg: marinadeState.msolLeg,
        liqPoolMsolLegAuthority: marinadeState.msolLegAuthority,
        liqPoolSolLegPda: marinadeState.solLeg,
        mintTo: vaultMsolAta,
        marinadeProgram: MARINADE_PROGRAM_ID,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async depositStakeTx(
    statePda: PublicKey,
    stakeAccount: PublicKey,
    txOptions: TxOptions,
  ): Promise<any> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(statePda);

    const stakeAccountInfo = await this.getParsedStakeAccountInfo(stakeAccount);
    console.log("Stake account info", stakeAccountInfo);

    const marinadeState = await new Marinade().getMarinadeState();
    const { validatorRecords } = await marinadeState.getValidatorRecords();
    const validatorLookupIndex = validatorRecords.findIndex(
      ({ validatorAccount }) => validatorAccount.equals(stakeAccountInfo.voter),
    );
    const validatorIndex =
      validatorLookupIndex === -1
        ? marinadeState.state.validatorSystem.validatorList.count
        : validatorLookupIndex;

    const duplicationFlag = await marinadeState.validatorDuplicationFlag(
      stakeAccountInfo.voter,
    );

    const tx = await this.base.program.methods
      .marinadeDepositStake(validatorIndex)
      .accountsPartial({
        state: statePda,
        vault,
        signer,
        marinadeState: marinadeState.marinadeStateAddress,
        validatorList:
          marinadeState.state.validatorSystem.validatorList.account,
        stakeList: marinadeState.state.stakeSystem.stakeList.account,
        vaultStakeAccount: stakeAccount,
        duplicationFlag,
        msolMint: MSOL,
        msolMintAuthority: await marinadeState.mSolMintAuthority(),
        mintTo: this.base.getVaultAta(statePda, MSOL),
        marinadeProgram: MARINADE_PROGRAM_ID,
        clock: SYSVAR_CLOCK_PUBKEY,
        rent: SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        stakeProgram: StakeProgram.programId,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async delayedUnstakeTx(
    state: PublicKey,
    amount: BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(state);
    const marinadeState = this.getMarinadeState();
    const vaultMsolAta = this.base.getVaultAta(
      state,
      marinadeState.msolMintAddress,
    );

    const ticketSeed = Date.now().toString();
    const ticket = await PublicKey.createWithSeed(
      signer,
      ticketSeed,
      MARINADE_PROGRAM_ID,
    );
    const lamports =
      await this.base.provider.connection.getMinimumBalanceForRentExemption(
        TICKET_SIZE,
      );
    const createTicketIx = SystemProgram.createAccountWithSeed({
      fromPubkey: signer,
      newAccountPubkey: ticket,
      basePubkey: signer,
      seed: ticketSeed,
      lamports,
      space: TICKET_SIZE,
      programId: MARINADE_PROGRAM_ID,
    });
    const tx = await this.base.program.methods
      .marinadeDelayedUnstake(amount)
      .accountsPartial({
        state,
        vault,
        signer,
        ticket,
        msolMint: marinadeState.msolMintAddress,
        burnMsolFrom: vaultMsolAta,
        marinadeState: marinadeState.marinadeStateAddress,
        reservePda: marinadeState.reserveAddress,
        marinadeProgram: MARINADE_PROGRAM_ID,
      })
      .preInstructions([createTicketIx])
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async claimTicketsTx(
    state: PublicKey,
    tickets: PublicKey[],
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(state);
    const marinadeState = this.getMarinadeState();

    const tx = await this.base.program.methods
      .marinadeClaimTickets()
      .accountsPartial({
        state,
        vault,
        signer,
        marinadeState: marinadeState.marinadeStateAddress,
        reservePda: marinadeState.reserveAddress,
        marinadeProgram: MARINADE_PROGRAM_ID,
      })
      .remainingAccounts(
        tickets.map((t) => ({ pubkey: t, isSigner: false, isWritable: true })),
      )
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  public async liquidUnstakeTx(
    statePda: PublicKey,
    amount: BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(statePda);
    const marinadeState = this.getMarinadeState();
    const vaultMsolAta = this.base.getAta(marinadeState.msolMintAddress, vault);

    const tx = await this.base.program.methods
      .marinadeLiquidUnstake(amount)
      .accountsPartial({
        state: statePda,
        vault,
        signer,
        marinadeState: marinadeState.marinadeStateAddress,
        msolMint: marinadeState.msolMintAddress,
        liqPoolSolLegPda: marinadeState.solLeg,
        liqPoolMsolLeg: marinadeState.msolLeg,
        getMsolFrom: vaultMsolAta,
        getMsolFromAuthority: vault,
        treasuryMsolAccount: marinadeState.treasuryMsolAccount,
        marinadeProgram: MARINADE_PROGRAM_ID,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }
}
