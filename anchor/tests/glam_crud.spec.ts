import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Glam } from "../target/types/glam";

import {
  shareClass0Allowlist,
  createFundForTest,
  shareClass0Blocklist
} from "./setup";
import { GlamClient } from "../src";

describe("glam_crud", () => {
  const glamClient = new GlamClient();
  let fundPDA;

  it("Initialize fund", async () => {
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const fund = await glamClient.fetchFund(fundPDA);
    expect(fund.shareClasses.length).toEqual(1);
    expect(fund.shareClasses[0].allowlist).toEqual(shareClass0Allowlist);
    expect(fund.shareClasses[0].blocklist).toEqual(shareClass0Blocklist);
    // expect(fund.assets.length).toEqual(3);
    // expect(fund.isEnabled).toEqual(true);

    // const metadata = await getTokenMetadata(provider.connection, sharePDA);
    // const { image_uri } = Object.fromEntries(metadata!.additionalMetadata);
    // expect(metadata?.symbol).toEqual("GBTC.A");
    // expect(metadata?.uri).toEqual(getMetadataUri(sharePDA));
    // expect(image_uri).toEqual(getImageUri(sharePDA));
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

  /*
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
  */
});
