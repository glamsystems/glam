import * as anchor from "@coral-xyz/anchor";
import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
  TransactionSignature,
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";

import { BaseClient } from "./base";

const jupiterProgram = new PublicKey(
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
);

export class JupiterClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async swap(
    fund: PublicKey,
    quote?: any,
    quoteResponse?: any,
    swapInstruction?: any,
    addressLookupTableAddresses?: any
  ): Promise<TransactionSignature> {
    const tx = await this.swapTxBuilder(
      fund,
      this.base.getManager(),
      quote,
      quoteResponse,
      swapInstruction,
      addressLookupTableAddresses
    );
    tx.sign([this.base.getWalletSigner()]);
    return await this.base.provider.connection.sendTransaction(tx);
  }

  /*
   * Tx Builders
   */

  async swapTxBuilder(
    fund: PublicKey,
    manager: PublicKey,
    quote?: any,
    quoteResponse?: any,
    swapInstruction?: any,
    addressLookupTableAddresses?: string[]
  ): Promise<VersionedTransaction> /* MethodsBuilder<Glam, ?> */ {
    if (swapInstruction === undefined) {
      if (quoteResponse === undefined) {
        /* Fetch quoteResponse is not specified */
        console.log("Fetching quoteResponse...");
        quoteResponse = await this.getQuoteResponse(quote);
      }
      /* Fetch swapInstruction is not specified */
      console.log("Fetching swapInstruction...");
      [swapInstruction, addressLookupTableAddresses] =
        await this.getSwapInstruction({
          userPublicKey: manager,
          quoteResponse
        });
    }
    // console.log("swapInstruction", swapInstruction);
    /* Create the tx for jupiterSwap using the swapInstruction */
    const tx = await this.base.program.methods
      .jupiterSwap(swapInstruction.data)
      .accounts({
        fund,
        manager,
        treasury: this.base.getTreasuryPDA(fund),
        jupiterProgram
      })
      .remainingAccounts(swapInstruction.keys)
      .transaction();

    const connection = this.base.provider.connection;
    const lookupTableAccounts = (
      await Promise.all(
        (addressLookupTableAddresses || []).map(
          async (address) =>
            (
              await connection.getAddressLookupTable(new PublicKey(address))
            ).value
        )
      )
    ).filter((x) => !!x) as AddressLookupTableAccount[];

    const messageV0 = new TransactionMessage({
      payerKey: manager,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
      instructions: tx.instructions
    }).compileToV0Message(lookupTableAccounts);

    return new VersionedTransaction(messageV0);
  }

  public async getQuoteResponse(quote: any): Promise<any> {
    const res = await fetch(
      `${this.base.jupiterApi}/quote?` +
        new URLSearchParams(Object.entries(quote))
    );
    const quoteResponse = await res.json();
    // console.log("quoteResponse", quoteResponse);
    return quoteResponse;
  }

  public async getSwapInstructions(quoteResponse: any): Promise<any> {
    const res = await fetch(`${this.base.jupiterApi}/swap-instructions`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quoteResponse)
    });

    const instructions = await res.json();
    return instructions;
  }

  async getSwapInstruction(
    quoteResponse: any
  ): Promise<[TransactionInstruction, string[]]> {
    const { swapInstruction, addressLookupTableAddresses } =
      await this.getSwapInstructions(quoteResponse);

    return [
      new TransactionInstruction({
        programId: new PublicKey(swapInstruction.programId),
        keys: swapInstruction.accounts.map((key: any) => ({
          pubkey: new PublicKey(key.pubkey),
          isSigner: key.isSigner,
          isWritable: key.isWritable
        })),
        data: Buffer.from(swapInstruction.data, "base64")
      }),
      addressLookupTableAddresses
    ];
  }

  /*
   * API methods
   */

  public async swapTx(
    fund: PublicKey,
    manager: PublicKey,
    quote?: any,
    quoteResponse?: any,
    swapInstruction?: any,
    addressLookupTableAddresses?: any
  ): Promise<VersionedTransaction> {
    return await this.swapTxBuilder(
      fund,
      manager,
      quote,
      quoteResponse,
      swapInstruction,
      addressLookupTableAddresses
    );
  }
}
