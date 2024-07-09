import {
  createFundForTest,
  quoteResponseForTest,
  swapInstructionsForTest,
} from "./setup";
import { GlamClient } from "../src";
import { PublicKey } from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { MSOL, WSOL, USDC } from "../src";

describe("glam_jupiter", () => {
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
        inputMint: USDC.toBase58(),
        outputMint: MSOL.toBase58(),
        amount,
        swapMode: "ExactIn",
        onlyDirectRoutes: true,
        maxAccounts: 8,
      });
      console.log("swap txId", txId);
    } catch (e) {
      console.log(e);
      expect(
        e.logs.some(
          (log) =>
            log.includes("Error Code: InvalidAssetForSwap") &&
            log.includes("Asset cannot be swapped.")
        )
      ).toBeTruthy();
    }
  });

  it("Swap end to end", async () => {
    const treasury = glamClient.getTreasuryPDA(fundPDA);

    const manager = glamClient.getManager();
    const inputSignerAta = glamClient.getManagerAta(WSOL);
    const outputSignerAta = glamClient.getManagerAta(MSOL);

    const quoteResponse = quoteResponseForTest;
    const swapInstructions = swapInstructionsForTest(
      manager,
      inputSignerAta,
      outputSignerAta
    );

    // Pre-checks: the following accounts should not exist
    const beforeTreasuryBalance =
      await glamClient.provider.connection.getBalance(treasury);
    expect(beforeTreasuryBalance).toEqual(1_000_000_000);
    const beforeNoAccounts = [
      glamClient.getManagerAta(WSOL),
      glamClient.getManagerAta(MSOL),
      glamClient.getTreasuryAta(fundPDA, WSOL),
      glamClient.getTreasuryAta(fundPDA, MSOL),
    ];
    beforeNoAccounts.forEach(async (account) => {
      try {
        await getAccount(glamClient.provider.connection, account, "confirmed");
        expect(0).toEqual(1);
      } catch (e) {
        expect(e.name).toEqual("TokenAccountNotFoundError");
      }
    });

    // Swap
    const amount = 50_000_000;
    try {
      const txId = await glamClient.jupiter.swap(
        fundPDA,
        undefined,
        quoteResponse,
        swapInstructions
      );
      console.log("swap e2e txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    // Post-checks: the following accounts should exist and have 0 balance
    const afterAccounts = [
      glamClient.getManagerAta(WSOL),
      glamClient.getManagerAta(MSOL),
      glamClient.getTreasuryAta(fundPDA, WSOL),
    ];
    afterAccounts.forEach(async (account) => {
      try {
        const acc = await getAccount(
          glamClient.provider.connection,
          account,
          "confirmed"
        );
        expect(acc.amount.toString()).toEqual("0");
      } catch (e) {
        throw e;
      }
    });

    // treasury: less SOL
    const afterTreasuryBalance =
      await glamClient.provider.connection.getBalance(treasury);
    expect(afterTreasuryBalance).toEqual(950_000_000); // minus 50_000_000

    // treasury: more mSOL
    const treasuryMsol = await getAccount(
      glamClient.provider.connection,
      glamClient.getTreasuryAta(fundPDA, MSOL)
    );
    expect(treasuryMsol.amount.toString()).toEqual("41795954");
  });

  it("Swap back end to end", async () => {
    const manager = glamClient.getManager();
    const inputSignerAta = glamClient.getManagerAta(MSOL);
    const outputSignerAta = glamClient.getManagerAta(WSOL);

    const swapInstructions = {
      tokenLedgerInstruction: null,
      computeBudgetInstructions: [
        {
          programId: "ComputeBudget111111111111111111111111111111",
          accounts: [],
          data: "AsBcFQA=",
        },
      ],
      setupInstructions: [
        {
          programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
          accounts: [
            {
              pubkey: "FsbYwp2VmCdouBbJLKTGo5Gf8RsUUQWVZzA1gvRbsk89",
              isSigner: true,
              isWritable: true,
            },
            {
              pubkey: "Ghk24stAfSCWywoUygdzkhWxZkXZHTmjBWaprkrC3EDh",
              isSigner: false,
              isWritable: true,
            },
            {
              pubkey: "FsbYwp2VmCdouBbJLKTGo5Gf8RsUUQWVZzA1gvRbsk89",
              isSigner: false,
              isWritable: false,
            },
            {
              pubkey: "So11111111111111111111111111111111111111112",
              isSigner: false,
              isWritable: false,
            },
            {
              pubkey: "11111111111111111111111111111111",
              isSigner: false,
              isWritable: false,
            },
            {
              pubkey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              isSigner: false,
              isWritable: false,
            },
          ],
          data: "AQ==",
        },
      ],
      swapInstruction: {
        programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
        accounts: [
          {
            pubkey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: manager.toBase58(),
            isSigner: true,
            isWritable: false,
          },
          {
            pubkey: inputSignerAta.toBase58(),
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: outputSignerAta.toBase58(),
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: "So11111111111111111111111111111111111111112",
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: "D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf",
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: "MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky",
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: "MAR1zHjHaQcniE2gXsDptkyKUnNfMEsLBVcfP7vLyv7",
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: "GcJckEnDiWjpjQ8sqDKuNZjJUKAFZSiuQZ9WmuQpC92a",
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: manager.toBase58(),
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: inputSignerAta.toBase58(),
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: outputSignerAta.toBase58(),
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: "EWy2hPdVT4uGrYokx65nAyn2GFBv7bUYA2pFPY96pw7Y",
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: "GM48qFn8rnqhyNMrBHyPJgUVwXQ1JvMbcu3b9zkThW9L",
            isSigner: false,
            isWritable: true,
          },
        ],
        data: "5RfLl3rjrSoBAAAACmQAAUCccQIAAAAA8knsAgAAAAAyAAA=",
      },
      cleanupInstruction: {
        programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        accounts: [
          {
            pubkey: "Ghk24stAfSCWywoUygdzkhWxZkXZHTmjBWaprkrC3EDh",
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: "FsbYwp2VmCdouBbJLKTGo5Gf8RsUUQWVZzA1gvRbsk89",
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: "FsbYwp2VmCdouBbJLKTGo5Gf8RsUUQWVZzA1gvRbsk89",
            isSigner: true,
            isWritable: false,
          },
        ],
        data: "CQ==",
      },
      otherInstructions: [],
      addressLookupTableAddresses: [
        "6TSS8bTxDjGitZgtTc7gdVWkzKdpGLb9QDi7kXAQQXXp",
      ],
      prioritizationFeeLamports: 0,
    };

    // Swap
    const amount = 41_000_000;
    try {
      const txId = await glamClient.jupiter.swap(
        fundPDA,
        {
          inputMint: MSOL.toBase58(),
          outputMint: WSOL.toBase58(),
          amount,
          swapMode: "ExactIn",
          onlyDirectRoutes: true,
          maxAccounts: 8,
        },
        undefined,
        swapInstructions
      );
      console.log("swap back e2e txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    // treasury: more mSOL
    const treasuryMsol = await getAccount(
      glamClient.provider.connection,
      glamClient.getTreasuryAta(fundPDA, MSOL)
    );
    expect(treasuryMsol.amount.toString()).toEqual("795954");
  });

  it("Swap by providing quote params", async () => {
    const amount = 50_000_000;
    try {
      const txId0 = await glamClient.wsol.wrap(fundPDA, new BN(amount));
      const txId = await glamClient.jupiter.swap(fundPDA, {
        inputMint: WSOL.toBase58(),
        outputMint: MSOL.toBase58(),
        amount,
        autoSlippage: true,
        autoSlippageCollisionUsdValue: 1000,
        swapMode: "ExactIn",
        onlyDirectRoutes: false,
        asLegacyTransaction: false,
        maxAccounts: 20,
      });
      console.log("swap txId", txId);
    } catch (e) {
      // make sure program has reached jupiter
      expect(e.logs).toContain(
        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]"
      );
    }
  }, 15_000);

  it("Swap by providing swap instructions", async () => {
    const amount = 50_000_000;

    const quoteParams: any = {
      inputMint: WSOL.toBase58(),
      outputMint: MSOL.toBase58(),
      amount,
      autoSlippage: true,
      autoSlippageCollisionUsdValue: 1000,
      swapMode: "ExactIn",
      onlyDirectRoutes: false,
      asLegacyTransaction: false,
      maxAccounts: 15,
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
      glamClient.getManager()
    );
    // console.log("swapInstructions", swapInstructions);

    try {
      const txId0 = await glamClient.wsol.wrap(fundPDA, new BN(amount));
      const txId = await glamClient.jupiter.swap(
        fundPDA,
        quoteParams,
        quoteResponse,
        swapInstructions
      );
      console.log("swap txId", txId);
    } catch (e) {
      // make sure program has reached jupiter
      expect(e.logs).toContain(
        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]"
      );
    }
  }, 15_000);
});
