import { BN } from "@coral-xyz/anchor";
import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
  TransactionSignature,
  VersionedTransaction,
  AccountMeta,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

import { BaseClient, ApiTxOptions } from "./base";

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
      quoteParams,
      quoteResponse,
      swapInstructions,
      {}
    );
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * API methods
   */

  async swapTx(
    fund: PublicKey,
    quoteParams?: QuoteParams,
    quoteResponse?: QuoteResponse,
    swapInstructions?: SwapInstructions,
    apiOptions?: ApiTxOptions
  ): Promise<VersionedTransaction> {
    if (apiOptions === undefined) {
      apiOptions = {};
    }
    const manager = apiOptions.signer || this.base.getManager();

    let swapInstruction: InstructionFromJupiter;
    let addressLookupTableAddresses: string[];
    const inputMint = new PublicKey(
      quoteParams?.inputMint || quoteResponse!.inputMint
    );
    const outputMint = new PublicKey(
      quoteParams?.outputMint || quoteResponse!.outputMint
    );
    const amount = new BN(quoteParams?.amount || quoteResponse?.inAmount);

    if (swapInstructions === undefined) {
      // Fetch quoteResponse if not specified - quoteParams must be specified in this case
      if (quoteResponse === undefined) {
        if (quoteParams === undefined) {
          throw new Error(
            "quoteParams must be specified when quoteResponse and swapInstruction are not specified."
          );
        }
        quoteResponse = await this.getQuoteResponse(quoteParams);
      }

      const ins = await this.getSwapInstructions(quoteResponse, manager);
      swapInstruction = ins.swapInstruction;
      addressLookupTableAddresses = ins.addressLookupTableAddresses;
    } else {
      swapInstruction = swapInstructions.swapInstruction;
      addressLookupTableAddresses =
        swapInstructions.addressLookupTableAddresses;
    }

    const lookupTables = await this.getAdressLookupTableAccounts(
      addressLookupTableAddresses
    );

    const swapIx: { data: any; keys: AccountMeta[] } =
      this.toTransactionInstruction(swapInstruction);

    const preInstructions = await this.getPreInstructions(
      fund,
      manager,
      inputMint,
      outputMint,
      amount
    );
    const tx = await this.base.program.methods
      .jupiterSwap(amount, swapIx.data)
      .accounts({
        fund,
        treasury: this.base.getTreasuryPDA(fund),
        inputTreasuryAta: this.base.getTreasuryAta(fund, inputMint),
        outputTreasuryAta: this.base.getTreasuryAta(fund, outputMint),
        inputSignerAta: this.base.getManagerAta(inputMint, manager),
        outputSignerAta: this.base.getManagerAta(outputMint, manager),
        inputMint,
        outputMint,
        manager,
        jupiterProgram,
        token2022Program: TOKEN_2022_PROGRAM_ID,
      })
      .remainingAccounts(swapIx.keys)
      .preInstructions(preInstructions)
      .transaction();

    return this.base.intoVersionedTransaction({
      tx,
      lookupTables,
      ...apiOptions,
    });
  }

  /*
   * Utils
   */

  getPreInstructions = async (
    fund: PublicKey,
    manager: PublicKey,
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: BN,
    inputTokenProgram: PublicKey = TOKEN_PROGRAM_ID,
    outputTokenProgram: PublicKey = TOKEN_PROGRAM_ID
  ): Promise<TransactionInstruction[]> => {
    let preInstructions = [];

    const ataParams = [
      {
        payer: manager,
        ata: this.base.getManagerAta(inputMint, manager),
        owner: manager,
        mint: inputMint,
        tokenProgram: inputTokenProgram,
      },
      {
        payer: manager,
        ata: this.base.getManagerAta(outputMint, manager),
        owner: manager,
        mint: outputMint,
        tokenProgram: outputTokenProgram,
      },
      {
        payer: manager,
        ata: this.base.getTreasuryAta(fund, outputMint),
        owner: this.base.getTreasuryPDA(fund),
        mint: outputMint,
        tokenProgram: outputTokenProgram,
      },
    ];
    for (const { payer, ata, owner, mint, tokenProgram } of ataParams) {
      const ataAccountInfo = await this.base.provider.connection.getAccountInfo(
        ata
      );
      if (ataAccountInfo) {
        continue;
      }
      preInstructions.push(
        createAssociatedTokenAccountInstruction(
          payer,
          ata,
          owner,
          mint,
          tokenProgram
        )
      );
    }

    // Transfer SOL to WSOL ATA if needed for the treasury
    if (
      inputMint.toBase58() === "So11111111111111111111111111111111111111112"
    ) {
      let wsolBalance: BN;
      const treasuryPda = this.base.getTreasuryPDA(fund);
      const treasuryWsolAta = this.base.getTreasuryAta(fund, inputMint);
      try {
        wsolBalance = new BN(
          (
            await this.base.provider.connection.getTokenAccountBalance(
              treasuryWsolAta
            )
          ).value.amount
        );
      } catch (err) {
        wsolBalance = new BN(0);
      }
      const solBalance = new BN(
        await this.base.provider.connection.getBalance(treasuryPda)
      );
      const delta = amount - wsolBalance;
      if (solBalance < delta) {
        throw new Error("Insufficient balance in treasury for swap");
      }
      if (delta > 0 && solBalance > delta) {
        preInstructions.push(
          await this.base.program.methods
            .wsolWrap(new BN(amount))
            .accounts({
              fund,
              treasury: treasuryPda,
              treasuryWsolAta,
              wsolMint: inputMint,
              signer: manager,
            })
            .instruction()
        );
      }
    }

    return preInstructions;
  };

  toTransactionInstruction = (ixPayload: InstructionFromJupiter) => {
    if (ixPayload === null) {
      throw new Error("ixPayload is null");
    }

    return new TransactionInstruction({
      programId: new PublicKey(ixPayload.programId),
      keys: ixPayload.accounts.map((key: any) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable,
      })),
      data: Buffer.from(ixPayload.data, "base64"),
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
          state: AddressLookupTableAccount.deserialize(accountInfo.data),
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
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: from.toBase58(),
      }),
    });

    return await res.json();
  }
}
