import { createFundForTest } from "./setup";
import { GlamClient } from "../src";
import { PublicKey } from "@solana/web3.js";

describe("glam_jupiter", () => {
  const wsol = new PublicKey("So11111111111111111111111111111111111111112");
  const msol = new PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So");
  const usdc = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

  const glamClient = new GlamClient();
  let fundPDA;

  it("Initialize fund", async () => {
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const fund = await glamClient.fetchFund(fundPDA);
    expect(fund.shareClasses.length).toEqual(1);

    // Airdrop some SOL to the treasury
    const airdrop = await glamClient.provider.connection.requestAirdrop(
      glamClient.getTreasuryPDA(fundPDA),
      1_000_000_000
    );
    await glamClient.provider.connection.confirmTransaction(airdrop);
  });

  it("Asset not allowed to swap", async () => {
    const amount = 50_000_000;
    try {
      const txId = await glamClient.jupiter.swap(fundPDA, {
        inputMint: usdc.toBase58(),
        outputMint: msol.toBase58(),
        amount,
        autoSlippage: true,
        autoSlippageCollisionUsdValue: 1000,
        swapMode: "ExactIn",
        onlyDirectRoutes: false,
        asLegacyTransaction: false,
        maxAccounts: 10
      });
      console.log("swap txId", txId);
    } catch (e) {
      console.error(e);
      expect(
        e.logs.some(
          (log) =>
            log.includes("Error Code: InvalidAssetForSwap") &&
            log.includes("Asset cannot be swapped.")
        )
      ).toBeTruthy();
    }
  }, 15_000);

  it("Swap by providing quote params", async () => {
    const amount = 50_000_000;
    try {
      const txId = await glamClient.jupiter.swap(fundPDA, {
        inputMint: wsol.toBase58(),
        outputMint: msol.toBase58(),
        amount,
        autoSlippage: true,
        autoSlippageCollisionUsdValue: 1000,
        swapMode: "ExactIn",
        onlyDirectRoutes: false,
        asLegacyTransaction: false,
        maxAccounts: 15
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

  it("Swap by providing swap instructions", async () => {
    const amount = 50_000_000;

    const quoteParams: any = {
      inputMint: wsol.toBase58(),
      outputMint: msol.toBase58(),
      amount,
      autoSlippage: true,
      autoSlippageCollisionUsdValue: 1000,
      swapMode: "ExactIn",
      onlyDirectRoutes: false,
      asLegacyTransaction: false,
      maxAccounts: 15
    };
    const quoteResponse = await (
      await fetch(
        `${glamClient.jupiterApi}/quote?${new URLSearchParams(
          Object.entries(quoteParams)
        )}`
      )
    ).json();
    const swapInstructions = await glamClient.jupiter.getSwapInstructions(
      quoteResponse,
      glamClient.getManager(),
      glamClient.getTreasuryAta(fundPDA, msol)
    );
    console.log("swapInstructions", swapInstructions);

    try {
      const txId = await glamClient.jupiter.swapWithIx(
        fundPDA,
        glamClient.getManager(),
        amount,
        wsol,
        msol,
        swapInstructions
      );
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
