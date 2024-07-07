import * as anchor from "@coral-xyz/anchor";

import { createFundForTest, sleep } from "./setup";
import { GlamClient } from "../src";
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_STAKE_HISTORY_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import {
  getStakePoolAccount,
  STAKE_POOL_PROGRAM_ID,
} from "@solana/spl-stake-pool";
import { newStakeAccount } from "@solana/spl-stake-pool/dist/utils";

const SANCTUM_STAKE_POOL_PROGRAM_ID = new PublicKey(
  "SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY"
);

const JITO_STAKE_POOL = new PublicKey(
  "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb"
);
const BONK_STAKE_POOL = new PublicKey(
  "ArAQfbzsdotoKB5jJcZa3ajQrrPcWr2YQoDAEAiFxJAC"
);

const STAKE_PROGRAM_ID = new PublicKey(
  "Stake11111111111111111111111111111111111111"
);

const findWithdrawAuthorityProgramAddress = (
  programId: PublicKey,
  stakePoolAddress: PublicKey
) => {
  const [publicKey] = PublicKey.findProgramAddressSync(
    [stakePoolAddress.toBuffer(), Buffer.from("withdraw")],
    programId
  );
  return publicKey;
};
const glamClient = new GlamClient();
const connection = glamClient.provider.connection;

