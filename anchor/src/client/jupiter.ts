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
    quoteParams?: any,
    quoteResponse?: any,
    swapInstruction?: any,
    addressLookupTableAddresses?: any
  ): Promise<TransactionSignature> {
    const tx = await this.swapTxBuilder(
      fund,
      this.base.getManager(),
      this.base.getTreasuryAta(fund, quoteParams.outputMint),
      quoteParams,
      quoteResponse,
      swapInstruction,
      addressLookupTableAddresses
    );
    return await this.base.provider.sendAndConfirm(tx, [
      this.base.getWalletSigner()
    ]);
  }

  ixDataToTransactionInstruction = (ixPayload: any) => {
    if (ixPayload === null) {
      return null;
    }

    return new TransactionInstruction({
      programId: new PublicKey(ixPayload.programId),
      keys: ixPayload.accounts.map((key) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable
      })),
      data: Buffer.from(ixPayload.data, "base64")
    });
  };

  getAdressLookupTableAccounts = async (
    keys: string[]
  ): Promise<AddressLookupTableAccount[]> => {
    const addressLookupTableAccountInfos =
      await this.base.provider.connection.getMultipleAccountsInfo(
        keys.map((key) => new PublicKey(key))
      );

    return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
      const addressLookupTableAddress = keys[index];
      if (accountInfo) {
        const addressLookupTableAccount = new AddressLookupTableAccount({
          key: new PublicKey(addressLookupTableAddress),
          state: AddressLookupTableAccount.deserialize(accountInfo.data)
        });
        acc.push(addressLookupTableAccount);
      }

      return acc;
    }, new Array<AddressLookupTableAccount>());
  };

  /*
   * Tx Builders
   */

  async swapTxBuilder(
    fund: PublicKey,
    manager: PublicKey,
    destinationTokenAccount?: PublicKey,
    quoteParams?: any,
    quoteResponse?: any,
    swapInstruction?: any,
    addressLookupTableAddresses?: string[]
  ): Promise<VersionedTransaction> /* MethodsBuilder<Glam, ?> */ {
    if (swapInstruction === undefined) {
      if (quoteResponse === undefined) {
        // Fetch quoteResponse if not specified - quoteParams must be specified in this case
        if (quoteParams === undefined) {
          throw new Error(
            "quoteParams must be specified when quoteResponse and swapInstruction are not specified."
          );
        }
        console.log("Fetching quoteResponse with quoteParams:", quoteParams);
        quoteResponse = await this.getQuoteResponse(quoteParams);
      }

      const ins = await this.getSwapInstructions(
        quoteResponse,
        manager,
        destinationTokenAccount
      );
      console.log("/swap-instructions returns:", JSON.stringify(ins));
      swapInstruction = ins.swapInstruction;
      addressLookupTableAddresses = ins.addressLookupTableAddresses;
    }

    console.log("swapInstruction:", swapInstruction);

    const swapIx = this.ixDataToTransactionInstruction(swapInstruction);
    const instructions = [
      await this.base.program.methods
        .jupiterSwap(new anchor.BN(quoteParams.amount), swapIx.data)
        .accounts({
          fund,
          manager,
          managerWsolAta: this.base.getManagerAta(quoteParams.inputMint),
          treasury: this.base.getTreasuryPDA(fund),
          treasuryMsolAta: destinationTokenAccount,
          wsolMint: quoteParams.inputMint,
          msolMint: quoteParams.outputMint,
          jupiterProgram
        })
        .remainingAccounts(swapIx.keys)
        .instruction()
    ];
    const addressLookupTableAccounts = await this.getAdressLookupTableAccounts(
      addressLookupTableAddresses
    );
    const messageV0 = new TransactionMessage({
      payerKey: this.base.getWalletSigner().publicKey,
      recentBlockhash: (
        await this.base.provider.connection.getLatestBlockhash()
      ).blockhash,
      instructions
    }).compileToV0Message(addressLookupTableAccounts);

    return new VersionedTransaction(messageV0);
  }

  public async getQuoteResponse(quoteParams: any): Promise<any> {
    const res = await fetch(
      `${this.base.jupiterApi}/quote?` +
        new URLSearchParams(Object.entries(quoteParams))
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Failed to fetch quote: ${data}`);
    }
    return data;
  }

  async getSwapInstructions(
    quoteResponse: any,
    from: PublicKey,
    to?: PublicKey
  ): Promise<any> {
    const res = await fetch(`${this.base.jupiterApi}/swap-instructions`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: from.toBase58(),
        destinationTokenAccount: to?.toBase58()
      })
    });

    return await res.json();
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
