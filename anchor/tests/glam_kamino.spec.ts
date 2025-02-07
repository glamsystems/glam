import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { BN, Wallet } from "@coral-xyz/anchor";

import {
  airdrop,
  createGlamStateForTest,
  stateModelForTest,
  str2seed,
} from "./setup";
import {
  StateModel,
  GlamClient,
  GlamError,
  MSOL,
  ShareClassModel,
  USDC,
  WSOL,
} from "../src";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const KaminoLendProgramId = new PublicKey(
  "KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD",
);
const KaminoFarmsProgramId = new PublicKey(
  "FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr",
);

describe("glam_kamino", () => {
  const glamClient = new GlamClient();
  let statePda: PublicKey;
  let vaultPda: PublicKey;

  it("Initialize glam state", async () => {
    const stateData = await createGlamStateForTest(glamClient);
    statePda = stateData.statePda;

    const stateModel = await glamClient.fetchState(statePda);
    vaultPda = stateModel.vaultPda;

    await airdrop(
      glamClient.provider.connection,
      stateData.vaultPda,
      10_000_000_000,
    );

    // Enable kamino lending
    await glamClient.state.updateState(statePda, {
      integrations: [{ kaminoLending: {} }],
    });

    await glamClient.wsol.wrap(statePda, new BN(1_000_000_000));
  });

  it("Init kamino user metadata", async () => {
    const [userMetadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_meta"), vaultPda.toBuffer()],
      KaminoLendProgramId,
    );
    console.log("vaultPda", vaultPda.toBase58());
    console.log("Kamino userMetadataPda for vault", userMetadataPda.toBase58());

    try {
      const tx = await glamClient.program.methods
        .kaminoLendingInitUserMetadata(new PublicKey(0))
        .accounts({
          glamState: statePda,
          owner: vaultPda,
          userMetadata: userMetadataPda,
          referrerUserMetadata: KaminoLendProgramId, // none
        })
        .rpc();
      console.log("Init user metadata:", tx);

      const lendingMarket = new PublicKey(
        "H6rHXmXoCQvq8Ue81MqNh7ow5ysPa1dSozwW3PU1dDH6",
      );
      const args = { tag: 0, id: 0 };
      const seed = [
        Buffer.from([args.tag]),
        Buffer.from([args.id]),
        vaultPda.toBuffer(),
        lendingMarket.toBuffer(),
        PublicKey.default.toBuffer(),
        PublicKey.default.toBuffer(),
      ];
      const [obligation, _] = PublicKey.findProgramAddressSync(
        seed,
        KaminoLendProgramId,
      );
      const tx2 = await glamClient.program.methods
        .kaminoLendingInitObligation(args)
        .accounts({
          glamState: statePda,
          obligationOwner: vaultPda,
          obligation,
          lendingMarket,
          seed1Account: new PublicKey(0),
          seed2Account: new PublicKey(0),
          ownerUserMetadata: userMetadataPda,
        })
        .rpc();
      console.log("Init obligation:", tx2);

      // 3. init obligation farms for reserve
      const reserve = new PublicKey(
        "6gTJfuPHEg6uRAijRkMqNc9kan4sVZejKMxmvx2grT1p",
      );
      // TODO: can reserve farm state be derived from reserve?
      const reserveFarmState = new PublicKey(
        "BgMEUzcjkJxEH1PdPkZyv3NbUynwbkPiNJ7X2x7G1JmH",
      );
      const lendingMarketAuthority = new PublicKey(
        "Dx8iy2o46sK1DzWbEcznqSKeLbLVeu7otkibA3WohGAj",
      );
      const [obligationFarm] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("user"),
          reserveFarmState.toBuffer(),
          obligation.toBuffer(),
        ],
        KaminoFarmsProgramId,
      );
      const tx3 = await glamClient.program.methods
        .kaminoLendingInitObligationFarmsForReserve(0)
        .accounts({
          glamState: statePda,
          owner: vaultPda,
          obligation,
          lendingMarketAuthority,
          reserve,
          reserveFarmState,
          obligationFarm,
          lendingMarket,
          farmsProgram: KaminoFarmsProgramId,
        })
        .rpc();
      console.log("Init obligation farms:", tx3);

      // 4. refresh obligation farms for reserve
      const tx4 = await glamClient.program.methods
        .kaminoLendingRefreshObligationFarmsForReserve(0)
        .accounts({
          glamState: statePda,
          crank: vaultPda,
          obligation,
          lendingMarketAuthority,
          reserve,
          reserveFarmState,
          obligationFarmUserState: obligationFarm,
          lendingMarket,
          farmsProgram: KaminoFarmsProgramId,
        })
        .rpc();
      console.log("Refresh obligation farms:", tx4);

      // 5. deposit reserve liquidity and obligation collateral
      const amount = new BN(100_000_000);
      const tx5 = await glamClient.program.methods
        .kaminoLendingDepositReserveLiquidityAndObligationCollateral(amount)
        .accounts({
          glamState: statePda,
          owner: vaultPda,
          obligation,
          lendingMarket,
          lendingMarketAuthority,
          reserve,
          reserveLiquidityMint: WSOL,
          reserveLiquiditySupply: new PublicKey(
            "ywaaLvG7t1vXJo8sT3UzE8yzzZtxLM7Fmev64Jbooye",
          ),
          reserveCollateralMint: new PublicKey(
            "DxzDt5kPdFkMy9AANiZh4zuoitobqsn1G6bdoNyjePC2",
          ),
          // ata
          // owner Dx8iy2o46sK1DzWbEcznqSKeLbLVeu7otkibA3WohGAj
          // mint: DxzDt5kPdFkMy9AANiZh4zuoitobqsn1G6bdoNyjePC2
          reserveDestinationDepositCollateral: new PublicKey(
            "8qnXfbaLbY6Y4xiCP6SZ3RK8ccjVa8DhALzDGifBPeNx",
          ),
          userSourceLiquidity: glamClient.getVaultAta(statePda, WSOL),
          placeholderUserDestinationCollateral: KaminoLendProgramId,
          collateralTokenProgram: TOKEN_PROGRAM_ID,
          liquidityTokenProgram: TOKEN_PROGRAM_ID,
          instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .rpc();
      console.log("Deposit reserve liquidity and obligation collateral:", tx5);
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  });
});
