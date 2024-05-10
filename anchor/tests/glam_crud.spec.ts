import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Glam } from "../target/types/glam";
import { getTokenMetadata } from "@solana/spl-token";

import { createFundForTest } from "./setup";
import { getImageUri, getMetadataUri } from "../src/offchain";

describe("glam_crud", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const manager = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Glam as Program<Glam>;
  const commitment = "confirmed";

  let fundPDA, fundBump, treasuryPDA, treasuryBump, sharePDA, shareBump;

  it("Initialize fund", async () => {
    const fundData = await createFundForTest("Glam Fund BTC", "GBTC", manager);
    fundPDA = fundData.fundPDA;
    fundBump = fundData.fundBump;
    treasuryPDA = fundData.treasuryPDA;
    treasuryBump = fundData.treasuryBump;
    sharePDA = fundData.sharePDA;
    shareBump = fundData.shareBump;

    const fund = await program.account.fundAccount.fetch(fundPDA);
    expect(fund.shareClasses.length).toEqual(1);
    // expect(fund.assets.length).toEqual(3);
    // expect(fund.symbol).toEqual("GBTC");
    // expect(fund.isActive).toEqual(true);

    const metadata = await getTokenMetadata(provider.connection, sharePDA);
    const { image_uri } = Object.fromEntries(metadata!.additionalMetadata);
    expect(metadata?.symbol).toEqual("GBTC.A");
    expect(metadata?.uri).toEqual(getMetadataUri(sharePDA));
    expect(image_uri).toEqual(getImageUri(sharePDA));
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
