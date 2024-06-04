import * as anchor from "@coral-xyz/anchor";
import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
  TransactionSignature,
  TransactionMessage,
  VersionedTransaction,
  AccountMeta
} from "@solana/web3.js";

import { BaseClient } from "./base";

const jupiterProgram = new PublicKey(
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
);

interface QuoteParams {
  inputMint: PublicKey;
  outputMint: PublicKey;
  amount: number;
  autoSlippage?: boolean;
  autoSlippageCollisionUsdValue?: number;
  slippageBps?: number;
  swapMode?: string;
  onlyDirectRoutes?: boolean;
  asLegacyTransaction?: boolean;
  maxAccounts?: number;
}

interface QuoteResponse {
  inputMint: string;
  inAmount: number;
  outputMint: string;
  outAmount: number;
  otherAmountThreshold: number;
  swapMode: string;
  slippageBps: number;
  platformFee?: number;
  priceImpactPct: number;
  routePlan: any[];
  contextSlot: number;
  timeTaken: number;
}

export class JupiterClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async swap(
    fund: PublicKey,
    quoteParams?: QuoteParams,
    quoteResponse?: QuoteResponse,
    swapInstruction?: any,
    addressLookupTableAddresses?: any
  ): Promise<TransactionSignature> {
    const outputMint =
      quoteParams?.outputMint || new PublicKey(quoteResponse!.outputMint);

    const tx = await this.swapTxBuilder(
      fund,
      this.base.getManager(),
      this.base.getTreasuryAta(fund, outputMint),
      quoteParams,
      quoteResponse,
      swapInstruction,
      addressLookupTableAddresses
    );

    return await (this.base.provider as anchor.AnchorProvider).sendAndConfirm(
      tx,
      [this.base.getWalletSigner()]
    );
  }

  ixDataToTransactionInstruction = (ixPayload: {
    programId: string;
    accounts: any[];
    data: string;
  }) => {
    if (ixPayload === null) {
      throw new Error("ixPayload is null");
    }

    return new TransactionInstruction({
      programId: new PublicKey(ixPayload.programId),
      keys: ixPayload.accounts.map((key: any) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable
      })),
      data: Buffer.from(ixPayload.data, "base64")
    });
  };

  getAdressLookupTableAccounts = async (
    keys?: string[]
  ): Promise<AddressLookupTableAccount[]> => {
    if (!keys) {
      throw new Error("addressLookupTableAddresses is undefined");
    }

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
    quoteParams?: QuoteParams,
    quoteResponse?: QuoteResponse,
    swapInstruction?: any,
    addressLookupTableAddresses?: string[]
  ): Promise<VersionedTransaction> {
    const swapAmount = quoteParams?.amount || quoteResponse?.inAmount;
    const inputMint =
      quoteParams?.inputMint || new PublicKey(quoteResponse!.inputMint);
    const outputMint =
      quoteParams?.outputMint || new PublicKey(quoteResponse!.outputMint);

    let computeBudgetInstructions = [];

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
      computeBudgetInstructions = ins.computeBudgetInstructions;
      swapInstruction = ins.swapInstruction;
      addressLookupTableAddresses = ins.addressLookupTableAddresses;
    }

    console.log("swapInstruction:", swapInstruction);

    const swapIx: { data: any; keys: AccountMeta[] } =
      this.ixDataToTransactionInstruction(swapInstruction);

    const instructions = [
      ...computeBudgetInstructions.map(this.ixDataToTransactionInstruction),
      await this.base.program.methods
        .jupiterSwap(new anchor.BN(swapAmount), swapIx.data)
        .accounts({
          fund,
          manager,
          inputAta: this.base.getManagerAta(inputMint),
          treasury: this.base.getTreasuryPDA(fund),
          outputAta: destinationTokenAccount,
          inputMint,
          outputMint,
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