describe("glam_stakepool", () => {
  let fundPDA;

  it("Create fund with 100 SOL in treasury", async () => {
    const fundData = await createFundForTest(glamClient);
    fundPDA = fundData.fundPDA;

    const airdropTx = await connection.requestAirdrop(
      fundData.treasuryPDA,
      100_000_000_000
    );
    await connection.confirmTransaction({
      ...(await connection.getLatestBlockhash()),
      signature: airdropTx,
    });
  });

  it("Deposit SOL to jito stake pool and withdraw", async () => {
    const stakePoolAccount = await getStakePoolAccount(
      // @ts-ignore
      connection,
      JITO_STAKE_POOL
    );
    const stakePoolData = stakePoolAccount.account.data;
    const withdrawAuthority = findWithdrawAuthorityProgramAddress(
      STAKE_POOL_PROGRAM_ID,
      JITO_STAKE_POOL
    );
    const validatorAccount = new PublicKey(
      "HUQEx8TDgEnhtuq6iXj9Rg3yVyX4tF85kS1k7jTnAaqR"
    );

    console.log("stakePoolData:", JSON.stringify(stakePoolData));

    try {
      let txSig = await glamClient.program.methods
        .stakePoolDeposit(new anchor.BN(1000_000_000))
        .accounts({
          fund: fundPDA,
          treasury: glamClient.getTreasuryPDA(fundPDA),
          manager: glamClient.getManager(),
          poolMint: stakePoolData.poolMint,
          mintTo: glamClient.getTreasuryAta(fundPDA, stakePoolData.poolMint),
          feeAccount: stakePoolData.managerFeeAccount,
          stakePool: JITO_STAKE_POOL,
          reserveStake: stakePoolData.reserveStake,
          withdrawAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          stakePoolProgram: STAKE_POOL_PROGRAM_ID,
        })
        .rpc();
      console.log("stakePoolDeposit tx:", txSig);

      txSig = await glamClient.program.methods
        .stakePoolWithdrawSol(new anchor.BN(500_000_000))
        .accounts({
          fund: fundPDA,
          treasury: glamClient.getTreasuryPDA(fundPDA),
          manager: glamClient.getManager(),
          poolMint: stakePoolData.poolMint,
          poolTokenAta: glamClient.getTreasuryAta(
            fundPDA,
            stakePoolData.poolMint
          ),
          feeAccount: stakePoolData.managerFeeAccount,
          stakePool: JITO_STAKE_POOL,
          reserveStake: stakePoolData.reserveStake,
          withdrawAuthority,
          sysvarClock: SYSVAR_CLOCK_PUBKEY,
          sysvarStakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
          nativeStakeProgram: STAKE_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          stakePoolProgram: STAKE_POOL_PROGRAM_ID,
        })
        .rpc();
      console.log("stakePoolWithdraw tx:", txSig);

      const [stakeAccountPda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake_account"), fundPDA.toBuffer()],
        glamClient.program.programId
      );
      console.log("stakeAccountPda:", stakeAccountPda.toBase58());

      const tx = await glamClient.program.methods
        .stakePoolWithdrawStake(new anchor.BN(100_000_000), bump)
        .accounts({
          fund: fundPDA,
          treasury: glamClient.getTreasuryPDA(fundPDA),
          manager: glamClient.getManager(),
          poolMint: stakePoolData.poolMint,
          poolTokenAta: glamClient.getTreasuryAta(
            fundPDA,
            stakePoolData.poolMint
          ),
          stakeAccount: stakeAccountPda,
          feeAccount: stakePoolData.managerFeeAccount,
          stakePool: JITO_STAKE_POOL,
          validatorList: stakePoolData.validatorList,
          validatorAccount,
          withdrawAuthority,
          sysvarClock: SYSVAR_CLOCK_PUBKEY,
          nativeStakeProgram: STAKE_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          stakePoolProgram: STAKE_POOL_PROGRAM_ID,
        })
        .rpc();
      // .transaction();
      // const stakeAccountRentExemption =
      //   await connection.getMinimumBalanceForRentExemption(200);
      // newStakeAccount(
      //   glamClient.getManager(),
      //   tx.instructions,
      //   stakeAccountRentExemption
      // );
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Deposit SOL to bonk stake pool", async () => {
    const stakePoolAccount = await getStakePoolAccount(
      // @ts-ignore
      connection,
      BONK_STAKE_POOL
    );
    const stakePoolData = stakePoolAccount.account.data;
    const withdrawAuthority = findWithdrawAuthorityProgramAddress(
      SANCTUM_STAKE_POOL_PROGRAM_ID,
      BONK_STAKE_POOL
    );

    try {
      let txSig = await glamClient.program.methods
        .stakePoolDeposit(new anchor.BN(10_000_000))
        .accounts({
          fund: fundPDA,
          treasury: glamClient.getTreasuryPDA(fundPDA),
          manager: glamClient.getManager(),
          poolMint: stakePoolData.poolMint,
          mintTo: glamClient.getTreasuryAta(fundPDA, stakePoolData.poolMint),
          feeAccount: stakePoolData.managerFeeAccount,
          stakePool: BONK_STAKE_POOL,
          reserveStake: stakePoolData.reserveStake,
          withdrawAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          stakePoolProgram: SANCTUM_STAKE_POOL_PROGRAM_ID,
        })
        .rpc();
      console.log("stakePoolDeposit tx:", txSig);

      // Sanctum stake pool program may not support withdraw SOL?
      // TODO: check if it's possible to withdraw SOL from sanctum stake pool
      /*
      txSig = await glamClient.program.methods
        .stakePoolWithdrawSol(new anchor.BN(5_000_000))
        .accounts({
          fund: fundPDA,
          treasury: glamClient.getTreasuryPDA(fundPDA),
          manager: glamClient.getManager(),
          poolMint: stakePoolData.poolMint,
          poolTokenAta: glamClient.getTreasuryAta(
            fundPDA,
            stakePoolData.poolMint
          ),
          feeAccount: stakePoolData.managerFeeAccount,
          stakePool: BONK_STAKE_POOL,
          reserveStake: stakePoolData.reserveStake,
          withdrawAuthority,
          sysvarClock: SYSVAR_CLOCK_PUBKEY,
          sysvarStakeHistory: SYSVAR_STAKE_HISTORY_PUBKEY,
          nativeStakeProgram: STAKE_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          stakePoolProgram: SANCTUM_STAKE_POOL_PROGRAM_ID,
        })
        .rpc();
      console.log("stakePoolWithdraw tx:", txSig);
      */
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
