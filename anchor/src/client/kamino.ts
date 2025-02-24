import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  VersionedTransaction,
  TransactionSignature,
  TransactionInstruction,
  AccountMeta,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";

import { BaseClient, TxOptions } from "./base";
import { WSOL } from "../constants";
import * as borsh from "@coral-xyz/borsh";
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

const scopePrices = new PublicKey(
  "3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C",
);

interface RefreshObligationAccounts {
  lendingMarket: PublicKey;
  obligation: PublicKey;
}

interface RefreshReserveAccounts {
  reserve: PublicKey;
  lendingMarket: PublicKey;
  pythOracle: PublicKey;
  switchboardPriceOracle: PublicKey;
  switchboardTwapOracle: PublicKey;
  scopePrices: PublicKey;
}

interface RefreshObligationFarmsForReserveArgs {
  mode: number;
}

interface RefreshObligationFarmsForReserveAccounts {
  crank: PublicKey;
  baseAccounts: {
    obligation: PublicKey;
    lendingMarketAuthority: PublicKey;
    reserve: PublicKey;
    reserveFarmState: PublicKey;
    obligationFarmUserState: PublicKey;
    lendingMarket: PublicKey;
  };
  farmsProgram: PublicKey;
  rent: PublicKey;
  systemProgram: PublicKey;
}

function refreshObligation(
  accounts: RefreshObligationAccounts,
  programId: PublicKey,
) {
  // First time deposit we don't need additional accounts
  // FIXME: but we need to append Kamino reserve accounts if the obligation uses them
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.lendingMarket, isSigner: false, isWritable: false },
    { pubkey: accounts.obligation, isSigner: false, isWritable: true },
  ];
  const identifier = Buffer.from([33, 132, 147, 228, 151, 192, 72, 89]);
  const data = identifier;
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}

function refreshReserve(
  accounts: RefreshReserveAccounts,
  programId: PublicKey,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.reserve, isSigner: false, isWritable: true },
    { pubkey: accounts.lendingMarket, isSigner: false, isWritable: false },
    { pubkey: accounts.pythOracle, isSigner: false, isWritable: false },
    {
      pubkey: accounts.switchboardPriceOracle,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: accounts.switchboardTwapOracle,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.scopePrices, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([2, 218, 138, 235, 79, 201, 25, 102]);
  const data = identifier;
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}

function refreshObligationFarmsForReserve(
  args: RefreshObligationFarmsForReserveArgs,
  accounts: RefreshObligationFarmsForReserveAccounts,
  programId: PublicKey,
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.crank, isSigner: true, isWritable: false },
    {
      pubkey: accounts.baseAccounts.obligation,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: accounts.baseAccounts.lendingMarketAuthority,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: accounts.baseAccounts.reserve,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: accounts.baseAccounts.reserveFarmState,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: accounts.baseAccounts.obligationFarmUserState,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: accounts.baseAccounts.lendingMarket,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.farmsProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.rent, isSigner: false, isWritable: false },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ];
  const identifier = Buffer.from([140, 144, 253, 21, 10, 74, 248, 3]);
  const buffer = Buffer.alloc(1000);
  const layout = borsh.struct([borsh.u8("mode")]);
  const len = layout.encode(
    {
      mode: args.mode,
    },
    buffer,
  );
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len);
  const ix = new TransactionInstruction({ keys, programId, data });
  return ix;
}

export class KaminoLendingClient {
  public constructor(readonly base: BaseClient) {}

  public async initialize(
    statePda: PublicKey,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.initializeTx(statePda, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  public async deposit(
    statePda: PublicKey,
    amount: BN | number,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.depositTx(statePda, WSOL, amount, txOptions);
    return await this.base.sendAndConfirm(tx);
  }

  getUserMetadataPda(owner: PublicKey) {
    const [userMetadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_meta"), owner.toBuffer()],
      kLendProgramId.staging,
    );
    return userMetadataPda;
  }

  getObligationPda(owner: PublicKey, args: { tag: number; id: number }) {
    const seed = [
      Buffer.from([args.tag]),
      Buffer.from([args.id]),
      owner.toBuffer(),
      lendingMarketMain.staging.toBuffer(),
      PublicKey.default.toBuffer(),
      PublicKey.default.toBuffer(),
    ];
    const [obligation, _] = PublicKey.findProgramAddressSync(
      seed,
      kLendProgramId.staging,
    );
    return obligation;
  }

  getObligationFarm(obligation: PublicKey) {
    const [obligationFarm] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user"),
        reserveFarmState.staging.toBuffer(),
        obligation.toBuffer(),
      ],
      KaminoFarmsProgramId,
    );
    return obligationFarm;
  }

