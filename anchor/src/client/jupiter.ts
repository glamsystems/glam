import util from "util";
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
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

import { BaseClient } from "./base";

const jupiterProgram = new PublicKey(
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
);

type QuoteParams = {
  inputMint: string;
  outputMint: string;
  amount: number;
  autoSlippage?: boolean;
  autoSlippageCollisionUsdValue?: number;
  slippageBps?: number;
  swapMode?: string;
  onlyDirectRoutes?: boolean;
  asLegacyTransaction?: boolean;
  maxAccounts?: number;
};

type QuoteResponse = {
  inputMint: string;
  inAmount: number | string;
  outputMint: string;
  outAmount: number | string;
  otherAmountThreshold: number | string;
  swapMode: string;
  slippageBps: number;
  platformFee: number | null;
  priceImpactPct: number | string;
  routePlan: any[];
  contextSlot: number;
  timeTaken: number;
};

type JsonAccountMeta = {
  pubkey: string; // not PublicKey but just string
  isSigner: boolean;
  isWritable: boolean;
};

type InstructionFromJupiter = {
  programId: string;
  accounts: JsonAccountMeta[];
  data: string;
};

type SwapInstructions = {
  tokenLedgerInstruction?: InstructionFromJupiter | null;
  otherInstructions?: InstructionFromJupiter[];
  computeBudgetInstructions: InstructionFromJupiter[];
  setupInstructions?: InstructionFromJupiter[];
  swapInstruction: InstructionFromJupiter;
  cleanupInstruction?: InstructionFromJupiter;
  addressLookupTableAddresses: string[];
};

export class JupiterClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async swap(
    fund: PublicKey,
    quoteParams?: QuoteParams,
    quoteResponse?: QuoteResponse,
    swapInstructions?: SwapInstructions
  ): Promise<TransactionSignature> {
    const tx = await this.swapTx(
      fund,
      this.base.getManager(),
      quoteParams,
      quoteResponse,
      swapInstructions
    );
    // console.log("tx", util.inspect(tx, false, null));
    return await this.base.sendAndConfirm(tx, this.base.getWalletSigner());
  }

  /*
   * API methods
   */

  async swapTx(
    fund: PublicKey,
    manager: PublicKey,
    quoteParams?: QuoteParams,
    quoteResponse?: QuoteResponse,
    swapInstructions?: SwapInstructions
  ): Promise<VersionedTransaction> {
    let computeBudgetInstructions: InstructionFromJupiter[];
    let swapInstruction: InstructionFromJupiter;
    let addressLookupTableAddresses: string[];

    const inputMint = new PublicKey(
      quoteParams?.inputMint || quoteResponse!.inputMint
    );
    const outputMint = new PublicKey(
      quoteParams?.outputMint || quoteResponse!.outputMint
    );
    const amount = new anchor.BN(
      quoteParams?.amount || quoteResponse?.inAmount
    );

    if (swapInstructions === undefined) {
      // Fetch quoteResponse if not specified - quoteParams must be specified in this case
      if (quoteResponse === undefined) {
        if (quoteParams === undefined) {
          throw new Error(
            "quoteParams must be specified when quoteResponse and swapInstruction are not specified."
          );
        }
        // console.log("Fetching quoteResponse with quoteParams:", quoteParams);
        quoteResponse = await this.getQuoteResponse(quoteParams);
        // console.log("quoteResponse", util.inspect(quoteResponse, false, null));
      }

      const ins = await this.getSwapInstructions(quoteResponse, manager);
      // console.log("SwapInstructions", util.inspect(ins, false, null));
      computeBudgetInstructions = ins.computeBudgetInstructions || [];
      swapInstruction = ins.swapInstruction;
      addressLookupTableAddresses = ins.addressLookupTableAddresses;
    } else {
      computeBudgetInstructions =
        swapInstructions.computeBudgetInstructions || [];
      swapInstruction = swapInstructions.swapInstruction;
      addressLookupTableAddresses =
        swapInstructions.addressLookupTableAddresses;
    }

    const swapIx: { data: any; keys: AccountMeta[] } =
      this.toTransactionInstruction(swapInstruction);

    const instructions = [
      ...computeBudgetInstructions.map(this.toTransactionInstruction),
      await this.base.program.methods
        .jupiterSwap(amount, swapIx.data)
        .accounts({
          fund,
          treasury: this.base.getTreasuryPDA(fund),
          inputAta: this.base.getTreasuryAta(fund, inputMint),
          outputAta: this.base.getTreasuryAta(fund, outputMint),
          inputSignerAta: this.base.getManagerAta(inputMint, manager),
          outputSignerAta: this.base.getManagerAta(outputMint, manager),
          inputMint,
          outputMint,
          manager,
          jupiterProgram,
          token2022Program: TOKEN_2022_PROGRAM_ID
        })
        .remainingAccounts(swapIx.keys)
        .instruction()
    ];
    const addressLookupTableAccounts = await this.getAdressLookupTableAccounts(
      addressLookupTableAddresses
    );

    const messageV0 = new TransactionMessage({
      payerKey: manager,
      recentBlockhash: (
        await this.base.provider.connection.getLatestBlockhash()
      ).blockhash,
      instructions
    }).compileToV0Message(addressLookupTableAccounts);

    return new VersionedTransaction(messageV0);
  }

  /*
   * Utils
   */

  toTransactionInstruction = (ixPayload: InstructionFromJupiter) => {
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

  async getSwapInstructions(quoteResponse: any, from: PublicKey): Promise<any> {
    const res = await fetch(`${this.base.jupiterApi}/swap-instructions`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: from.toBase58()
      })
    });

    return await res.json();
  }
}
