import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import { Glam } from "../target/types/glam";
import { createFundForTest } from "./setup";

describe("glam_staking", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const manager = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.Glam as Program<Glam>;

  let fundPDA, fundBump, treasuryPDA, treasuryBump, sharePDA, shareBump;

  it("Create fund", async () => {
    const fundData = await createFundForTest("Glam Fund TEST", "GTST", manager);
    fundPDA = fundData.fundPDA;
    fundBump = fundData.fundBump;
    treasuryPDA = fundData.treasuryPDA;
    treasuryBump = fundData.treasuryBump;
    sharePDA = fundData.sharePDA;
    shareBump = fundData.shareBump;

    const fund = await program.account.fund.fetch(fundData.fundPDA);
    // expect(fund.shareClassesLen).toEqual(1);
    expect(fund.assets.length).toEqual(3);
    expect(fund.symbol).toEqual("GTST");
    expect(fund.isActive).toEqual(true);
  });
});