  public async initializeTx(
    statePda: PublicKey,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = await this.base.getVaultPda(statePda);
    const userMetadata = this.getUserMetadataPda(vault);

    const args = { tag: 0, id: 0 };
    const obligation = this.getObligationPda(vault, args);
    const obligationFarm = this.getObligationFarm(obligation);

    const initObligationIx = await this.base.program.methods
      .kaminoLendingInitObligation(args)
      .accounts({
        glamState: statePda,
        glamSigner: signer,
        cpiProgram: kLendProgramId.staging,
        obligationOwner: vault,
        obligation,
        lendingMarket: lendingMarketMain.staging,
        seed1Account: new PublicKey(0),
        seed2Account: new PublicKey(0),
        ownerUserMetadata: userMetadata,
      })
      .instruction();

    const initObligationFarmIx = await this.base.program.methods
      .kaminoLendingInitObligationFarmsForReserve(0)
      .accounts({
        glamState: statePda,
        glamSigner: signer,
        cpiProgram: kLendProgramId.staging,
        owner: vault,
        obligation,
        lendingMarketAuthority: lendingMarketAuthority.staging,
        reserve: solReserve.staging,
        reserveFarmState: reserveFarmState.staging,
        obligationFarm,
        lendingMarket: lendingMarketMain.staging,
        farmsProgram: KaminoFarmsProgramId,
      })
      .instruction();

    const tx = await this.base.program.methods
      .kaminoLendingInitUserMetadata(new PublicKey(0))
      .accounts({
        glamState: statePda,
        glamSigner: signer,
        cpiProgram: kLendProgramId.staging,
        owner: vault,
        userMetadata,
        referrerUserMetadata: kLendProgramId.staging, // none
      })
      .postInstructions([initObligationIx, initObligationFarmIx])
      .transaction();

    const vTx = await this.base.intoVersionedTransaction(tx, txOptions);
    return vTx;
  }

  public async depositTx(
    statePda: PublicKey,
    asset: PublicKey,
    amount: number | BN,
    txOptions: TxOptions,
  ): Promise<VersionedTransaction> {
    if (!asset.equals(WSOL)) {
      throw new Error("Only WSOL is supported");
    }

    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(statePda);
    const args = { tag: 0, id: 0 };
    const obligation = this.getObligationPda(vault, args);
    const obligationFarm = this.getObligationFarm(obligation);

    const refreshIxs = [
      refreshReserve(
        {
          reserve: solReserve.staging,
          lendingMarket: lendingMarketMain.staging,
          pythOracle: kLendProgramId.staging,
          switchboardPriceOracle: kLendProgramId.staging,
          switchboardTwapOracle: kLendProgramId.staging,
          scopePrices,
        },
        kLendProgramId.staging,
      ),
      refreshObligation(
        {
          lendingMarket: lendingMarketMain.staging,
          obligation,
        },
        kLendProgramId.staging,
      ),
      refreshObligationFarmsForReserve(
        { mode: 0 },
        {
          crank: this.base.getSigner(),
          baseAccounts: {
            obligation,
            lendingMarketAuthority: lendingMarketAuthority.staging,
            reserve: solReserve.staging,
            reserveFarmState: reserveFarmState.staging,
            obligationFarmUserState: obligationFarm,
            lendingMarket: lendingMarketMain.staging,
          },
          farmsProgram: KaminoFarmsProgramId,
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
        },
        kLendProgramId.staging,
      ),
    ];

    const tx = await this.base.program.methods
      .kaminoLendingDepositReserveLiquidityAndObligationCollateral(
        new BN(amount),
      )
      .accounts({
        glamState: statePda,
        glamSigner: signer,
        cpiProgram: kLendProgramId.staging,
        owner: vault,
        obligation,
        lendingMarket: lendingMarketMain.staging,
        lendingMarketAuthority: lendingMarketAuthority.staging,
        reserve: solReserve.staging,
        reserveLiquidityMint: asset,
        reserveLiquiditySupply: reserveLiquiditySupply.staging,
        reserveCollateralMint: reserveCollateralMint.staging,
        reserveDestinationDepositCollateral:
          reserveDestinationDepositCollateral.staging,
        userSourceLiquidity: this.base.getVaultAta(statePda, asset),
        placeholderUserDestinationCollateral: kLendProgramId.staging,
        collateralTokenProgram: TOKEN_PROGRAM_ID,
        liquidityTokenProgram: TOKEN_PROGRAM_ID,
        instructionSysvarAccount: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .preInstructions(refreshIxs) // 3 refresh ixs
      .postInstructions([refreshIxs[2]]) // 1 refresh ix
      .transaction();

    const vTx = await this.base.intoVersionedTransaction(tx, txOptions);
    return vTx;
  }
}
