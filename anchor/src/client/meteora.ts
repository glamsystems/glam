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
  Keypair,
} from "@solana/web3.js";
import DLMM, {
  binIdToBinArrayIndex,
  BinLiquidity,
  deriveBinArray,
  Strategy,
} from "@meteora-ag/dlmm";

import { BaseClient, TxOptions } from "./base";
import { USDC, WSOL } from "../constants";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const METEORA_DLMM = new PublicKey(
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",
);

const SOL_USDC_MARKET = new PublicKey(
  "5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6",
);
const EVENT_AUTHORITY = new PublicKey(
  "D1ZN9Wj1fRSUQfCjhvnu1hqDMT7hzjzBBpi12nVniYD6",
);

export class MeteoraDlmmClient {
  private _dlmmPool: DLMM;

  public constructor(readonly base: BaseClient) {}

  public async getDlmmPool() {
    if (!this._dlmmPool) {
      this._dlmmPool = await DLMM.create(
        this.base.provider.connection,
        SOL_USDC_MARKET,
      );
    }
    return this._dlmmPool;
  }

  public async initializePosition(
    statePda: PublicKey,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const dlmmPool = await this.getDlmmPool();
    const activeBin = await dlmmPool.getActiveBin();
    const TOTAL_RANGE_INTERVAL = 20; // 20 bins on each side of the active bin
    const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
    const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

    const position = Keypair.generate();

    const tx = await this.base.program.methods
      .meteoraDlmmInitializePosition(minBinId, maxBinId - minBinId + 1)
      .accounts({
        glamState: statePda,
        lbPair: SOL_USDC_MARKET,
        position: position.publicKey,
        eventAuthority: EVENT_AUTHORITY,
        program: METEORA_DLMM,
      })
      .transaction();

    const vTx = await this.base.intoVersionedTransaction(tx, txOptions);
    return await this.base.sendAndConfirm(vTx, [position]);
  }

  public async addLiquidity(
    statePda: PublicKey,
    position: PublicKey,
    amountX: BN,
    txOptions: TxOptions = {},
  ) {
    const dlmmPool = await this.getDlmmPool();
    const { minBinId, maxBinId, binArrayLower, binArrayUpper } =
      await this.minMaxBinsData(dlmmPool, position);

    const { amountY, activeBinId } = await this.getAmounts(dlmmPool, amountX);

    const vaultTokenXAta = this.base.getVaultAta(
      statePda,
      dlmmPool.tokenX.publicKey,
    );
    const vaultTokenYAta = this.base.getVaultAta(
      statePda,
      dlmmPool.tokenY.publicKey,
    );

    const tx = await this.base.program.methods
      .meteoraDlmmAddLiquidityByStrategy({
        amountX,
        amountY,
        activeId: activeBinId,
        maxActiveBinSlippage: 20,
        strategyParameters: {
          minBinId,
          maxBinId,
          strategyType: Strategy.SpotBalanced,
          parameteres: Array(64).fill(0),
        },
      })
      .accounts({
        glamState: statePda,
        position,
        lbPair: SOL_USDC_MARKET,
        binArrayBitmapExtension: dlmmPool.binArrayBitmapExtension
          ? dlmmPool.binArrayBitmapExtension.publicKey
          : METEORA_DLMM,
        userTokenX: vaultTokenXAta,
        userTokenY: vaultTokenYAta,
        reserveX: dlmmPool.tokenX.reserve,
        reserveY: dlmmPool.tokenY.reserve,
        tokenXMint: dlmmPool.tokenX.publicKey,
        tokenYMint: dlmmPool.tokenY.publicKey,
        binArrayLower,
        binArrayUpper,
        tokenXProgram: TOKEN_PROGRAM_ID,
        tokenYProgram: TOKEN_PROGRAM_ID,
        eventAuthority: EVENT_AUTHORITY,
        program: METEORA_DLMM,
      })
      .transaction();
    const vTx = await this.base.intoVersionedTransaction(tx, txOptions);
    return this.base.sendAndConfirm(vTx);
  }

