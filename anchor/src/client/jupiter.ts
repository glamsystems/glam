import { BN } from "@coral-xyz/anchor";
import {
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
} from "@solana/spl-token";

import { BaseClient, TxOptions } from "./base";
import {
  GOVERNANCE_PROGRAM_ID,
  JUP,
  JUP_VOTE_PROGRAM,
  JUPITER_PROGRAM_ID,
  WSOL,
} from "../constants";
import { ASSETS_MAINNET } from "./assets";

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

const BASE = new PublicKey("bJ1TRoFo2P6UHVwqdiipp6Qhp2HaaHpLowZ5LHet8Gm");

export class JupiterSwapClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  public async swap(
    statePda: PublicKey,
    quoteParams?: QuoteParams,
    quoteResponse?: QuoteResponse,
    swapInstructions?: SwapInstructions,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.swapTx(
      statePda,
      quoteParams,
      quoteResponse,
      swapInstructions,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  public async setMaxSwapSlippage(
    statePda: PublicKey,
    slippageBps: number,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const tx = await this.setMaxSwapSlippageTx(
      statePda,
      slippageBps,
      txOptions,
    );
    return await this.base.sendAndConfirm(tx);
  }

  /*
   * API methods
   */

  async swapTx(
    statePda: PublicKey,
    quoteParams?: QuoteParams,
    quoteResponse?: QuoteResponse,
    swapInstructions?: SwapInstructions,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const vault = this.base.getVaultPda(statePda);

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

      const ins = await this.getSwapInstructions(quoteResponse, vault);
      swapInstruction = ins.swapInstruction;
      addressLookupTableAddresses = ins.addressLookupTableAddresses;
    } else {
      swapInstruction = swapInstructions.swapInstruction;
      addressLookupTableAddresses =
        swapInstructions.addressLookupTableAddresses;
    }

    const lookupTables = await this.base.getAdressLookupTableAccounts(
      addressLookupTableAddresses,
    );

    const swapIx: { data: any; keys: AccountMeta[] } =
      this.toTransactionInstruction(swapInstruction, vault.toBase58());

    const [inputTokenProgram, outputTokenProgram] = await Promise.all([
      this.getTokenProgram(inputMint),
      this.getTokenProgram(outputMint),
    ]);

    const inputStakePool =
      ASSETS_MAINNET.get(inputMint.toBase58())?.stateAccount || null;
    const outputStakePool =
      ASSETS_MAINNET.get(outputMint.toBase58())?.stateAccount || null;

    const preInstructions = await this.getPreInstructions(
      statePda,
      signer,
      inputMint,
      outputMint,
      amount,
      inputTokenProgram,
      outputTokenProgram,
    );
    const tx = await this.base.program.methods
      .jupiterSwap(amount, swapIx.data)
      .accounts({
        state: statePda,
        signer,
        inputMint,
        outputMint,
        inputTokenProgram,
        outputTokenProgram,
        inputStakePool,
        outputStakePool,
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

  public async setMaxSwapSlippageTx(
    statePda: PublicKey,
    slippageBps: number,
    txOptions: TxOptions = {},
  ): Promise<VersionedTransaction> {
    const signer = txOptions.signer || this.base.getSigner();
    const tx = await this.base.program.methods
      .jupiterSetMaxSwapSlippage(new BN(slippageBps))
      .accounts({
        state: statePda,
        signer,
      })
      .transaction();
    return this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
  }

  /*
   * Utils
   */

  getPreInstructions = async (
    statePda: PublicKey,
    signer: PublicKey,
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: BN,
    inputTokenProgram: PublicKey = TOKEN_PROGRAM_ID,
    outputTokenProgram: PublicKey = TOKEN_PROGRAM_ID,
  ): Promise<TransactionInstruction[]> => {
    const vault = this.base.getVaultPda(statePda);
    const ata = this.base.getAta(outputMint, vault, outputTokenProgram);

    const preInstructions = [
      createAssociatedTokenAccountIdempotentInstruction(
        signer,
        ata,
        vault,
        outputMint,
        outputTokenProgram,
      ),
    ];

    // Transfer SOL to wSOL ATA if needed for the vault
    if (inputMint.equals(WSOL)) {
      const wrapSolIx = await this.base.maybeWrapSol(statePda, amount, signer);
      if (wrapSolIx) {
        preInstructions.push(wrapSolIx);
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

  toTransactionInstruction = (
    ixPayload: InstructionFromJupiter,
    vaultStr: string,
  ) => {
    if (ixPayload === null) {
      throw new Error("ixPayload is null");
    }

    return new TransactionInstruction({
      programId: new PublicKey(ixPayload.programId),
      keys: ixPayload.accounts.map((key: any) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner && key.pubkey != vaultStr,
        isWritable: key.isWritable,
      })),
      data: Buffer.from(ixPayload.data, "base64"),
    });
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

export class JupiterVoteClient {
  public constructor(readonly base: BaseClient) {}

  /*
   * Client methods
   */

  /**
   * Stake JUP. The escrow account will be created if it doesn't exist.
   *
   * @param statePda
   * @param amount
   * @param txOptions
   * @returns
   */
  public async stakeJup(
    statePda: PublicKey,
    amount: BN,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const vault = this.base.getVaultPda(statePda);
    const escrow = this.getEscrowPda(vault);
    const escrowJupAta = this.base.getAta(JUP, escrow);
    const vaultJupAta = this.base.getAta(JUP, vault);

    const escrowAccountInfo =
      await this.base.provider.connection.getAccountInfo(escrow);
    const escrowCreated = escrowAccountInfo ? true : false;
    const preInstructions = txOptions.preInstructions || [];
    if (!escrowCreated) {
      console.log("Will create escrow account:", escrow.toBase58());
      preInstructions.push(
        await this.base.program.methods
          .initLockedVoterEscrow()
          .accounts({
            state: statePda,
            locker: this.stakeLocker,
            escrow,
          })
          .instruction(),
      );
      preInstructions.push(
        await this.base.program.methods
          .toggleMaxLock(true)
          .accounts({
            state: statePda,
            locker: this.stakeLocker,
            escrow,
          })
          .instruction(),
      );
    }
    preInstructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        this.base.getSigner(),
        escrowJupAta,
        escrow,
        JUP,
      ),
    );

    const tx = await this.base.program.methods
      .increaseLockedAmount(amount)
      .accounts({
        state: statePda,
        locker: this.stakeLocker,
        escrow,
        escrowJupAta,
        vaultJupAta,
      })
      .preInstructions(preInstructions)
      .transaction();

    const vTx = await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });

    return await this.base.sendAndConfirm(vTx);
  }

  /**
   * Unstake all staked JUP.
   *
   * @param statePda
   * @param txOptions
   * @returns
   */
  // TODO: support partial unstake
  public async unstakeJup(statePda: PublicKey, txOptions: TxOptions = {}) {
    const vault = this.base.getVaultPda(statePda);
    const escrow = this.getEscrowPda(vault);

    const tx = await this.base.program.methods
      .toggleMaxLock(false)
      .accounts({
        state: statePda,
        locker: this.stakeLocker,
        escrow,
      })
      .transaction();
    const vTx = await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });

    return await this.base.sendAndConfirm(vTx);
  }

  public async withdrawJup(statePda: PublicKey, txOptions: TxOptions = {}) {
    const vault = this.base.getVaultPda(statePda);
    const escrow = this.getEscrowPda(vault);
    const escrowJupAta = this.base.getAta(JUP, escrow);
    const vaultJupAta = this.base.getAta(JUP, vault);

    const tx = await this.base.program.methods
      .withdrawAllUnstakedJup()
      .accounts({
        state: statePda,
        locker: this.stakeLocker,
        escrow,
        escrowJupAta,
        vaultJupAta,
      })
      .preInstructions([
        createAssociatedTokenAccountIdempotentInstruction(
          this.base.getSigner(),
          vaultJupAta,
          vault,
          JUP,
        ),
      ])
      .transaction();

    const vTx = await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });

    return await this.base.sendAndConfirm(vTx);
  }

  public async cancelUnstake(statePda: PublicKey, txOptions: TxOptions = {}) {
    const vault = this.base.getVaultPda(statePda);
    const escrow = this.getEscrowPda(vault);

    const tx = await this.base.program.methods
      .toggleMaxLock(true)
      .accounts({
        state: statePda,
        locker: this.stakeLocker,
        escrow,
      })
      .transaction();

    const vTx = await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });

    return await this.base.sendAndConfirm(vTx);
  }

  /**
   * Vote on a proposal. The vote account will be created if it doesn't exist.
   *
   * @param statePda
   * @param proposal
   * @param side
   * @param txOptions
   * @returns
   */
  public async voteOnProposal(
    glamState: PublicKey,
    proposal: PublicKey,
    side: number,
    txOptions: TxOptions = {},
  ): Promise<TransactionSignature> {
    const glamVault = this.base.getVaultPda(glamState);
    const [vote] = PublicKey.findProgramAddressSync(
      [Buffer.from("Vote"), proposal.toBuffer(), glamVault.toBuffer()],
      GOVERNANCE_PROGRAM_ID,
    );
    const [governor] = PublicKey.findProgramAddressSync(
      [Buffer.from("Governor"), BASE.toBuffer()],
      GOVERNANCE_PROGRAM_ID,
    );

    const voteAccountInfo =
      await this.base.provider.connection.getAccountInfo(vote);
    const voteCreated = voteAccountInfo ? true : false;
    const preInstructions = [];
    if (!voteCreated) {
      console.log("Will create vote account:", vote.toBase58());
      preInstructions.push(
        await this.base.program.methods
          .jupiterGovNewVote(glamVault)
          .accountsPartial({
            glamState,
            proposal,
            vote,
          })
          .instruction(),
      );
    }

    const escrow = this.getEscrowPda(glamVault);
    const tx = await this.base.program.methods
      .castVote(side, null)
      .accounts({
        glamState,
        escrow,
        proposal,
        vote,
        locker: this.stakeLocker,
        governor,
      })
      .transaction();
    const vTx = await this.base.intoVersionedTransaction({
      tx,
      ...txOptions,
    });
    return await this.base.sendAndConfirm(vTx);
  }
  /*
   * Utils
   */
  get stakeLocker(): PublicKey {
    const [locker] = PublicKey.findProgramAddressSync(
      [Buffer.from("Locker"), BASE.toBuffer()],
      JUP_VOTE_PROGRAM,
    );
    return locker;
  }

  getEscrowPda(owner: PublicKey): PublicKey {
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("Escrow"), this.stakeLocker.toBuffer(), owner.toBuffer()],
      JUP_VOTE_PROGRAM,
    );
    return escrow;
  }
}
