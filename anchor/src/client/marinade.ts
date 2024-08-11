import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  ParsedAccountData,
  TransactionSignature,
  StakeProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Marinade } from "@marinade.finance/marinade-ts-sdk";

import { BaseClient, ApiTxOptions } from "./base";
import { MARINADE_PROGRAM_ID, MSOL } from "../constants";

export class MarinadeClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async depositSol(
    fund: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const tx = await this.depositSolTx(fund, amount, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async depositStake(
    fund: PublicKey,
    stakeAccount: PublicKey
  ): Promise<TransactionSignature> {
    const tx = await this.depositStakeTx(fund, stakeAccount, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async liquidUnstake(
    fund: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const tx = await this.liquidUnstakeTx(fund, amount, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async delayedUnstake(
    fund: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    const tx = await this.delayedUnstakeTx(fund, amount, {});
    return await this.base.sendAndConfirm(tx);
  }

  public async claimTickets(
    fund: PublicKey,
    tickets: PublicKey[]
  ): Promise<TransactionSignature> {
    const tx = await this.claimTicketsTx(fund, tickets, {});
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * Utils
   */

  getMarinadeTicketPDA(
    fundPDA: PublicKey,
    ticketId: string
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("ticket"), Buffer.from(ticketId), fundPDA.toBuffer()],
      this.base.programId
    );
  }

  async getExistingTickets(fundPDA: PublicKey): Promise<PublicKey[]> {
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
                bytes: this.base.getTreasuryPDA(fundPDA).toBase58(),
              },
            },
          ],
        }
      );
    return accounts.map((a) => a.pubkey);
  }

  getMarinadeState(): any {
    // The addresses are the same in mainnet and devnet:
    // https://docs.marinade.finance/developers/contract-addresses
    // TODO: use marinade.getMarinadeState(); ?
    return {
      marinadeStateAddress: new PublicKey(
        "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC"
      ),
      msolMintAddress: MSOL,
      treasuryMsolAccount: new PublicKey(
        "B1aLzaNMeFVAyQ6f3XbbUyKcH2YPHu2fqiEagmiF23VR"
      ),
      reserveAddress: new PublicKey(
        "Du3Ysj1wKbxPKkuPPnvzQLQh8oMSVifs3jGZjJWXFmHN"
      ),
      mSolMintAuthority: new PublicKey(
        "3JLPCS1qM2zRw3Dp6V4hZnYHd4toMNPkNesXdX9tg6KM"
      ),
      msolLeg: new PublicKey("7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE"),
      msolLegAuthority: new PublicKey(
        "EyaSjUtSgo9aRD1f8LWXwdvkpDTmXAW54yoSHZRF14WL"
      ),
      solLeg: new PublicKey("UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q"),
    };
  }

  async getParsedStakeAccountInfo(stakeAccount: PublicKey): Promise<any> {
    const { value: stakeAccountInfo } =
      await this.base.provider.connection.getParsedAccountInfo(stakeAccount);
    if (!stakeAccountInfo) {
      throw new Error(
        `Failed to find the stake account ${stakeAccount.toBase58()}`
      );
    }

    if (!stakeAccountInfo.owner.equals(StakeProgram.programId)) {
      throw new Error(
        `${stakeAccount.toBase58()} is not a stake account because owner is ${
          stakeAccountInfo.owner
        }`
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
        } != 200`
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
    fund: PublicKey,
    amount: BN,
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);
    const marinadeState = this.getMarinadeState();
    const treasuryMsolAta = getAssociatedTokenAddressSync(
      marinadeState.msolMintAddress,
      treasury,
      true
    );

    const tx = await this.base.program.methods
      .marinadeDepositSol(amount)
      .accounts({
        fund,
        treasury,
        manager,
        reservePda: marinadeState.reserveAddress,
        marinadeState: marinadeState.marinadeStateAddress,
        msolMint: marinadeState.msolMintAddress,
        msolMintAuthority: marinadeState.mSolMintAuthority,
        liqPoolMsolLeg: marinadeState.msolLeg,
        liqPoolMsolLegAuthority: marinadeState.msolLegAuthority,
        liqPoolSolLegPda: marinadeState.solLeg,
        mintTo: treasuryMsolAta,
        marinadeProgram: MARINADE_PROGRAM_ID,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  public async depositStakeTx(
    fund: PublicKey,
    stakeAccount: PublicKey,
    apiOptions: ApiTxOptions
  ): Promise<any> {
    const manager = apiOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);

    const stakeAccountInfo = await this.getParsedStakeAccountInfo(stakeAccount);
    console.log("Stake account info", stakeAccountInfo);

    const marinadeState = await new Marinade().getMarinadeState();
    const { validatorRecords } = await marinadeState.getValidatorRecords();
    const validatorLookupIndex = validatorRecords.findIndex(
      ({ validatorAccount }) => validatorAccount.equals(stakeAccountInfo.voter)
    );
    const validatorIndex =
      validatorLookupIndex === -1
        ? marinadeState.state.validatorSystem.validatorList.count
        : validatorLookupIndex;

    const duplicationFlag = await marinadeState.validatorDuplicationFlag(
      stakeAccountInfo.voter
    );

    const tx = await this.base.program.methods
      .marinadeDepositStake(validatorIndex)
      .accounts({
        fund,
        treasury,
        manager,
        marinadeState: marinadeState.marinadeStateAddress,
        validatorList:
          marinadeState.state.validatorSystem.validatorList.account,
        stakeList: marinadeState.state.stakeSystem.stakeList.account,
        treasuryStakeAccount: stakeAccount,
        duplicationFlag,
        msolMint: MSOL,
        msolMintAuthority: await marinadeState.mSolMintAuthority(),
        mintTo: this.base.getTreasuryAta(fund, MSOL),
        marinadeProgram: MARINADE_PROGRAM_ID,
        clock: SYSVAR_CLOCK_PUBKEY,
        rent: SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
        stakeProgram: StakeProgram.programId,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  public async delayedUnstakeTx(
    fund: PublicKey,
    amount: BN,
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const ticketId = Date.now().toString();
    const [ticket, bump] = this.getMarinadeTicketPDA(fund, ticketId);
    const treasury = this.base.getTreasuryPDA(fund);
    const marinadeState = this.getMarinadeState();
    const treasuryMsolAta = this.base.getTreasuryAta(
      fund,
      marinadeState.msolMintAddress
    );

    console.log(`Ticket ${ticketId}`, ticket.toBase58());

    const tx = await this.base.program.methods
      .marinadeDelayedUnstake(amount, ticketId, bump)
      .accounts({
        fund,
        treasury,
        manager,
        ticket,
        msolMint: marinadeState.msolMintAddress,
        burnMsolFrom: treasuryMsolAta,
        marinadeState: marinadeState.marinadeStateAddress,
        reservePda: marinadeState.reserveAddress,
        marinadeProgram: MARINADE_PROGRAM_ID,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  public async claimTicketsTx(
    fund: PublicKey,
    tickets: PublicKey[],
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);
    const marinadeState = this.getMarinadeState();

    const tx = await this.base.program.methods
      .marinadeClaimTickets()
      .accounts({
        fund,
        treasury,
        manager,
        marinadeState: marinadeState.marinadeStateAddress,
        reservePda: marinadeState.reserveAddress,
        marinadeProgram: MARINADE_PROGRAM_ID,
      })
      .remainingAccounts(
        tickets.map((t) => ({ pubkey: t, isSigner: false, isWritable: true }))
      )
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }

  public async liquidUnstakeTx(
    fund: PublicKey,
    amount: BN,
    apiOptions: ApiTxOptions
  ): Promise<VersionedTransaction> {
    const manager = apiOptions.signer || this.base.getManager();
    const treasury = this.base.getTreasuryPDA(fund);
    const marinadeState = this.getMarinadeState();
    const treasuryMsolAta = getAssociatedTokenAddressSync(
      marinadeState.msolMintAddress,
      treasury,
      true
    );

    const tx = await this.base.program.methods
      .marinadeLiquidUnstake(amount)
      .accounts({
        fund,
        treasury,
        manager,
        marinadeState: marinadeState.marinadeStateAddress,
        msolMint: marinadeState.msolMintAddress,
        liqPoolSolLegPda: marinadeState.solLeg,
        liqPoolMsolLeg: marinadeState.msolLeg,
        getMsolFrom: treasuryMsolAta,
        getMsolFromAuthority: treasury,
        treasuryMsolAccount: marinadeState.treasuryMsolAccount,
        marinadeProgram: MARINADE_PROGRAM_ID,
      })
      .transaction();

    return await this.base.intoVersionedTransaction({
      tx,
      ...apiOptions,
    });
  }
}
