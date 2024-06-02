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

    // Air drop some SOL to the treasury
    const airdrop = await glamClient.provider.connection.requestAirdrop(
      glamClient.getTreasuryPDA(fundPDA),
      1_000_000_000
    );
    await glamClient.provider.connection.confirmTransaction(airdrop);
  });

  it("Swap", async () => {
    const amount = 50_000_000;
    try {
      const txId = await glamClient.jupiter.swap(fundPDA, {
        inputMint: wSol,
        outputMint: mSol,
        amount,
        autoSlippage: true,
        autoSlippageCollisionUsdValue: 1000,
        swapMode: "ExactIn",
        onlyDirectRoutes: false,
        asLegacyTransaction: false,
        maxAccounts: 20
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
