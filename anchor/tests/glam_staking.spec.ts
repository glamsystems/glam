import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import { Glam } from "../target/types/glam";
import { createFundForTest, sleep } from "./setup";
import { PublicKey } from "@solana/web3.js";
import { Marinade, MarinadeConfig } from "@marinade.finance/marinade-ts-sdk";
import { getOrCreateAssociatedTokenAccount } from "@marinade.finance/marinade-ts-sdk/dist/src/util";

describe("glam_staking", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const manager = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.Glam as Program<Glam>;

  let fundPDA, treasuryPDA, sharePDA;

  // marinade setup
  const marinadeProgram = new PublicKey(
    "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
  );
  const marinadeTreasuryMsol = new PublicKey(
    "B1aLzaNMeFVAyQ6f3XbbUyKcH2YPHu2fqiEagmiF23VR"
  );
  const config = new MarinadeConfig({
    connection: provider.connection,
    publicKey: manager.publicKey
  });
  const marinade = new Marinade(config);
  let marinadeState;
  let treasurymSolAta;
  let ticketPda, ticketBump;

  beforeAll(async () => {
    marinadeState = await marinade.getMarinadeState();
  });

  it("Create fund", async () => {
    const fundData = await createFundForTest();
    fundPDA = fundData.fundPDA;
    treasuryPDA = fundData.treasuryPDA;
    sharePDA = fundData.sharePDA;

    const fund = await program.account.fundAccount.fetch(fundData.fundPDA);
    expect(fund.shareClasses.length).toEqual(1);
    // expect(fund.assets.length).toEqual(3);
    // expect(fund.symbol).toEqual("GTST");
    // expect(fund.isActive).toEqual(true);

    // air drop to treasury and delay 1s for confirmation
    await provider.connection.requestAirdrop(treasuryPDA, 100_000_000_000);
    await sleep(1000);
  });

  it("Marinade desposit", async () => {
    try {
      treasurymSolAta = (
        await getOrCreateAssociatedTokenAccount(
          provider,
          marinadeState.mSolMintAddress,
          treasuryPDA
        )
      ).associatedTokenAccountAddress;

      const tx = await program.methods
        .marinadeDeposit(new anchor.BN(1e10))
        .accounts({
          manager: manager.publicKey,
          reservePda: await marinadeState.reserveAddress(),
          marinadeState: marinadeState.marinadeStateAddress,
          msolMint: marinadeState.mSolMintAddress,
          msolMintAuthority: await marinadeState.mSolMintAuthority(),
          liqPoolMsolLeg: marinadeState.mSolLeg,
          liqPoolMsolLegAuthority: await marinadeState.mSolLegAuthority(),
          liqPoolSolLegPda: await marinadeState.solLeg(),
          mintTo: treasurymSolAta,
          treasury: treasuryPDA,
          fund: fundPDA,
          marinadeProgram
        })
        .rpc({ commitment: "confirmed" });
      console.log("Your transaction signature", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });

  it("Liquid unstake", async () => {
    try {
      const tx = await program.methods
        .marinadeLiquidUnstake(new anchor.BN(1e9))
        .accounts({
          manager: manager.publicKey,
          treasury: treasuryPDA,
          fund: fundPDA,
          marinadeState: marinadeState.marinadeStateAddress,
          msolMint: marinadeState.mSolMintAddress,
          liqPoolSolLegPda: await marinadeState.solLeg(),
          liqPoolMsolLeg: marinadeState.mSolLeg,
          getMsolFrom: treasurymSolAta,
          getMsolFromAuthority: treasuryPDA,
          treasuryMsolAccount: marinadeTreasuryMsol,
          marinadeProgram
        })
        .rpc({ commitment: "confirmed" });
      console.log("Your transaction signature", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });

  it("Order unstake", async () => {
    [ticketPda, ticketBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("ticket")],
      program.programId
    );

    console.log("ticketPda", ticketPda.toBase58(), "ticketBump", ticketBump);

    try {
      const tx = await program.methods
        .marinadeDelayedUnstake(new anchor.BN(1e9), ticketBump)
        .accounts({
          manager: manager.publicKey,
          fund: fundPDA,
          treasury: treasuryPDA,
          ticket: ticketPda,
          msolMint: marinadeState.mSolMintAddress,
          burnMsolFrom: treasurymSolAta,
          marinadeState: marinadeState.marinadeStateAddress,
          reservePda: await marinadeState.reserveAddress(),
          marinadeProgram
        })
        .rpc({ commitment: "confirmed" });
      console.log("Your transaction signature", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });

  it("Claim", async () => {
    // wait for 30s so that the ticket is ready to be claimed
    await sleep(30_000);

    console.log("ticketPda", ticketPda.toBase58(), "ticketBump", ticketBump);

    try {
      const tx = await program.methods
        .marinadeClaim()
        .accounts({
          manager: manager.publicKey,
          fund: fundPDA,
          treasury: treasuryPDA,
          ticket: ticketPda,
          marinadeState: marinadeState.marinadeStateAddress,
          reservePda: await marinadeState.reserveAddress(),
          marinadeProgram
        })
        .rpc({ commitment: "confirmed" });
      console.log("Your transaction signature", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 35_000);
});
