import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Glam } from "../target/types/glam";
import { getTokenMetadata } from "@solana/spl-token";

import { createFundForTest, sleep } from "./setup";
import { getImageUri, getMetadataUri } from "../src/offchain";
import { Keypair, PublicKey } from "@solana/web3.js";

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

  it("Add pubkeys to share class acls", async () => {
    const fund = await program.account.fundAccount.fetch(fundPDA);
    const [allowlistPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("allowlist"), fund.shareClasses[0].toBuffer()],
      program.programId
    );
    const [blocklistPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("blocklist"), fund.shareClasses[0].toBuffer()],
      program.programId
    );

    const allowlistPubkeys = [Keypair.generate().publicKey];
    const blocklistPubkeys = [
      Keypair.generate().publicKey,
      Keypair.generate().publicKey
    ];

    try {
      await program.methods
        .initializeShareClassAcls()
        .accounts({
          shareClassMint: fund.shareClasses[0],
          fund: fundPDA,
          allowlist: allowlistPda,
          blocklist: blocklistPda,
          manager: manager.publicKey
        })
        .rpc({ commitment });

      await program.methods
        .addToShareClassAcl(allowlistPubkeys)
        .accounts({
          shareClassMint: fund.shareClasses[0],
          fund: fundPDA,
          acl: allowlistPda,
          manager: manager.publicKey
        })
        .rpc({ commitment });

      await program.methods
        .addToShareClassAcl(blocklistPubkeys)
        .accounts({
          shareClassMint: fund.shareClasses[0],
          fund: fundPDA,
          acl: blocklistPda,
          manager: manager.publicKey
        })
        .rpc({ commitment });

      const allowlist = await program.account.pubkeyAcl.fetch(allowlistPda);
      const blocklist = await program.account.pubkeyAcl.fetch(blocklistPda);
      expect(allowlist.items.length).toEqual(allowlistPubkeys.length);
      expect(blocklist.items.length).toEqual(blocklistPubkeys.length);
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
