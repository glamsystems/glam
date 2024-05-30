import { createFundForTest } from "./setup";
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
  });

  it("Swap", async () => {
    try {
      const txId = await glamClient.jupiter.swap(fundPDA, {
        inputMint: wSol,
        outputMint: mSol,
        amount: 500_000_000,
        maxAccounts: 10
      });
      console.log("swap txId", txId);
    } catch (e) {
      console.error(e);
      // make sure program has reached jupiter
      expect(e.logs).toContain(
        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]"
      );
    }
  }, 15_000);
});
