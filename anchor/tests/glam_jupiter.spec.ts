import {
  airdrop,
  createFundForTest,
  quoteResponseForTest,
  str2seed,
  swapInstructionsForTest,
  testFundModel,
} from "./setup";
import {
  FundModel,
  GlamClient,
  JITOSOL,
  JUP_STAKE_LOCKER,
  JUP_VOTE_PROGRAM,
} from "../src";
import { Keypair } from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { MSOL, WSOL } from "../src";
import { PublicKey } from "@solana/web3.js";

describe("glam_jupiter", () => {
  const glamClient = new GlamClient();
  let fundPDA;

  it("Initialize fund", async () => {
    const fundData = await createFundForTest(glamClient, {
      ...testFundModel,
      integrationAcls: [
        { name: { jupiterSwap: {} }, features: [] },
        { name: { jupiterVote: {} }, features: [] },
      ],
    });
    fundPDA = fundData.fundPDA;

    const fund = await glamClient.fetchFund(fundPDA);
    expect(fund.shareClasses.length).toEqual(1);

    // Airdrop some SOL to the treasury
    const airdrop = await glamClient.provider.connection.requestAirdrop(
      glamClient.getVaultPda(fundPDA),
      1_000_000_000,
    );
    await glamClient.provider.connection.confirmTransaction(airdrop);
  });

  it("Swap end to end", async () => {
    const treasury = glamClient.getVaultPda(fundPDA);

    const signer = glamClient.getSigner();
    const inputSignerAta = glamClient.getAta(WSOL);
    const outputSignerAta = glamClient.getAta(MSOL);

    const quoteResponse = quoteResponseForTest;
    const swapInstructions = swapInstructionsForTest(
      signer,
      inputSignerAta,
      outputSignerAta,
    );

    // Pre-checks: the following accounts should not exist
    const beforeTreasuryBalance =
      await glamClient.provider.connection.getBalance(treasury);
    expect(beforeTreasuryBalance).toEqual(1_000_000_000);
    const beforeNoAccounts = [
      glamClient.getAta(WSOL),
      glamClient.getAta(MSOL),
      glamClient.getVaultAta(fundPDA, WSOL),
      glamClient.getVaultAta(fundPDA, MSOL),
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
        swapInstructions,
      );
      console.log("swap e2e txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    // Post-checks: the following accounts should exist and have 0 balance
    const afterAccounts = [
      glamClient.getAta(WSOL),
      glamClient.getAta(MSOL),
      glamClient.getVaultAta(fundPDA, WSOL),
    ];
    afterAccounts.forEach(async (account) => {
      try {
        const acc = await getAccount(
          glamClient.provider.connection,
          account,
          "confirmed",
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
      glamClient.getTreasuryAta(fundPDA, MSOL),
    );
    expect(treasuryMsol.amount.toString()).toEqual("41795954");
  }, 15_000);

  it("Swap access control #1", async () => {
    // set up a test signer and airdrop 0.1 SOL
    const testSigner = Keypair.fromSeed(str2seed("test_signer"));
    const airdrop = await glamClient.provider.connection.requestAirdrop(
      testSigner.publicKey,
      100_000_000,
    );
    await glamClient.provider.connection.confirmTransaction(airdrop);

    // grant delegate permissions
    // testSigner is only allowed to swap fund assets
    try {
      const txId = await glamClient.fund.upsertDelegateAcls(fundPDA, [
        {
          pubkey: testSigner.publicKey,
          permissions: [{ jupiterSwapAllowlisted: {} }, { wSolWrap: {} }],
        },
      ]);
      console.log("Update delegate acl txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.delegateAcls.length).toEqual(1);

    // The test fund has 2 assets, WSOL and MSOL. Update to WSOL only.
    let updatedFund = new FundModel({ assets: [WSOL] });
    try {
      await glamClient.program.methods
        .updateFund(updatedFund)
        .accounts({
          fund: fundPDA,
        })
        .rpc();
    } catch (e) {
      console.error(e);
      throw e;
    }
    fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.assets).toEqual([WSOL]);

    const quoteParams = {
      inputMint: WSOL.toBase58(),
      outputMint: MSOL.toBase58(),
      amount: 50_000_000,
      swapMode: "ExactIn",
      onlyDirectRoutes: true,
      maxAccounts: 8,
    };
    // 1st attempt, should fail because MSOL is not in assets allowlist,
    // and testSigner doesn't have swapAny or swapLst permission
    try {
      const delegateSwapTx = await glamClient.jupiter.swapTx(
        fundPDA,
        quoteParams,
        undefined,
        undefined,
        { signer: testSigner.publicKey },
      );
      const txSig = await glamClient.sendAndConfirm(delegateSwapTx, testSigner);
      expect(txSig).toBeUndefined();
    } catch (e) {
      console.log(e);
      const expectedError = e.programLogs.some((log) =>
        log.includes("Signer is not authorized"),
      );
      expect(expectedError).toBeTruthy();
    }

    // allow testSigner to swap LST
    try {
      const txSig = await glamClient.fund.upsertDelegateAcls(fundPDA, [
        {
          pubkey: testSigner.publicKey,
          permissions: [{ jupiterSwapLst: {} }, { wSolWrap: {} }],
        },
      ]);
      console.log("Grant delegate jupiterSwapAny permission:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }

    // 2nd attempt, should pass since testSigner is now allowed to swap LST
    // and asset list should be updated accordingly to include MSOL
    try {
      const delegateSwapTx = await glamClient.jupiter.swapTx(
        fundPDA,
        quoteParams,
        undefined,
        undefined,
        { signer: testSigner.publicKey },
      );
      const txSig = await glamClient.sendAndConfirm(delegateSwapTx, testSigner);
      console.log("2nd attempt swap:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    fundModel = await glamClient.fetchFund(fundPDA);
    expect(fundModel.assets).toEqual([WSOL, MSOL]);
  }, 30_000);

  it("Swap back end to end", async () => {
    const signer = glamClient.getSigner();
    const inputSignerAta = glamClient.getAta(MSOL);
    const outputSignerAta = glamClient.getAta(WSOL);

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
            pubkey: signer.toBase58(),
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
            pubkey: signer.toBase58(),
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
        swapInstructions,
      );
      console.log("swap back e2e txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }

    // treasury: more mSOL
    const vaultMsol = await getAccount(
      glamClient.provider.connection,
      glamClient.getVaultAta(fundPDA, MSOL),
    );
    expect(vaultMsol.amount.toString()).toEqual("42591005");
  });

  it("Swap by providing quote params", async () => {
    const amount = 50_000_000;
    try {
      const txIdWrap = await glamClient.wsol.wrap(fundPDA, new BN(amount));
      console.log("wrap before swap txId", txIdWrap);

      const txIdSwap = await glamClient.jupiter.swap(fundPDA, {
        inputMint: WSOL.toBase58(),
        outputMint: MSOL.toBase58(),
        amount,
        autoSlippage: true,
        autoSlippageCollisionUsdValue: 1000,
        swapMode: "ExactIn",
        onlyDirectRoutes: true,
        asLegacyTransaction: false,
        maxAccounts: 18,
      });
      expect(txIdSwap).toBeUndefined();
    } catch (e) {
      expect(e.programLogs).toContain(
        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]",
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
    // NOTE: we're making real API request to jupiter in this test.
    // Test could fail if jupiter api is down or too busy.
    const quoteResponse = await (
      await fetch(
        `${glamClient.jupiterApi}/quote?${new URLSearchParams(
          Object.entries(quoteParams),
        )}`,
      )
    ).json();
    const swapInstructions = await glamClient.jupiter.getSwapInstructions(
      quoteResponse,
      glamClient.getSigner(),
    );

    try {
      const txIdWrap = await glamClient.wsol.wrap(fundPDA, new BN(amount));
      console.log("wrap before swap txId", txIdWrap);

      const txIdSwap = await glamClient.jupiter.swap(
        fundPDA,
        quoteParams,
        quoteResponse,
        swapInstructions,
      );
      expect(txIdSwap).toBeUndefined();
    } catch (e) {
      console.error(e.programLogs);
      expect(e.programLogs).toContain(
        "Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]",
      );
    }
  }, 15_000);

  it("Create JUP escrow", async () => {
    const treasury = glamClient.getVaultPda(fundPDA);
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("Escrow"), JUP_STAKE_LOCKER.toBuffer(), treasury.toBuffer()],
      JUP_VOTE_PROGRAM,
    );
    try {
      const txId = await glamClient.program.methods
        .initLockedVoterEscrow()
        .accounts({
          fund: fundPDA,
          locker: JUP_STAKE_LOCKER,
          escrow,
        })
        .rpc();
      console.log("initLockedVoterEscrow txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
