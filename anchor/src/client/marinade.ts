import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, Transaction, TransactionSignature } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import { BaseClient } from "./base";

const marinadeProgram = new PublicKey(
  "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
);

export class MarinadeClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async stake(
    fund: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    return await this.stakeTxBuilder(
      fund,
      this.base.getManager(),
      amount
    ).rpc();
  }

  public async delayedUnstake(
    fund: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    return await this.delayedUnstakeTxBuilder(
      fund,
      this.base.getManager(),
      amount
    ).rpc();
  }

  public async delayedUnstakeClaim(
    fund: PublicKey,
    ticket: PublicKey
  ): Promise<TransactionSignature> {
    return await this.delayedUnstakeClaimTxBuilder(
      fund,
      this.base.getManager(),
      ticket
    ).rpc();
  }

  public async liquidUnstake(
    fund: PublicKey,
    amount: BN
  ): Promise<TransactionSignature> {
    return await this.liquidUnstakeTxBuilder(
      fund,
      this.base.getManager(),
      amount
    ).rpc();
  }

  /*
   * Utils
   */

  getMarinadeTicketPDA(
    fundPDA: PublicKey,
    ticketId: string
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("ticket"),
        anchor.utils.bytes.utf8.encode(ticketId),
        fundPDA.toBuffer(),
      ],
      this.base.programId
    );
  }

  async getExistingTickets(fundPDA: PublicKey): Promise<PublicKey[]> {
    const accounts =
      await this.base.provider.connection.getParsedProgramAccounts(
        marinadeProgram,
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
      msolMintAddress: new PublicKey(
        "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"
      ),
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

  /*
   * Tx Builders
   */

  stakeTxBuilder(
    fund: PublicKey,
    manager: PublicKey,
    amount: BN
  ): any /* MethodsBuilder<Glam, ?> */ {
    const treasury = this.base.getTreasuryPDA(fund);
    const marinadeState = this.getMarinadeState();
    const treasuryMsolAta = getAssociatedTokenAddressSync(
      marinadeState.msolMintAddress,
      treasury,
      true
    );
    return this.base.program.methods.marinadeDeposit(amount).accounts({
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
      marinadeProgram,
    });
  }

  delayedUnstakeTxBuilder(
    fund: PublicKey,
    manager: PublicKey,
    amount: BN
  ): any /* MethodsBuilder<Glam, ?> */ {
    // Use timestamp as ticket ID
    const ticketId = Date.now().toString();
    const [ticket, bump] = this.getMarinadeTicketPDA(fund, ticketId);

    const treasury = this.base.getTreasuryPDA(fund);
    const marinadeState = this.getMarinadeState();
    const treasuryMsolAta = this.base.getTreasuryAta(
      fund,
      marinadeState.msolMintAddress
    );

    console.log(`Ticket ${ticketId}`, ticket.toBase58());

    return this.base.program.methods
      .marinadeDelayedUnstake(amount, bump, ticketId)
      .accounts({
        fund,
        treasury,
        manager,
        ticket,
        msolMint: marinadeState.msolMintAddress,
        burnMsolFrom: treasuryMsolAta,
        marinadeState: marinadeState.marinadeStateAddress,
        reservePda: marinadeState.reserveAddress,
        marinadeProgram,
      });
  }

  delayedUnstakeClaimTxBuilder(
    fund: PublicKey,
    manager: PublicKey,
    ticket: PublicKey
  ): any /* MethodsBuilder<Glam, ?> */ {
    const treasury = this.base.getTreasuryPDA(fund);
    const marinadeState = this.getMarinadeState();
    return this.base.program.methods.marinadeClaim().accounts({
      fund,
      treasury,
      manager,
      ticket,
      marinadeState: marinadeState.marinadeStateAddress,
      reservePda: marinadeState.reserveAddress,
      marinadeProgram,
    });
  }

  liquidUnstakeTxBuilder(
    fund: PublicKey,
    manager: PublicKey,
    amount: BN
  ): any /* MethodsBuilder<Glam, ?> */ {
    const treasury = this.base.getTreasuryPDA(fund);
    const marinadeState = this.getMarinadeState();
    const treasuryMsolAta = getAssociatedTokenAddressSync(
      marinadeState.msolMintAddress,
      treasury,
      true
    );
    return this.base.program.methods.marinadeLiquidUnstake(amount).accounts({
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
      marinadeProgram,
    });
  }

  /*
   * API methods
   */

  public async stakeTx(
    fund: PublicKey,
    manager: PublicKey,
    amount: BN
  ): Promise<Transaction> {
    return await this.stakeTxBuilder(fund, manager, amount).transaction();
  }

  public async delayedUnstakeTx(
    fund: PublicKey,
    manager: PublicKey,
    amount: BN
  ): Promise<Transaction> {
    return await this.delayedUnstakeTxBuilder(
      fund,
      manager,
      amount
    ).transaction();
  }

  public async delayedUnstakeClaimTx(
    fund: PublicKey,
    manager: PublicKey,
    ticket: PublicKey
  ): Promise<Transaction> {
    return await this.delayedUnstakeClaimTxBuilder(
      fund,
      manager,
      ticket
    ).transaction();
  }
}