  public async removeLiquidity(
    statePda: PublicKey,
    position: PublicKey,
    bpsToRemove: number,
    txOptions: TxOptions = {},
  ) {
    const dlmmPool = await this.getDlmmPool();
    const { minBinId, maxBinId, binArrayLower, binArrayUpper } =
      await this.minMaxBinsData(dlmmPool, position);

    const vaultTokenXAta = this.base.getVaultAta(
      statePda,
      dlmmPool.tokenX.publicKey,
    );
    const vaultTokenYAta = this.base.getVaultAta(
      statePda,
      dlmmPool.tokenY.publicKey,
    );

    const tx = await this.base.program.methods
      .meteoraDlmmRemoveLiquidityByRange(minBinId, maxBinId, bpsToRemove)
      .accounts({
        glamState: statePda,
        position,
        lbPair: SOL_USDC_MARKET,
        binArrayBitmapExtension: dlmmPool.binArrayBitmapExtension
          ? dlmmPool.binArrayBitmapExtension.publicKey
          : METEORA_DLMM,
        userTokenX: vaultTokenXAta,
        userTokenY: vaultTokenYAta,
        reserveX: dlmmPool.tokenX.reserve,
        reserveY: dlmmPool.tokenY.reserve,
        tokenXMint: dlmmPool.tokenX.publicKey,
        tokenYMint: dlmmPool.tokenY.publicKey,
        binArrayLower,
        binArrayUpper,
        tokenXProgram: TOKEN_PROGRAM_ID,
        tokenYProgram: TOKEN_PROGRAM_ID,
        eventAuthority: EVENT_AUTHORITY,
        program: METEORA_DLMM,
      })
      .transaction();
    const vTx = await this.base.intoVersionedTransaction(tx, txOptions);
    return this.base.sendAndConfirm(vTx);
  }

  public async claimFee(
    statePda: PublicKey,
    position: PublicKey,
    txOptions: TxOptions = {},
  ) {
    const dlmmPool = await this.getDlmmPool();
    const { binArrayLower, binArrayUpper } = await this.minMaxBinsData(
      dlmmPool,
      position,
    );

    const vaultTokenXAta = this.base.getVaultAta(
      statePda,
      dlmmPool.tokenX.publicKey,
    );
    const vaultTokenYAta = this.base.getVaultAta(
      statePda,
      dlmmPool.tokenY.publicKey,
    );

    const tx = await this.base.program.methods
      .meteoraDlmmClaimFee()
      .accounts({
        glamState: statePda,
        position,
        lbPair: SOL_USDC_MARKET,
        binArrayLower,
        binArrayUpper,
        reserveX: dlmmPool.tokenX.reserve,
        reserveY: dlmmPool.tokenY.reserve,
        userTokenX: vaultTokenXAta,
        userTokenY: vaultTokenYAta,
        tokenXMint: dlmmPool.tokenX.publicKey,
        tokenYMint: dlmmPool.tokenY.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        eventAuthority: EVENT_AUTHORITY,
        program: METEORA_DLMM,
      })
      .transaction();

    const vTx = await this.base.intoVersionedTransaction(tx, txOptions);
    return await this.base.sendAndConfirm(vTx);
  }

  public async closePosition(
    statePda: PublicKey,
    position: PublicKey,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const dlmmPool = await this.getDlmmPool();
    const { binArrayLower, binArrayUpper } = await this.minMaxBinsData(
      dlmmPool,
      position,
    );

    const tx = await this.base.program.methods
      .meteoraDlmmClosePosition()
      .accounts({
        glamState: statePda,
        position,
        lbPair: SOL_USDC_MARKET,
        binArrayLower,
        binArrayUpper,
        eventAuthority: EVENT_AUTHORITY,
        program: METEORA_DLMM,
      })
      .transaction();

    const vTx = await this.base.intoVersionedTransaction(tx, txOptions);

    return await this.base.sendAndConfirm(vTx);
  }

  async minMaxBinsData(dlmmPool: DLMM, position: PublicKey) {
    const lbPosition = await dlmmPool.getPosition(position);
    const { lowerBinId: minBinId, upperBinId: maxBinId } =
      lbPosition.positionData;

    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(minBinId));
    const [binArrayLower] = deriveBinArray(
      SOL_USDC_MARKET,
      lowerBinArrayIndex,
      METEORA_DLMM,
    );

    const upperBinArrayIndex = BN.max(
      lowerBinArrayIndex.add(new BN(1)),
      binIdToBinArrayIndex(new BN(maxBinId)),
    );
    const [binArrayUpper] = deriveBinArray(
      SOL_USDC_MARKET,
      upperBinArrayIndex,
      METEORA_DLMM,
    );

    return { minBinId, maxBinId, binArrayLower, binArrayUpper };
  }

  async getAmounts(dlmmPool: DLMM, amountX: BN) {
    const activeBin = await dlmmPool.getActiveBin();
    const activeBinPricePerToken = dlmmPool.fromPricePerLamport(
      Number(activeBin.price),
    );
    const amountY = amountX.mul(new BN(Number(activeBinPricePerToken)));
    return { amountX, amountY, activeBinId: activeBin.binId };
  }
}
