import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Glam } from "../target/types/glam";
import { getTokenMetadata } from "@solana/spl-token";

import { createFundForTest, sleep } from "./setup";
import { getImageUri, getMetadataUri } from "../src/offchain";
import { PublicKey } from "@solana/web3.js";

describe("glam_crud", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const manager = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Glam as Program<Glam>;
  const commitment = "confirmed";

  let fundPDA;

  it("Initialize fund", async () => {
    const fundData = await createFundForTest();
    fundPDA = fundData.fundPDA;

    const fund = await program.account.fundAccount.fetch(fundPDA);
    expect(fund.shareClasses.length).toEqual(1);
    // expect(fund.assets.length).toEqual(3);
    // expect(fund.isEnabled).toEqual(true);

    // const metadata = await getTokenMetadata(provider.connection, sharePDA);
    // const { image_uri } = Object.fromEntries(metadata!.additionalMetadata);
    // expect(metadata?.symbol).toEqual("GBTC.A");
    // expect(metadata?.uri).toEqual(getMetadataUri(sharePDA));
    // expect(image_uri).toEqual(getImageUri(sharePDA));
  });

  it("Add pubkeys to share class allowlist", async () => {
    const fund = await program.account.fundAccount.fetch(fundPDA);
    const [allowlistPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("allowlist"), fund.shareClasses[0].toBuffer()],
      program.programId
    );
    const [blocklistPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("blocklist"), fund.shareClasses[0].toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .initShareClassAllowlistAndBlocklist()
        .accounts({
          shareClassMint: fund.shareClasses[0],
          fund: fundPDA,
          allowlist: allowlistPda,
          blocklist: blocklistPda,
          manager: manager.publicKey
        })
        .rpc({ commitment });

      sleep(1000);

      await program.methods
        .upsertShareClassAllowlist([manager.publicKey, fundPDA])
        .accounts({
          shareClassMint: fund.shareClasses[0],
          fund: fundPDA,
          allowlist: allowlistPda,
          manager: manager.publicKey
        })
        .rpc({ commitment });

      sleep(1000);

      await program.methods
        .upsertShareClassAllowlist([manager.publicKey, fundPDA])
        .accounts({
          shareClassMint: fund.shareClasses[0],
          fund: fundPDA,
          allowlist: allowlistPda,
          manager: manager.publicKey
        })
        .rpc({ commitment });

      const allowlist = await program.account.pubkeyAcl.fetch(allowlistPda);
      console.log("Share class allowlist:", allowlist);
      expect(allowlist.items.length).toEqual(4);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  it("Update fund", async () => {
    const newFundName = "Updated fund name";
    await program.methods
      .update(newFundName, null, null, false)
      .accounts({
        fund: fundPDA,
        manager: manager.publicKey
      })
      .rpc({ commitment });
    const fund = await program.account.fundAccount.fetch(fundPDA);
    expect(fund.name).toEqual(newFundName);
    // expect(fund.isActive).toEqual(false);
  });

  it("Close fund", async () => {
    const fund = await program.account.fundAccount.fetchNullable(fundPDA);
    expect(fund).not.toBeNull();

    await program.methods
      .close()
      .accounts({
        fund: fundPDA,
        manager: manager.publicKey
      })
      .rpc({ commitment });

    // The account should no longer exist, returning null.
    const closedAccount = await program.account.fundAccount.fetchNullable(
      fundPDA
    );
    expect(closedAccount).toBeNull();
  });
});
