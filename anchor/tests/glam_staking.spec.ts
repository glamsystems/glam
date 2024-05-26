import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import { Glam } from "../target/types/glam";
import { createFundForTest, sleep } from "./setup";
import { PublicKey } from "@solana/web3.js";
import { Marinade, MarinadeConfig } from "@marinade.finance/marinade-ts-sdk";
import { getOrCreateAssociatedTokenAccount } from "@marinade.finance/marinade-ts-sdk/dist/src/util";

import { GlamClient } from "../src";

describe("glam_staking", () => {
  const glamClient = new GlamClient();

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
    // console.log("mSolMintAuthority", await marinadeState.mSolMintAuthority());
  });

  it("Create fund", async () => {
    const fundData = await createFundForTest(glamClient);
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

      let tx = await glamClient.marinade.stake(fundPDA, new anchor.BN(1e10));

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
    try {
      let tx = await glamClient.marinade.delayedUnstake(
        fundPDA,
        new anchor.BN(1e9)
      );
      console.log("Delayed unstake #1:", tx);

      // tx = await glamClient.marinade.delayedUnstake(
      //   fundPDA,
      //   new anchor.BN(1e9)
      // );
      // console.log("Delayed unstake #2:", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });

  it("Claim", async () => {
    // wait for 30s so that the ticket is ready to be claimed
    await sleep(30_000);

    const ticketPda = glamClient.marinade.getMarinadeTicketPDA(fundPDA);
    console.log("ticketPda", ticketPda.toBase58());

    try {
      const tx = await glamClient.marinade.delayedUnstakeClaim(fundPDA);
      console.log("Your transaction signature", tx);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }, 35_000);
});
