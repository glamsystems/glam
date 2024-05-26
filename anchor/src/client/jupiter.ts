import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionSignature
} from "@solana/web3.js";

import { BaseClient } from "./base";

const jupiterProgram = new PublicKey(
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
);
const JUPITER_API = "https://quote-api.jup.ag/v6";

export class JupiterClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  getQuote = async (
    fromMint: PublicKey,
    toMint: PublicKey,
    amount: number,
    slippage: number,
    onlyDirectRoutes: boolean
  ) => {
    const reponse = await fetch(
      `${JUPITER_API}/quote?outputMint=${toMint.toBase58()}&inputMint=${fromMint.toBase58()}&amount=${amount}&slippage=${slippage}&onlyDirectRoutes=${onlyDirectRoutes}`
    );
    return await reponse.json();
  };

  getSwapIx = async (
    fromAccount: PublicKey,
    toAccount: PublicKey,
    quote: any
  ): Promise<any> => {
    const data = {
      quoteResponse: quote,
      userPublicKey: fromAccount.toBase58(),
      destinationTokenAccount: toAccount.toBase58()
    };
    const response = await fetch(`${JUPITER_API}/swap-instructions`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const resp = await response.json();
    console.log("swap-instructions response:", resp);
    return resp;
  };

  instructionDataToTransactionInstruction = (instructionPayload: any) => {
    if (instructionPayload === null) {
      return null;
    }

    return new TransactionInstruction({
      programId: new PublicKey(instructionPayload.programId),
      keys: instructionPayload.accounts.map((key) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable
      })),
      data: Buffer.from(instructionPayload.data, "base64")
    });
  };

  public async swap(
    fund: PublicKey,
    fromMint: PublicKey,
    toMint: PublicKey,
    amount: BN,
    slippage: number = 0.5,
    onlyDirectRoutes: boolean = true
  ): Promise<TransactionSignature> {
    const quote = await this.getQuote(
      fromMint,
      toMint,
      amount,
      slippage,
      onlyDirectRoutes
    );
    console.log("quote response:", quote);

    const fromAccount = this.base.getTreasuryAta(fund, fromMint);
    const toAccount = this.base.getTreasuryAta(fund, toMint);

    const { swapInstruction } = await this.getSwapIx(
      fromAccount,
      toAccount,
      quote
    );
    let swapIx = this.instructionDataToTransactionInstruction(swapInstruction);

    return this.swapTxBuilder(fund, this.base.getManager(), swapIx.data).rpc();
  }

  /*
   * Tx Builders
   */

  swapTxBuilder(fund: PublicKey, manager: PublicKey, data: Buffer): any {
    return this.base.program.methods.jupiterSwap(data).accounts({
      fund,
      manager,
      treasury: this.base.getTreasuryPDA(fund),
      jupiterProgram
    });
  }

  /*
   * API methods
   */

  public async swapTx(
    fund: PublicKey,
    manager: PublicKey,
    data: Buffer,
    amount: BN
  ): Promise<Transaction> {
    return await this.swapTxBuilder(fund, manager, data, amount).transaction();
  }
}
