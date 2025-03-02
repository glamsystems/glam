import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  ParsedAccountData,
  TransactionSignature,
  StakeProgram,
  SYSVAR_CLOCK_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Marinade } from "@marinade.finance/marinade-ts-sdk";

import { BaseClient, TxOptions } from "./base";
import { MARINADE_PROGRAM_ID, MSOL } from "../constants";

const TICKET_SIZE = 88;

export type Ticket = {
  address: PublicKey; // offset 8 after anchor discriminator
  lamports: number;
  createdEpoch: number;
  isDue: boolean;
  isClaimable: boolean; // >30min since the start of the current epoch
};

export class MarinadeClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async deposit(
    statePda: PublicKey,
    amount: BN,
  ): Promise<TransactionSignature> {
    const tx = await this.depositTx(statePda, amount, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async depositStakeAccount(
    statePda: PublicKey,
    stakeAccount: PublicKey,
  ): Promise<TransactionSignature> {
    const tx = await this.depositStakeAccountTx(statePda, stakeAccount, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async liquidUnstake(
    statePda: PublicKey,
    amount: BN,
  ): Promise<TransactionSignature> {
    const tx = await this.liquidUnstakeTx(statePda, amount, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async orderUnstake(
    statePda: PublicKey,
    amount: BN,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.orderUnstakeTx(statePda, amount, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  public async claim(
    statePda: PublicKey,
    tickets: PublicKey[],
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.claimTx(statePda, tickets, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * Utils
   */

  _getTicketsAccounts = async (state: PublicKey) =>
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

  async getTickets(state: PublicKey): Promise<PublicKey[]> {
    const accounts = await this._getTicketsAccounts(state);
    return accounts.map((a) => a.pubkey);
  }

  async getParsedTickets(state: PublicKey): Promise<Ticket[]> {
    const accounts = await this._getTicketsAccounts(state);

    const currentEpoch = await this.base.provider.connection.getEpochInfo();
    return accounts.map((a) => {
      const lamports = Number((a.account.data as Buffer).readBigInt64LE(72));
      const createdEpoch = Number(
        (a.account.data as Buffer).readBigInt64LE(80),
      );
      const isDue = currentEpoch.epoch > createdEpoch;
      return {
        address: a.pubkey,
        lamports,
        createdEpoch,
        isDue,
        isClaimable: isDue && currentEpoch.slotIndex > 5000, // 5000 slots ~= 33.3 minutes
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

  public async depositTx(
    glamState: PublicKey,
    amount: BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(glamState);
    const marinadeState = this.getMarinadeState();
    const vaultMsolAta = this.base.getAta(marinadeState.msolMintAddress, vault);

    const createMsolAtaIx = createAssociatedTokenAccountIdempotentInstruction(
      glamSigner,
      vaultMsolAta,
      vault,
      marinadeState.msolMintAddress,
    );

    const tx = await this.base.program.methods
      .marinadeDeposit(amount)
      .accounts({
        glamState,
        glamSigner,
        reservePda: marinadeState.reserveAddress,
        state: marinadeState.marinadeStateAddress,
        msolMint: marinadeState.msolMintAddress,
        msolMintAuthority: marinadeState.mSolMintAuthority,
        liqPoolMsolLeg: marinadeState.msolLeg,
        liqPoolMsolLegAuthority: marinadeState.msolLegAuthority,
        liqPoolSolLegPda: marinadeState.solLeg,
        mintTo: vaultMsolAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions([createMsolAtaIx])
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async depositStakeAccountTx(
    glamState: PublicKey,
    stakeAccount: PublicKey,
    txOptions: TxOptions,
  ): Promise<any> {
    const glamSigner = txOptions.signer || this.base.getSigner();

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
      .marinadeDepositStakeAccount(validatorIndex)
      .accounts({
        glamState,
        glamSigner,
        state: marinadeState.marinadeStateAddress,
        validatorList:
          marinadeState.state.validatorSystem.validatorList.account,
        stakeList: marinadeState.state.stakeSystem.stakeList.account,
        stakeAccount,
        duplicationFlag,
        msolMint: MSOL,
        msolMintAuthority: await marinadeState.mSolMintAuthority(),
        mintTo: this.base.getVaultAta(glamState, MSOL),
        clock: SYSVAR_CLOCK_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        stakeProgram: StakeProgram.programId,
      })
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async orderUnstakeTx(
    glamState: PublicKey,
    amount: BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const marinadeState = this.getMarinadeState();
    const vaultMsolAta = this.base.getVaultAta(
      glamState,
      marinadeState.msolMintAddress,
    );

    const ticketSeed = Date.now().toString();
    const ticket = await PublicKey.createWithSeed(
      glamSigner,
      ticketSeed,
      MARINADE_PROGRAM_ID,
    );
    const lamports =
      await this.base.provider.connection.getMinimumBalanceForRentExemption(
        TICKET_SIZE,
      );
    const createTicketIx = SystemProgram.createAccountWithSeed({
      fromPubkey: glamSigner,
      newAccountPubkey: ticket,
      basePubkey: glamSigner,
      seed: ticketSeed,
      lamports,
      space: TICKET_SIZE,
      programId: MARINADE_PROGRAM_ID,
    });
    const tx = await this.base.program.methods
      .marinadeOrderUnstake(amount)
      .accounts({
        glamState,
        glamSigner,
        newTicketAccount: ticket,
        msolMint: marinadeState.msolMintAddress,
        burnMsolFrom: vaultMsolAta,
        state: marinadeState.marinadeStateAddress,
        clock: SYSVAR_CLOCK_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions([createTicketIx])
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async claimTx(
    glamState: PublicKey,
    tickets: PublicKey[],
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    if (tickets.length < 1) {
      throw new Error("At least one ticket is required");
    }

    const glamSigner = txOptions.signer || this.base.getSigner();
    const marinadeState = this.getMarinadeState();

    const tx = await this.base.program.methods
      .marinadeClaim()
      .accounts({
        glamState,
        glamSigner,
        ticketAccount: tickets[0],
        state: marinadeState.marinadeStateAddress,
        reservePda: marinadeState.reserveAddress,
        clock: SYSVAR_CLOCK_PUBKEY,
      })
      .remainingAccounts(
        tickets
          .slice(1)
          .map((t) => ({ pubkey: t, isSigner: false, isWritable: true })),
      )
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }

  public async liquidUnstakeTx(
    glamState: PublicKey,
    amount: BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const glamSigner = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(glamState);
    const marinadeState = this.getMarinadeState();
    const vaultMsolAta = this.base.getAta(marinadeState.msolMintAddress, vault);

    const tx = await this.base.program.methods
      .marinadeLiquidUnstake(amount)
      .accounts({
        glamState,
        glamSigner,
        state: marinadeState.marinadeStateAddress,
        msolMint: marinadeState.msolMintAddress,
        liqPoolSolLegPda: marinadeState.solLeg,
        liqPoolMsolLeg: marinadeState.msolLeg,
        getMsolFrom: vaultMsolAta,
        treasuryMsolAccount: marinadeState.treasuryMsolAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .transaction();

    return await this.base.intoVersionedTransaction(tx, txOptions);
  }
}
