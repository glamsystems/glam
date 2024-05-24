import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Glam } from "../target/types/glam";

import { createFundForTest } from "./setup";
import { Keypair, PublicKey } from "@solana/web3.js";
import { GlamClient } from "../src";

describe("glam_crud", () => {
  const glamClient = new GlamClient();

  let fundPDA;

  it("Initialize fund", async () => {
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const fund = await glamClient.fetchFundAccount(fundPDA);
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
    const fund = await glamClient.fetchFundAccount(fundPDA);
    const allowlistPubkeys = [Keypair.generate().publicKey];
    const blocklistPubkeys = [
      Keypair.generate().publicKey,
      Keypair.generate().publicKey
    ];

    try {
      await glamClient.addToShareClassAcls(
        fundPDA,
        fund.shareClasses[0],
        allowlistPubkeys,
        blocklistPubkeys
      );
      const { allowlist, blocklist } = await glamClient.fetchShareClassAcls(
        fund.shareClasses[0]
      );
      expect(allowlist.items.length).toEqual(allowlistPubkeys.length);
      expect(blocklist.items.length).toEqual(blocklistPubkeys.length);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  it("Update fund", async () => {
    const newFundName = "Updated fund name";
    await glamClient.program.methods
      .update(newFundName, null, null, false)
      .accounts({
        fund: fundPDA,
        manager: glamClient.getManager()
      })
      .rpc();
    const fund = await glamClient.program.account.fundAccount.fetch(fundPDA);
    expect(fund.name).toEqual(newFundName);
    // expect(fund.isActive).toEqual(false);
  });

  it("Close fund", async () => {
    const fund = await glamClient.program.account.fundAccount.fetchNullable(
      fundPDA
    );
    expect(fund).not.toBeNull();

    await glamClient.program.methods
      .close()
      .accounts({
        fund: fundPDA,
        manager: glamClient.getManager()
      })
      .rpc();

    // The account should no longer exist, returning null.
    const closedAccount =
      await glamClient.program.account.fundAccount.fetchNullable(fundPDA);
    expect(closedAccount).toBeNull();
  });
});
