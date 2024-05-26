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
    fund: PublicKey
  ): Promise<TransactionSignature> {
    return await this.delayedUnstakeClaimTxBuilder(
      fund,
      this.base.getManager()
    ).rpc();
  }

  /*
   * Utils
   */

  getMarinadeTicketPDA(fundPDA: PublicKey): PublicKey {
    const [pda, _bump] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("ticket"), fundPDA.toBuffer()],
      this.base.programId
    );
    return pda;
  }

  getMarinadeState(): any {
    // The addresses are the same in mainnet and devnet:
    // https://docs.marinade.finance/developers/contract-addresses
    // TODO: use marinade.getMarinadeState(); ?
    return {
      mSolMintAddress: new PublicKey(
        "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"
      ),
      marinadeStateAddress: new PublicKey(
        "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC"
      ),
      reserveAddress: new PublicKey(
        "Du3Ysj1wKbxPKkuPPnvzQLQh8oMSVifs3jGZjJWXFmHN"
      ),
      mSolMintAuthority: new PublicKey(
        "3JLPCS1qM2zRw3Dp6V4hZnYHd4toMNPkNesXdX9tg6KM"
      ),
      mSolLeg: new PublicKey("7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE"),
      mSolLegAuthority: new PublicKey(
        "EyaSjUtSgo9aRD1f8LWXwdvkpDTmXAW54yoSHZRF14WL"
      ),
      solLeg: new PublicKey("UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q")
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
    const ticket = this.getMarinadeTicketPDA(fund);
    const marinadeState = this.getMarinadeState();
    const treasuryMSolAta = getAssociatedTokenAddressSync(
      marinadeState.mSolMintAddress,
      treasury,
      true
    );
    return this.base.program.methods.marinadeDeposit(amount).accounts({
      fund,
      treasury,
      manager,
      reservePda: marinadeState.reserveAddress,
      marinadeState: marinadeState.marinadeStateAddress,
      msolMint: marinadeState.mSolMintAddress,
      msolMintAuthority: marinadeState.mSolMintAuthority,
      liqPoolMsolLeg: marinadeState.mSolLeg,
      liqPoolMsolLegAuthority: marinadeState.mSolLegAuthority,
      liqPoolSolLegPda: marinadeState.solLeg,
      mintTo: treasuryMSolAta,
      marinadeProgram
    });
  }

  delayedUnstakeTxBuilder(
    fund: PublicKey,
    manager: PublicKey,
    amount: BN
  ): any /* MethodsBuilder<Glam, ?> */ {
    const treasury = this.base.getTreasuryPDA(fund);
    const ticket = this.getMarinadeTicketPDA(fund);
    const marinadeState = this.getMarinadeState();
    const treasuryMSolAta = getAssociatedTokenAddressSync(
      marinadeState.mSolMintAddress,
      treasury,
      true
    );
    return this.base.program.methods.marinadeDelayedUnstake(amount).accounts({
      fund,
      treasury,
      manager,
      ticket,
      msolMint: marinadeState.mSolMintAddress,
      burnMsolFrom: treasuryMSolAta,
      marinadeState: marinadeState.marinadeStateAddress,
      reservePda: marinadeState.reserveAddress,
      marinadeProgram
    });
  }

  delayedUnstakeClaimTxBuilder(
    fund: PublicKey,
    manager: PublicKey
  ): any /* MethodsBuilder<Glam, ?> */ {
    const treasury = this.base.getTreasuryPDA(fund);
    const ticket = this.getMarinadeTicketPDA(fund);
    const marinadeState = this.getMarinadeState();

    return this.base.program.methods.marinadeClaim().accounts({
      fund,
      treasury,
      manager,
      ticket,
      marinadeState: marinadeState.marinadeStateAddress,
      reservePda: marinadeState.reserveAddress,
      marinadeProgram
    });
  }

  /*
   * API methods
   */

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
    manager: PublicKey
  ): Promise<Transaction> {
    return await this.delayedUnstakeClaimTxBuilder(fund, manager).transaction();
  }
}
