import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Glam } from "../target/types/glam";

import {
  shareClass0Allowlist,
  createFundForTest,
  shareClass0Blocklist
} from "./setup";
import { GlamClient } from "../src";
import { PublicKey } from "@solana/web3.js";

describe("glam_jupiter", () => {
  const wSol = new PublicKey("So11111111111111111111111111111111111111112");
  const mSol = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");

  const glamClient = new GlamClient();
  let fundPDA;

  it("Initialize fund", async () => {
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const fund = await glamClient.fetchFund(fundPDA);
    expect(fund.shareClasses.length).toEqual(1);
    expect(fund.shareClasses[0].allowlist).toEqual(shareClass0Allowlist);
    expect(fund.shareClasses[0].blocklist).toEqual(shareClass0Blocklist);
  });

  it("Swap", async () => {
    try {
      const txId = await glamClient.jupiter.swap(
        fundPDA,
        wSol,
        mSol,
        500_000_000
      );
      console.log("swap txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
