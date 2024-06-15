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
};

type InstructionFromJupiter = {
  programId: string;
  accounts: AccountMeta[];
  data: string;
};

type SwapInstructions = {
  tokenLedgerInstruction?: InstructionFromJupiter;
  otherInstructions: InstructionFromJupiter[];
  computeBudgetInstructions: InstructionFromJupiter[];
  setupInstructions: InstructionFromJupiter[];
  swapInstruction: InstructionFromJupiter;
  cleanupInstruction?: InstructionFromJupiter;
  addressLookupTableAddresses: string[];
};

export class JupiterClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async swapWithIx(
    fund: PublicKey,
    manager: PublicKey,
    amount: anchor.BN,
    inputMint: PublicKey,
    outputMint: PublicKey,
    swapInstructions: SwapInstructions
  ): Promise<TransactionSignature> {
    const tx = await this.swapTxBuilder(
      fund,
      manager,
      amount,
      inputMint,
      outputMint,
      undefined,
      undefined,
      swapInstructions
    );

    return await (this.base.provider as anchor.AnchorProvider).sendAndConfirm(
      tx,
      [this.base.getWalletSigner()]
    );
  }

  public async swap(
    fund: PublicKey,
    quoteParams?: QuoteParams,
    quoteResponse?: QuoteResponse
  ): Promise<TransactionSignature> {
    // TODO: should not allow client side to specify destination token account
    const inputMint = new PublicKey(
      quoteParams?.inputMint || quoteResponse!.inputMint
    );
    const outputMint = new PublicKey(
      quoteParams?.outputMint || quoteResponse!.outputMint
    );
    const amount = new anchor.BN(
      quoteParams?.amount || quoteResponse?.inAmount
    );

    const tx = await this.swapTxBuilder(
      fund,
      this.base.getManager(),
      amount,
      inputMint,
      outputMint,
      quoteParams,
      quoteResponse,
      undefined
    );

    return await (this.base.provider as anchor.AnchorProvider).sendAndConfirm(
      tx,
      [this.base.getWalletSigner()]
    );
  }

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

  /*
   * Tx Builders
   */

  async swapTxBuilder(
    fund: PublicKey,
    manager: PublicKey,
    amount: anchor.BN,
    inputMint: PublicKey,
    outputMint: PublicKey,
    quoteParams?: QuoteParams,
    quoteResponse?: QuoteResponse,
    swapInstructions?: SwapInstructions
  ): Promise<VersionedTransaction> {
    const destinationTokenAccount = this.base.getTreasuryAta(
      fund,
      new PublicKey(outputMint)
    );

    let computeBudgetInstructions: InstructionFromJupiter[];
    let swapInstruction: InstructionFromJupiter;
    let addressLookupTableAddresses: string[];

    if (swapInstructions === undefined) {
      // Fetch quoteResponse if not specified - quoteParams must be specified in this case
      if (quoteResponse === undefined) {
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

    let inputAta;
    try {
      inputAta = this.base.getManagerAta(new PublicKey(inputMint));
    } catch (e) {
      console.log("Cannot get manager ata:", e);
      // When called from API, we cannot get manager from provider
      // We need to pass the manager from client side
      inputAta = this.base.getManagerAta(new PublicKey(inputMint), manager);
    }

    const instructions = [
      ...computeBudgetInstructions.map(this.toTransactionInstruction),
      await this.base.program.methods
        .jupiterSwap(amount, swapIx.data)
        .accounts({
          fund,
          manager,
          inputAta,
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

    let payerPublicKey;
    try {
      payerPublicKey = await this.base.getWalletSigner().publicKey;
    } catch (e) {
      console.log("Cannot get wallet signer:", e);
      console.log("Default to fund manager as payer");
      payerPublicKey = manager;
    }

    const messageV0 = new TransactionMessage({
      payerKey: payerPublicKey,
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
    quoteParams?: QuoteParams,
    quoteResponse?: QuoteResponse
  ): Promise<VersionedTransaction> {
    // TODO: should not allow client side to specify destination token account
    const inputMint = new PublicKey(
      quoteParams?.inputMint || quoteResponse!.inputMint
    );
    const outputMint = new PublicKey(
      quoteParams?.outputMint || quoteResponse!.outputMint
    );
    const amount = new anchor.BN(
      quoteParams?.amount || quoteResponse?.inAmount
    );

    return await this.swapTxBuilder(
      fund,
      manager,
      amount,
      inputMint,
      outputMint,
      quoteParams,
      quoteResponse,
      undefined
    );
  }

  public async swapTxFromIx(
    fund: PublicKey,
    manager: PublicKey,
    amount: anchor.BN,
    inputMint: PublicKey,
    outputMint: PublicKey,
    swapInstructions: SwapInstructions
  ): Promise<VersionedTransaction> {
    return await this.swapTxBuilder(
      fund,
      manager,
      amount,
      inputMint,
      outputMint,
      undefined,
      undefined,
      swapInstructions
    );
  }
}
