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

const DEFAULT_RANGE_INTERVAL = 34; // 34 bins on each side of the active bin, 69 bins in total

export class MeteoraDlmmClient {
  private _dlmmPool: Map<string, DLMM> = new Map();

  public constructor(readonly base: BaseClient) {}

  public async getDlmmPool(pool: PublicKey | string): Promise<DLMM> {
    const key = typeof pool === "string" ? pool : pool.toString();
    if (!this._dlmmPool.get(key)) {
      this._dlmmPool.set(
        key,
        await DLMM.create(this.base.provider.connection, new PublicKey(pool)),
      );
    }
    const dlmmPool = this._dlmmPool.get(key);
    if (!dlmmPool) {
      throw new Error(`DLMM pool ${key} not found`);
    }
    return dlmmPool;
  }

  public async initializePosition(
    statePda: PublicKey | string,
    pool: PublicKey | string,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const glamState = new PublicKey(statePda);

    const dlmmPool = await this.getDlmmPool(pool);
    const activeBin = await dlmmPool.getActiveBin();
    const minBinId = activeBin.binId - DEFAULT_RANGE_INTERVAL;
    const maxBinId = activeBin.binId + DEFAULT_RANGE_INTERVAL;

    const position = Keypair.generate();

    const tx = await this.base.program.methods
      .meteoraDlmmInitializePosition(minBinId, maxBinId - minBinId + 1)
      .accounts({
        glamState,
        lbPair: new PublicKey(pool),
        position: position.publicKey,
        eventAuthority: EVENT_AUTHORITY,
        program: METEORA_DLMM,
      })
      .transaction();

    const vTx = await this.base.intoVersionedTransaction(tx, txOptions);
    return await this.base.sendAndConfirm(vTx, [position]);
  }

  public async addLiquidity(
    statePda: PublicKey | string,
    position: PublicKey | string,
    amountX: BN | number,
    strategyType: keyof typeof Strategy,
    txOptions: TxOptions = {},
  ) {
    const { lbPair, lowerBinId, upperBinId, binArrayLower, binArrayUpper } =
      await this.parsePosition(new PublicKey(position));

    const dlmmPool = await this.getDlmmPool(lbPair);
    const { amountY, activeBinId } = await this.getAmounts(
      dlmmPool,
      new BN(amountX),
    );

    const glamState = new PublicKey(statePda);
    const vaultTokenXAta = this.base.getVaultAta(
      glamState,
      dlmmPool.tokenX.publicKey,
    );
    const vaultTokenYAta = this.base.getVaultAta(
      glamState,
      dlmmPool.tokenY.publicKey,
    );

    const strategy = {
      amountX: new BN(amountX),
      amountY,
      activeId: activeBinId,
      maxActiveBinSlippage: 20,
      strategyParameters: {
        minBinId: lowerBinId,
        maxBinId: upperBinId,
        strategyType: Strategy[strategyType],
        parameteres: Array(64).fill(0),
      },
    };
    const tx = await this.base.program.methods
      .meteoraDlmmAddLiquidityByStrategy(strategy)
      .accounts({
        glamState,
        position: new PublicKey(position),
        lbPair,
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
    statePda: PublicKey | string,
    position: PublicKey | string,
    bpsToRemove: number,
    txOptions: TxOptions = {},
  ) {
    const { lbPair, lowerBinId, upperBinId, binArrayLower, binArrayUpper } =
      await this.parsePosition(new PublicKey(position));
    const dlmmPool = await this.getDlmmPool(lbPair);

    const glamState = new PublicKey(statePda);
    const vaultTokenXAta = this.base.getVaultAta(
      glamState,
      dlmmPool.tokenX.publicKey,
    );
    const vaultTokenYAta = this.base.getVaultAta(
      glamState,
      dlmmPool.tokenY.publicKey,
    );

    const tx = await this.base.program.methods
      .meteoraDlmmRemoveLiquidityByRange(lowerBinId, upperBinId, bpsToRemove)
      .accounts({
        glamState,
        position: new PublicKey(position),
        lbPair,
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
    statePda: PublicKey | string,
    position: PublicKey | string,
    txOptions: TxOptions = {},
  ) {
    const { lbPair, binArrayLower, binArrayUpper } = await this.parsePosition(
      new PublicKey(position),
    );
    const dlmmPool = await this.getDlmmPool(lbPair);

    const glamState = new PublicKey(statePda);
    const vaultTokenXAta = this.base.getVaultAta(
      glamState,
      dlmmPool.tokenX.publicKey,
    );
    const vaultTokenYAta = this.base.getVaultAta(
      glamState,
      dlmmPool.tokenY.publicKey,
    );

    const tx = await this.base.program.methods
      .meteoraDlmmClaimFee()
      .accounts({
        glamState,
        position: new PublicKey(position),
        lbPair,
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
    statePda: PublicKey | string,
    position: PublicKey | string,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const { lbPair, binArrayLower, binArrayUpper } = await this.parsePosition(
      new PublicKey(position),
    );
    const glamState = new PublicKey(statePda);

    const tx = await this.base.program.methods
      .meteoraDlmmClosePosition()
      .accounts({
        glamState,
        position: new PublicKey(position),
        lbPair,
        binArrayLower,
        binArrayUpper,
        eventAuthority: EVENT_AUTHORITY,
        program: METEORA_DLMM,
      })
      .transaction();

    const vTx = await this.base.intoVersionedTransaction(tx, txOptions);

    return await this.base.sendAndConfirm(vTx);
  }

  async parsePosition(position: PublicKey) {
    const positionAccountInfo =
      await this.base.provider.connection.getAccountInfo(position);
    if (!positionAccountInfo) {
      throw new Error("Position not found");
    }
    const positionData = positionAccountInfo.data;

    const lbPair = new PublicKey(positionData.subarray(8, 40));
    const lowerBinId = positionData.subarray(7912, 7916).readInt32LE();
    const upperBinId = positionData.subarray(7916, 7920).readInt32LE();

    const lowerBinArrayIndex = binIdToBinArrayIndex(new BN(lowerBinId));
    const [binArrayLower] = deriveBinArray(
      lbPair,
      lowerBinArrayIndex,
      METEORA_DLMM,
    );

    const upperBinArrayIndex = BN.max(
      lowerBinArrayIndex.add(new BN(1)),
      binIdToBinArrayIndex(new BN(upperBinId)),
    );
    const [binArrayUpper] = deriveBinArray(
      lbPair,
      upperBinArrayIndex,
      METEORA_DLMM,
    );

    return {
      lowerBinId,
      upperBinId,
      binArrayLower,
      binArrayUpper,
      lbPair,
    };
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
