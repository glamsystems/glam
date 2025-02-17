import {
  airdrop,
  createGlamStateForTest,
  quoteResponseForTest,
  str2seed,
  swapInstructionsForTest,
  stateModelForTest,
  sleep,
} from "./setup";
import { GlamClient, JUP_STAKE_LOCKER, JUP_VOTE_PROGRAM } from "../src";
import { Keypair } from "@solana/web3.js";
import { getAccount } from "@solana/spl-token";
import { BN, Wallet } from "@coral-xyz/anchor";
import { MSOL, WSOL } from "../src";
import { PublicKey } from "@solana/web3.js";

describe("glam_jupiter", () => {
  const glamClient = new GlamClient();
  let statePda;

  const delegate = Keypair.fromSeed(str2seed("delegate"));
  const delegateGlamClient = new GlamClient({
    wallet: new Wallet(delegate),
  });

  it("Initialize glam state", async () => {
    const stateData = await createGlamStateForTest(glamClient, {
      ...stateModelForTest,
      integrations: [{ jupiterSwap: {} }, { jupiterVote: {} }],
    });
    statePda = stateData.statePda;

    const state = await glamClient.fetchState(statePda);
    expect(state.mints?.length).toEqual(1);

    await airdrop(
      glamClient.provider.connection,
      glamClient.getVaultPda(statePda),
      1_000_000_000,
    );

    await airdrop(
      glamClient.provider.connection,
      delegate.publicKey,
      100_000_000,
    );
  });

  it("Swap end to end", async () => {
    const vault = glamClient.getVaultPda(statePda);
    const inputVaultAta = glamClient.getVaultAta(statePda, WSOL);
    const outputVaultAta = glamClient.getVaultAta(statePda, MSOL);

    const quoteResponse = quoteResponseForTest;
    const swapInstructions = swapInstructionsForTest(
      vault,
      inputVaultAta,
      outputVaultAta,
    );

    // Pre-checks: the following accounts should not exist
    const vaultBalanceBefore =
      await glamClient.provider.connection.getBalance(vault);
    expect(vaultBalanceBefore).toEqual(1_000_000_000);
    const noAccountsBefore = [inputVaultAta, outputVaultAta];
    noAccountsBefore.forEach(async (account) => {
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
      const txId = await glamClient.jupiterSwap.swap(
        statePda,
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
    const accountsAfter = [glamClient.getAta(WSOL, vault)];
    accountsAfter.forEach(async (account) => {
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

    // vault: less SOL
    const vaultBalanceAfter =
      await glamClient.provider.connection.getBalance(vault);
    expect(vaultBalanceAfter).toEqual(950_000_000); // minus 50_000_000

    // vault: more mSOL
    const vaultMsol = await getAccount(
      glamClient.provider.connection,
      glamClient.getVaultAta(statePda, MSOL),
    );
    expect(vaultMsol.amount.toString()).toEqual("41795954");
  }, 15_000);

  it("Swap access control #1", async () => {
    // grant delegate permissions: only allowed to swap allowlisted assets
    try {
      const txId = await glamClient.state.upsertDelegateAcls(statePda, [
        {
          pubkey: delegate.publicKey,
          permissions: [{ jupiterSwapAllowlisted: {} }, { wSolWrap: {} }],
          expiresAt: new BN(0),
        },
      ]);
      console.log("Update delegate acl txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
    let stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.delegateAcls?.length).toEqual(1);

    // The test fund has 2 assets, WSOL and MSOL. Update to WSOL only.
    try {
      const txSig = await glamClient.state.updateState(statePda, {
        assets: [WSOL],
      });
      console.log("Update assets (WSOL) txSig", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.assets).toEqual([WSOL]);

    //
    // Execute swaps by delegate
    //
    const vault = glamClient.getVaultPda(statePda);
    const inputVaultAta = glamClient.getVaultAta(statePda, WSOL);
    const outputVaultAta = glamClient.getVaultAta(statePda, MSOL);
    const quoteResponse = quoteResponseForTest;
    const swapInstructions = swapInstructionsForTest(
      vault,
      inputVaultAta,
      outputVaultAta,
    );

    // 1st attempt, should fail because MSOL is not in assets allowlist,
    // and delegate doesn't have swapAny or swapLst permission
    try {
      const txSig = await delegateGlamClient.jupiterSwap.swap(
        statePda,
        undefined,
        quoteResponse,
        swapInstructions,
      );
      expect(txSig).toBeUndefined();
    } catch (e) {
      console.log(e);
      const expectedError = e.programLogs.some((log) =>
        log.includes("Signer is not authorized"),
      );
      expect(expectedError).toBeTruthy();
    }

    // allow delegate to swap LST
    try {
      const txSig = await glamClient.state.upsertDelegateAcls(statePda, [
        {
          pubkey: delegate.publicKey,
          permissions: [{ jupiterSwapLst: {} }, { wSolWrap: {} }],
          expiresAt: new BN(0),
        },
      ]);
      console.log("Grant delegate jupiterSwapAny permission:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }

    await sleep(3_000);

    // 2nd attempt, should pass since delegate is now allowed to swap LST
    // and asset list should be updated accordingly to include MSOL
    try {
      const txSig = await delegateGlamClient.jupiterSwap.swap(
        statePda,
        undefined,
        quoteResponse,
        swapInstructions,
      );
      console.log("2nd attempt swap:", txSig);
    } catch (e) {
      console.error(e);
      throw e;
    }
    stateModel = await glamClient.fetchState(statePda);
    expect(stateModel.assets).toEqual([WSOL, MSOL]);
  }, 30_000);

  it("Swap back end to end", async () => {
    const vault = glamClient.getVaultPda(statePda);
    const inputVaultAta = glamClient.getVaultAta(statePda, MSOL);
    const outputVaultAta = glamClient.getVaultAta(statePda, WSOL);

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
            pubkey: vault.toBase58(),
            isSigner: true,
            isWritable: false,
          },
          {
            pubkey: inputVaultAta.toBase58(),
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: outputVaultAta.toBase58(),
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
            pubkey: vault.toBase58(),
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: inputVaultAta.toBase58(),
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: outputVaultAta.toBase58(),
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
      const txId = await glamClient.jupiterSwap.swap(
        statePda,
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

    // vault: more mSOL
    const vaultMsol = await getAccount(
      glamClient.provider.connection,
      glamClient.getVaultAta(statePda, MSOL),
    );
    expect(vaultMsol.amount.toString()).toEqual("42591005");
  });

  it("Set max slippage and swap by providing quote params", async () => {
    const amount = 50_000_000;
    try {
      const txSetMaxSlippage = await glamClient.jupiterSwap.setMaxSwapSlippage(
        statePda,
        100,
      );
      console.log("Set max slippage txSig", txSetMaxSlippage);

      const txIdSwap = await glamClient.jupiterSwap.swap(statePda, {
        inputMint: WSOL.toBase58(),
        outputMint: MSOL.toBase58(),
        amount,
        slippageBps: 150,
        swapMode: "ExactIn",
        onlyDirectRoutes: true,
        asLegacyTransaction: false,
        maxAccounts: 18,
      });
      expect(txIdSwap).toBeUndefined();
    } catch (e) {
      // should fail due to slippage exceeding max allowed
      expect(e.message).toEqual("Swap failed.");
    }
  }, 15_000);

  it("Swap by providing quote params", async () => {
    const amount = 50_000_000;
    try {
      const txIdSwap = await glamClient.jupiterSwap.swap(statePda, {
        inputMint: WSOL.toBase58(),
        outputMint: MSOL.toBase58(),
        amount,
        slippageBps: 10,
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
    const swapInstructions =
      await delegateGlamClient.jupiterSwap.getSwapInstructions(
        quoteResponseForTest,
        glamClient.getVaultPda(statePda),
      );

    try {
      const txIdSwap = await delegateGlamClient.jupiterSwap.swap(
        statePda,
        undefined,
        quoteResponseForTest,
        swapInstructions,
      );
      console.log("swap by swap instructions txId", txIdSwap);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, 15_000);

  it("Create JUP escrow", async () => {
    const vault = glamClient.getVaultPda(statePda);
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("Escrow"), JUP_STAKE_LOCKER.toBuffer(), vault.toBuffer()],
      JUP_VOTE_PROGRAM,
    );
    try {
      const txId = await glamClient.program.methods
        .initLockedVoterEscrow()
        .accounts({
          state: statePda,
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
