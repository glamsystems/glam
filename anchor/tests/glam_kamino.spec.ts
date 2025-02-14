import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { airdrop, createGlamStateForTest } from "./setup";
import { GlamClient, WSOL } from "../src";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

// Kamino prod and staging use the same Farms program
const KaminoFarmsProgramId = new PublicKey(
  "FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr",
);

const kLendProgramId = {
  prod: new PublicKey("KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD"),
  staging: new PublicKey("SLendK7ySfcEzyaFqy93gDnD3RtrpXJcnRwb6zFHJSh"),
};

// Kamino has multiple lending markets, use the main market for tests
const lendingMarketMain = {
  prod: new PublicKey("H6rHXmXoCQvq8Ue81MqNh7ow5ysPa1dSozwW3PU1dDH6"),
  staging: new PublicKey("6WVSwDQXrBZeQVnu6hpnsRZhodaJTZBUaC334SiiBKdb"),
};

const solReserve = {
  prod: new PublicKey("6gTJfuPHEg6uRAijRkMqNc9kan4sVZejKMxmvx2grT1p"),
  staging: new PublicKey("EaAuYkMrA9rmnU9eVvHi63yqZzKzmnVj3PWFnmW9RD4W"),
};

const lendingMarketAuthority = {
  prod: new PublicKey("Dx8iy2o46sK1DzWbEcznqSKeLbLVeu7otkibA3WohGAj"),
  staging: new PublicKey("4zzBjUgjuNUrGqt8Xrig7SDLqBPgZo3v3R7YEuBQoiC4"),
};

const reserveFarmState = {
  prod: new PublicKey("BgMEUzcjkJxEH1PdPkZyv3NbUynwbkPiNJ7X2x7G1JmH"),
  staging: new PublicKey("CtGYmztwXGrDtUrRCEydrwkwpJ7ptAY5BkfzThkVPPK9"),
};

const reserveLiquiditySupply = {
  prod: new PublicKey("ywaaLvG7t1vXJo8sT3UzE8yzzZtxLM7Fmev64Jbooye"),
  staging: new PublicKey("GaTJgVfgUTTYyZYTQB36rXTQEbv1i1LUvfGSBDAr2An1"),
};

const reserveCollateralMint = {
  prod: new PublicKey("DxzDt5kPdFkMy9AANiZh4zuoitobqsn1G6bdoNyjePC2"),
  staging: new PublicKey("966sqybMQJfwYgiEDQqiFsSK5o9tFPyBptZ3GFXbF7vR"),
};

const reserveDestinationDepositCollateral = {
  prod: new PublicKey("8qnXfbaLbY6Y4xiCP6SZ3RK8ccjVa8DhALzDGifBPeNx"),
  staging: new PublicKey("DZpgVJq3WpwRpPXNwzvLwVMerJodqCiitxAeU5QgkJe3"),
};

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
      kLendProgramId.staging,
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
          referrerUserMetadata: kLendProgramId.staging, // none
        })
        .rpc();
      console.log("Init user metadata:", tx);

      const args = { tag: 0, id: 0 };
      const seed = [
        Buffer.from([args.tag]),
        Buffer.from([args.id]),
        vaultPda.toBuffer(),
        lendingMarketMain.staging.toBuffer(),
        PublicKey.default.toBuffer(),
        PublicKey.default.toBuffer(),
      ];
      const [obligation, _] = PublicKey.findProgramAddressSync(
        seed,
        kLendProgramId.staging,
      );
      const tx2 = await glamClient.program.methods
        .kaminoLendingInitObligation(args)
        .accounts({
          glamState: statePda,
          obligationOwner: vaultPda,
          obligation,
          lendingMarket: lendingMarketMain.staging,
          seed1Account: new PublicKey(0),
          seed2Account: new PublicKey(0),
          ownerUserMetadata: userMetadataPda,
        })
        .rpc();
      console.log("Init obligation:", tx2);

      // 3. init obligation farms for reserve
      // TODO: can reserve farm state be derived from reserve?
      const [obligationFarm] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("user"),
          reserveFarmState.staging.toBuffer(),
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
          lendingMarketAuthority: lendingMarketAuthority.staging,
          reserve: solReserve.staging,
          reserveFarmState: reserveFarmState.staging,
          obligationFarm,
          lendingMarket: lendingMarketMain.staging,
          farmsProgram: KaminoFarmsProgramId,
        })
        .rpc();
      console.log("Init obligation farms:", tx3);

      // 4. refresh obligation farms for reserve
      // const tx4 = await glamClient.program.methods
      //   .kaminoLendingRefreshObligationFarmsForReserve(0)
      //   .accounts({
      //     glamState: statePda,
      //     crank: vaultPda,
      //     obligation,
      //     lendingMarketAuthority: lendingMarketAuthority.staging,
      //     reserve: solReserve.staging,
      //     reserveFarmState: reserveFarmState.staging,
      //     obligationFarmUserState: obligationFarm,
      //     lendingMarket: lendingMarketMain.staging,
      //     farmsProgram: KaminoFarmsProgramId,
      //   })
      //   .rpc();
      // console.log("Refresh obligation farms:", tx4);

      // 5. deposit reserve liquidity and obligation collateral
      const amount = new BN(100_000_000);
      const tx5 = await glamClient.program.methods
        .kaminoLendingDepositReserveLiquidityAndObligationCollateral(amount)
        .accounts({
          glamState: statePda,
          owner: vaultPda,
          obligation,
          lendingMarket: lendingMarketMain.staging,
          lendingMarketAuthority: lendingMarketAuthority.staging,
          reserve: solReserve.staging,
          reserveLiquidityMint: WSOL,
          reserveLiquiditySupply: reserveLiquiditySupply.staging,
          reserveCollateralMint: reserveCollateralMint.staging,
          reserveDestinationDepositCollateral:
            reserveDestinationDepositCollateral.staging,
          userSourceLiquidity: glamClient.getVaultAta(statePda, WSOL),
          placeholderUserDestinationCollateral: kLendProgramId.staging,
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
