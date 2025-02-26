import { AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import { GlamClient, getPriorityFeeEstimate } from "@glamsystems/glam-sdk";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  PRIORITY_FEE_SETTINGS_KEY,
  PriorityFeeSettings,
} from "@/components/settings-dialog";

const JUP = new PublicKey("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN");
const FATCAT_SERVICE_PUBKEY = new PublicKey(
  "FATCaTCr4uhXZBLQFe6FVtzpF4L8ezypGh4CuQqzRR6B",
);
const LOOKUP_TABLE_PUBKEY = new PublicKey(
  "EbPbkJfa66FSD3f4Xa4USZHvfWE644R7zjJ1df5EZ5zH",
);

const MAX_STAKE_DURATION_SECONDS = 2592000;

export interface EscrowData {
  amount: BN;
  escrowStartedAt: BN;
  escrowEndsAt: BN;
  isMaxLock: boolean;
}

function parseTokenAccountBalance(data: Buffer): BN {
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const amount = new BN(dataView.getBigUint64(64, true).toString(), 10);

  return amount;
}

export class FatcatGlamClient extends GlamClient {
  private cachedBalances: {
    jupBalance?: string;
    votingPower?: string;
    lastFetch?: number;
  } = {};

  private readonly CACHE_DURATION = 30000; // 30 seconds
  private pendingBalanceFetch: Promise<{
    jupBalance: string;
    votingPower: string;
  }> | null = null;

