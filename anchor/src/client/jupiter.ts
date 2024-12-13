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
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { BaseClient, TxOptions } from "./base";
import {
  GOVERNANCE_PROGRAM_ID,
  JUP,
  JUP_STAKE_LOCKER,
  JUP_VOTE_PROGRAM,
  JUPITER_PROGRAM_ID,
} from "../constants";

export type QuoteParams = {
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
  dexes?: string[];
  excludeDexes?: string[];
};

export type QuoteResponse = {
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
    swapInstructions?: SwapInstructions,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.swapTx(
      fund,
      quoteParams,
      quoteResponse,
      swapInstructions,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  /**
   * Stake JUP. The escrow account will be created if it doesn't exist.
   *
   * @param fund
   * @param amount
   * @param txOptions
   * @returns
   */
  public async stakeJup(
    fund: PublicKey,
    amount: BN,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const treasury = this.base.getTreasuryPDA(fund);
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("Escrow"), JUP_STAKE_LOCKER.toBuffer(), treasury.toBuffer()],
      JUP_VOTE_PROGRAM,
    );
    const escrowJupAta = getAssociatedTokenAddressSync(JUP, escrow, true);
    const treasuryJupAta = getAssociatedTokenAddressSync(JUP, treasury, true);

    const escrowAccountInfo =
      await this.base.provider.connection.getAccountInfo(escrow);
    const escrowCreated = escrowAccountInfo ? true : false;
    const preInstructions = [];
    if (!escrowCreated) {
      console.log("Will create escrow account:", escrow.toBase58());
      preInstructions.push(
        // @ts-ignore
        await this.base.program.methods
          .initLockedVoterEscrow()
          .accounts({
            fund,
            locker: JUP_STAKE_LOCKER,
            escrow,
          })
          .instruction(),
      );
    }
    preInstructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        this.base.getManager(),
        escrowJupAta,
        escrow,
        JUP,
      ),
    );

    return await this.base.program.methods
      .increaseLockedAmount(amount)
      .accounts({
        fund,
        locker: JUP_STAKE_LOCKER,
        escrow,
        escrowJupAta,
        treasuryJupAta,
      })
      .preInstructions(preInstructions)
      .rpc();
  }

  /**
   * Vote on a proposal. The vote account will be created if it doesn't exist.
   *
   * @param fund
   * @param proposal
   * @param governor
   * @param side
   * @param txOptions
   * @returns
   */
  public async voteOnProposal(
    fund: PublicKey,
    proposal: PublicKey,
    governor: PublicKey,
    side: number,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const treasury = this.base.getTreasuryPDA(fund);
    const [vote] = PublicKey.findProgramAddressSync(
      [Buffer.from("Vote"), proposal.toBuffer(), treasury.toBuffer()],
      GOVERNANCE_PROGRAM_ID,
    );

    const voteAccountInfo =
      await this.base.provider.connection.getAccountInfo(vote);
    const voteCreated = voteAccountInfo ? true : false;
    const preInstructions = [];
    if (!voteCreated) {
      console.log("Will create vote account:", vote.toBase58());
      // @ts-ignore
      preInstructions.push(
        await this.base.program.methods
          .newVote()
          .accounts({
            fund,
            vote,
            proposal,
          })
          .instruction(),
      );
    }

    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("Escrow"), JUP_STAKE_LOCKER.toBuffer(), treasury.toBuffer()],
      JUP_VOTE_PROGRAM,
    );
    return await this.base.program.methods
      .castVote(side)
      .accounts({
        fund,
        escrow,
        proposal,
        vote,
        locker: JUP_STAKE_LOCKER,
        governor,
      })
      .rpc();
  }

  /*
   * API methods
   */

  async swapTx(
    fund: PublicKey,
    quoteParams?: QuoteParams,
    quoteResponse?: QuoteResponse,
    swapInstructions?: SwapInstructions,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getManager();

    let swapInstruction: InstructionFromJupiter;
    let addressLookupTableAddresses: string[];
    const inputMint = new PublicKey(
      quoteParams?.inputMint || quoteResponse!.inputMint,
    );
    const outputMint = new PublicKey(
      quoteParams?.outputMint || quoteResponse!.outputMint,
    );
    const amount = new BN(quoteParams?.amount || quoteResponse!.inAmount);

    if (swapInstructions === undefined) {
      // Fetch quoteResponse if not specified - quoteParams must be specified in this case
      if (quoteResponse === undefined) {
        if (quoteParams === undefined) {
          throw new Error(
            "quoteParams must be specified when quoteResponse and swapInstruction are not specified.",
          );
        }
        quoteResponse = await this.getQuoteResponse(quoteParams);
      }

      const ins = await this.getSwapInstructions(quoteResponse, signer);
      swapInstruction = ins.swapInstruction;
      addressLookupTableAddresses = ins.addressLookupTableAddresses;
    } else {
      swapInstruction = swapInstructions.swapInstruction;
      addressLookupTableAddresses =
        swapInstructions.addressLookupTableAddresses;
    }

    const lookupTables = await this.getAdressLookupTableAccounts(
      addressLookupTableAddresses,
    );

    const swapIx: { data: any; keys: AccountMeta[] } =
      this.toTransactionInstruction(swapInstruction);

    const inputTokenProgram = await this.getTokenProgram(inputMint);
    const outputTokenProgram = await this.getTokenProgram(outputMint);

    const preInstructions = await this.getPreInstructions(
      fund,
      signer,
      inputMint,
      outputMint,
      amount,
      inputTokenProgram,
      outputTokenProgram,
    );
    // @ts-ignore
    const tx = await this.base.program.methods
      .jupiterSwap(amount, swapIx.data)
      .accounts({
        fund,
        //@ts-ignore IDL ts type is unhappy
        treasury: this.base.getTreasuryPDA(fund),
        inputTreasuryAta: this.base.getTreasuryAta(
          fund,
          inputMint,
          inputTokenProgram,
        ),
        outputTreasuryAta: this.base.getTreasuryAta(
          fund,
          outputMint,
          outputTokenProgram,
        ),
        inputSignerAta: this.base.getManagerAta(
          inputMint,
          signer,
          inputTokenProgram,
        ),
        outputSignerAta: this.base.getManagerAta(
          outputMint,
          signer,
          outputTokenProgram,
        ),
        inputMint,
        outputMint,
        signer,
        jupiterProgram: JUPITER_PROGRAM_ID,
        inputTokenProgram,
        outputTokenProgram,
      })
      .remainingAccounts(swapIx.keys)
      .preInstructions(preInstructions)
      .transaction();

    return this.base.intoVersionedTransaction({
      tx,
      lookupTables,
      ...txOptions,
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
    outputTokenProgram: PublicKey = TOKEN_PROGRAM_ID,
  ): Promise<TransactionInstruction[]> => {
    let preInstructions = [];

    const ataParams = [
      {
        payer: manager,
        ata: this.base.getManagerAta(inputMint, manager, inputTokenProgram),
        owner: manager,
        mint: inputMint,
        tokenProgram: inputTokenProgram,
      },
      {
        payer: manager,
        ata: this.base.getManagerAta(outputMint, manager, outputTokenProgram),
        owner: manager,
        mint: outputMint,
        tokenProgram: outputTokenProgram,
      },
      {
        payer: manager,
        ata: this.base.getTreasuryAta(fund, outputMint, outputTokenProgram),
        owner: this.base.getTreasuryPDA(fund),
        mint: outputMint,
        tokenProgram: outputTokenProgram,
      },
    ];
    for (const { payer, ata, owner, mint, tokenProgram } of ataParams) {
      // const ataAccountInfo = await this.base.provider.connection.getAccountInfo(
      //   ata
      // );
      // if (ataAccountInfo) {
      //   continue;
      // }
      preInstructions.push(
        createAssociatedTokenAccountIdempotentInstruction(
          payer,
          ata,
          owner,
          mint,
          tokenProgram,
        ),
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
              treasuryWsolAta,
            )
          ).value.amount,
        );
      } catch (err) {
        wsolBalance = new BN(0);
      }
      const solBalance = new BN(
        await this.base.provider.connection.getBalance(treasuryPda),
      );
      const delta = amount.sub(wsolBalance);

      if (solBalance.lt(delta)) {
        throw new Error(
          `Insufficient balance in treasury (${treasuryPda.toBase58()}) for swap. solBalance: ${solBalance}, lamports needed: ${delta}`,
        );
      }
      if (delta.gt(new BN(0)) && solBalance.gt(delta)) {
        preInstructions.push(
          await this.base.program.methods
            .wsolWrap(delta)
            .accounts({
              fund,
              //@ts-ignore IDL ts type is unhappy
              treasury: treasuryPda,
              treasuryWsolAta,
              wsolMint: inputMint,
              signer: manager,
            })
            .instruction(),
        );
      }
    }

    return preInstructions;
  };

  getTokenProgram = async (mint: PublicKey) => {
    const mintInfo = await this.base.provider.connection.getAccountInfo(mint);
    if (!mintInfo) {
      throw new Error(`AccountInfo not found for mint ${mint.toBase58()}`);
    }
    if (
      ![TOKEN_PROGRAM_ID.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58()].includes(
        mintInfo.owner.toBase58(),
      )
    ) {
      throw new Error(`Invalid mint owner: ${mintInfo.owner.toBase58()}`);
    }
    return mintInfo.owner;
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
    keys?: string[],
  ): Promise<AddressLookupTableAccount[]> => {
    if (!keys) {
      throw new Error("addressLookupTableAddresses is undefined");
    }

    const addressLookupTableAccountInfos =
      await this.base.provider.connection.getMultipleAccountsInfo(
        keys.map((key) => new PublicKey(key)),
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

  public async getQuoteResponse(quoteParams: QuoteParams): Promise<any> {
    const res = await fetch(
      `${this.base.jupiterApi}/quote?` +
        new URLSearchParams(
          Object.entries(quoteParams).map(([key, val]) => [key, String(val)]),
        ),
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error);
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
