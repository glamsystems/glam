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
    // TODO: download accounts so this also works
    const quoteResponseSaber = {
      inputMint: "So11111111111111111111111111111111111111112",
      inAmount: "100000000",
      outputMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
      outAmount: "83883238",
      otherAmountThreshold: "83463822",
      swapMode: "ExactIn",
      slippageBps: 50,
      platformFee: null,
      priceImpactPct: "0.0000048124147404582633488403",
      routePlan: [
        {
          swapInfo: {
            ammKey: "Lee1XZJfJ9Hm2K1qTyeCz1LXNc1YBZaKZszvNY4KCDw",
            label: "Saber",
            inputMint: "So11111111111111111111111111111111111111112",
            outputMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
            inAmount: "100000000",
            outAmount: "83883238",
            feeAmount: "8389",
            feeMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"
          },
          percent: 100
        }
      ],
      contextSlot: 269276632,
      timeTaken: 0.005332463
    };

    // TODO: download accounts so this also works
    const quoteResponseMeteora = {
      inputMint: "So11111111111111111111111111111111111111112",
      inAmount: "100000000",
      outputMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
      outAmount: "83884254",
      otherAmountThreshold: "83464833",
      swapMode: "ExactIn",
      slippageBps: 50,
      platformFee: null,
      priceImpactPct: "0.0001301870270953763480211372",
      routePlan: [
        {
          swapInfo: {
            ammKey: "HcjZvfeSNJbNkfLD4eEcRBr96AD3w1GpmMppaeRZf7ur",
            label: "Meteora",
            inputMint: "So11111111111111111111111111111111111111112",
            outputMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
            inAmount: "100000000",
            outAmount: "83884254",
            feeAmount: "10000",
            feeMint: "So11111111111111111111111111111111111111112"
          },
          percent: 100
        }
      ],
      contextSlot: 269284604,
      timeTaken: 0.002404066
    };

    const quoteResponseMercurial = {
      inputMint: "So11111111111111111111111111111111111111112",
      inAmount: "100000000",
      outputMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
      outAmount: "83882593",
      otherAmountThreshold: "83463181",
      swapMode: "ExactIn",
      slippageBps: 50,
      platformFee: null,
      priceImpactPct: "0.0000227964401766161245124881",
      routePlan: [
        {
          swapInfo: {
            ammKey: "MAR1zHjHaQcniE2gXsDptkyKUnNfMEsLBVcfP7vLyv7",
            label: "Mercurial",
            inputMint: "So11111111111111111111111111111111111111112",
            outputMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
            inAmount: "100000000",
            outAmount: "83882593",
            feeAmount: "8389",
            feeMint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"
          },
          percent: 100
        }
      ],
      contextSlot: 269285001,
      timeTaken: 0.002353586
    };

    try {
      const txId = await glamClient.jupiter.swap(
        fundPDA,
        {
          inputMint: wSol,
          outputMint: mSol,
          amount: 100_000_000,
          onlyDirectRoutes: true,
          maxAccounts: 8 // this should get Mercurial
        },
        quoteResponseMercurial // this forces Mercurial
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