  public constructor(connection: Connection, wallet: AnchorWallet) {
    super({
      provider: new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      }),
    });
  }

  get priorityFeeTxOptions() {
    const json = localStorage.getItem(PRIORITY_FEE_SETTINGS_KEY);
    const priorityFeeSettings = JSON.parse(json || "{}") as PriorityFeeSettings;
    const { priorityLevel, priorityMode, maxCap, exactFee } =
      priorityFeeSettings;

    if (priorityMode === "Max Cap") {
      return {
        getPriorityFeeMicroLamports: async (tx: VersionedTransaction) =>
          getPriorityFeeEstimate(
            process.env.NEXT_PUBLIC_HELIUS_API_KEY!,
            tx,
            undefined,
            priorityLevel,
          ),
        maxFeeLamports: maxCap * LAMPORTS_PER_SOL,
        useMaxFee: false,
      };
    }

    if (priorityMode === "Exact Fee") {
      return {
        getPriorityFeeMicroLamports: async (tx: VersionedTransaction) =>
          Promise.resolve(0),
        maxFeeLamports: exactFee * LAMPORTS_PER_SOL,
        useMaxFee: true,
      };
    }

    // Default case
    return {
      getPriorityFeeMicroLamports: async (tx: VersionedTransaction) =>
        Promise.resolve(0),
      maxFeeLamports: 0,
      useMaxFee: false,
    };
  }

  public calculateVotingPower(amount: BN, escrowEndsAt: BN): string {
    const now = Math.floor(Date.now() / 1000);
    const endTime = escrowEndsAt.toNumber();

    if (now >= endTime) {
      return "0";
    }

    const timeRemaining = endTime - now;
    const multiplier = Math.min(timeRemaining / MAX_STAKE_DURATION_SECONDS, 1);
    const power = amount.muln(multiplier).div(new BN(1_000_000));

    return power.toString();
  }

  getFatcatState = () => {
    // default name
    const name = "fatcat-" + this.getSigner().toBase58().substring(0, 6);

    // default model with delegated permissions
    const stateModel = this.state.enrichStateModel({
      name,
      assets: [JUP],
      enabled: true,
      accountType: { vault: {} },
      integrations: [{ jupiterVote: {} }],
      delegateAcls: [
        {
          pubkey: FATCAT_SERVICE_PUBKEY,
          permissions: [{ voteOnProposal: {} }],
          expiresAt: new BN(0),
        },
      ],
    });
    stateModel.rawOpenfunds = null;
    stateModel.metadata = null;

    // default pda
    const state = this.getStatePda(stateModel);
    const vault = this.getVaultPda(state);

    return { state, stateModel, vault, name };
  };

  async fetchVotes(proposals: PublicKey[] | string[]) {
    const { state } = this.getFatcatState();
    const votes = await this.jupiterVote.fetchVotes(state, proposals);
    return votes;
  }

  async stakeJup(amount: number) {
    const { state, stateModel, name } = this.getFatcatState();
    const vault = this.getVaultPda(state);
    const signer = this.getSigner();
    const amountBN = new BN(amount * 1_000_000); // 6 decimals
    let preInstructions = [];

    // try to fetch the state account
    // if it doesn't exist, add pre instruction to create it
    try {
      await this.fetchStateAccount(state);
    } catch (error) {
      // state does not exist - create it
      console.log(`+ Creating vault ${name}`);
      const initStateIx = await this.program.methods
        .initializeState(stateModel)
        .accountsPartial({
          state,
        })
        .instruction();
      preInstructions.push(initStateIx);

      // need some lamports in vault to pay for the creation of the escrow account
      preInstructions.push(
        SystemProgram.transfer({
          fromPubkey: signer,
          toPubkey: vault,
          lamports: 10_000_000,
        }),
      );
    }

    // add instrustions to create vault ATA and transfer JUP to vault
    console.log(`+ Transfering ${amount} JUP to vault`);
    const vaultAta = this.getAta(JUP, vault);
    const signerAta = this.getAta(JUP, signer);

    preInstructions.push(
      ...[
        createAssociatedTokenAccountIdempotentInstruction(
          signer,
          vaultAta,
          vault,
          JUP,
        ),
        createTransferCheckedInstruction(
          signerAta,
          JUP,
          vaultAta,
          signer,
          amountBN.toNumber(),
          6,
        ),
      ],
    );

    const lookupTableAccount =
      await this.provider.connection.getAddressLookupTable(LOOKUP_TABLE_PUBKEY);
    const lookupTables = lookupTableAccount.value
      ? [lookupTableAccount.value]
      : [];

    // prepare the staking transaction
    console.log(`+ Staking ${amount} JUP`);
    const tx = await this.jupiterVote.stakeJup(state, amountBN, {
      preInstructions,
      lookupTables,
      ...this.priorityFeeTxOptions,
    });

    // Clear cache
    this.cachedBalances = {};
    this.pendingBalanceFetch = null;

    return tx;
  }

  cancelUnstake = async () => {
    const { state } = this.getFatcatState();
    const tx = await this.jupiterVote.cancelUnstake(state, {
      ...this.priorityFeeTxOptions,
    });
    return tx;
  };

  withdraw = async () => {
    const { state } = this.getFatcatState();
    const tx = await this.jupiterVote.withdrawJup(state, {
      ...this.priorityFeeTxOptions,
    });
    return tx;
  };

  unstakeJup = async () => {
    const { state } = this.getFatcatState();

    // TODO: partial unstake
    // always use full unstake for now
    const tx = await this.jupiterVote.unstakeJup(state, {
      ...this.priorityFeeTxOptions,
    });

    // Clear cache
    this.cachedBalances = {};
    this.pendingBalanceFetch = null;

    return tx;
  };

  castVote = async (proposal: string, side: number) => {
    console.log("Casting vote:", { proposal, side });
    const { state } = this.getFatcatState();
    const tx = await this.jupiterVote.voteOnProposal(
      state,
      new PublicKey(proposal),
      side,
      { ...this.priorityFeeTxOptions },
    );
    return tx;
  };

  private isCacheValid(): boolean {
    return (
      this.cachedBalances.lastFetch !== undefined &&
      Date.now() - this.cachedBalances.lastFetch < this.CACHE_DURATION
    );
  }

  async fetchBalances() {
    // Return cached values if valid
    if (this.isCacheValid()) {
      return {
        jupBalance: this.cachedBalances.jupBalance || "N/A",
        votingPower: this.cachedBalances.votingPower || "N/A",
      };
    }

    // If there's already a pending fetch, return its result
    if (this.pendingBalanceFetch) {
      return this.pendingBalanceFetch;
    }

    // Create new fetch promise
    this.pendingBalanceFetch = (async () => {
      try {
        const { state } = this.getFatcatState();
        const vault = this.getVaultPda(state);
        const signer = this.getSigner();

        const signerAta = this.getAta(JUP, signer);
        const escrow = this.jupiterVote.getEscrowPda(vault);

        console.log("escrow", escrow.toString());

        // Fetch all accounts in a single RPC call
        const [signerAtaAccountInfo, escrowAtaAccountInfo] =
          await this.provider.connection.getMultipleAccountsInfo([
            signerAta,
            escrow,
          ]);

        let jupBalance = "0";
        let votingPower = "0";

        if (signerAtaAccountInfo) {
          const tokenAccountBalance = parseTokenAccountBalance(
            signerAtaAccountInfo.data,
          );
          jupBalance = tokenAccountBalance.toNumber().toString();
        }

        if (escrowAtaAccountInfo) {
          const { amount, escrowEndsAt } = this.parseEscrowAccount(
            escrowAtaAccountInfo.data,
          );
          votingPower = this.calculateVotingPower(amount, escrowEndsAt);
        }

        // Update cache
        this.cachedBalances = {
          jupBalance,
          votingPower,
          lastFetch: Date.now(),
        };

        return { jupBalance, votingPower };
      } catch (error) {
        console.error("Error fetching balances:", error);
        return {
          jupBalance: "N/A",
          votingPower: "N/A",
        };
      } finally {
        this.pendingBalanceFetch = null;
      }
    })();

    return this.pendingBalanceFetch;
  }

  parseEscrowAccount(data: Buffer): EscrowData {
    // Calculate offsets:
    // 8 (discriminator) + 32 (locker) + 32 (owner) + 1 (bump) + 32 (tokens) = 105
    // amount is at offset 105
    // escrowEndsAt is at offset 105 + 8 + 8 = 121
    const amount = new BN(data.subarray(105, 113), "le");
    const escrowStartedAt = new BN(data.subarray(113, 121), "le");
    const escrowEndsAt = new BN(data.subarray(121, 129), "le");
    const isMaxLock = !!data[161];

    return {
      amount,
      escrowStartedAt,
      escrowEndsAt,
      isMaxLock,
    };
  }

  async getEscrowData(escrow: PublicKey): Promise<EscrowData | undefined> {
    const escrowInfo = await this.provider.connection.getAccountInfo(escrow);
    if (escrowInfo) {
      return this.parseEscrowAccount(escrowInfo.data);
    }
  }

  async getJupBalance() {
    const { jupBalance } = await this.fetchBalances();
    return jupBalance;
  }

  async getVotingPower() {
    const { votingPower } = await this.fetchBalances();
    return votingPower;
  }
}
