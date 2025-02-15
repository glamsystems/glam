import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import { GlamClient } from "@glamsystems/glam-sdk";
import { AnchorWallet } from "@solana/wallet-adapter-react";

const JUP = new PublicKey("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN");
const FATCAT_SERVICE_PUBKEY = new PublicKey(
  "FATCaTCr4uhXZBLQFe6FVtzpF4L8ezypGh4CuQqzRR6B",
);
const LOOKUP_TABLE_PUBKEY = new PublicKey(
  "EbPbkJfa66FSD3f4Xa4USZHvfWE644R7zjJ1df5EZ5zH",
);
const JUP_STAKE_LOCKER = new PublicKey(
  "CVMdMd79no569tjc5Sq7kzz8isbfCcFyBS5TLGsrZ5dN",
);

const MAX_STAKE_DURATION_SECONDS = 2592000;

interface EscrowData {
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

function parseEscrowAccount(data: Buffer): EscrowData {
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // Read 8-byte (64-bit) integers using DataView
  const amount = new BN(dataView.getBigUint64(105, true).toString(), 10);
  const escrowStartedAt = new BN(
    dataView.getBigUint64(113, true).toString(),
    10,
  );
  const escrowEndsAt = new BN(dataView.getBigUint64(121, true).toString(), 10);
  const isMaxLock = !!data[161];

  return { amount, escrowStartedAt, escrowEndsAt, isMaxLock };
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

  public calculateVotingPower(amount: BN, escrowEndsAt: BN): string {
    const now = Math.floor(Date.now() / 1000);
    const endTime = escrowEndsAt.toNumber();

    if (now >= endTime) {
      return "0.00";
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

    return { state, stateModel, name };
  };

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

    const lookupTbleAccount =
      await this.provider.connection.getAddressLookupTable(LOOKUP_TABLE_PUBKEY);
    const lookupTables = lookupTbleAccount.value
      ? [lookupTbleAccount.value]
      : [];

    // prepare the staking transaction
    console.log(`+ Staking ${amount} JUP`);
    const tx = await this.jupiterVote.stakeJup(state, amountBN, {
      preInstructions,
      lookupTables,
    });

    // Clear cache
    this.cachedBalances = {};
    this.pendingBalanceFetch = null;

    return tx;
  }

  unstakeJup = async (amount: number) => {
    const { state } = this.getFatcatState();
    const amountBN = new BN(amount * 1_000_000); // 6 decimals

    // TODO: partial unstake
    // always use full unstake for now
    const tx = await this.jupiterVote.unstakeJup(state);

    // Clear cache
    this.cachedBalances = {};
    this.pendingBalanceFetch = null;

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
        const [escrow] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("Escrow"),
            JUP_STAKE_LOCKER.toBuffer(),
            vault.toBuffer(),
          ],
          new PublicKey("voTpe3tHQ7AjQHMapgSue2HJFAh2cGsdokqN3XqmVSj"),
        );
        const escrowAta = this.getAta(JUP, escrow);

        // Fetch all accounts in a single RPC call
        const accounts = await this.provider.connection.getMultipleAccountsInfo(
          [signerAta, escrowAta],
        );

        // Process wallet balance
        let jupBalance = "0.00";
        if (accounts[0]) {
          // const signerBalance = await this.provider.connection.getTokenAccountBalance(signerAta);
          // jupBalance = Number(signerBalance.value.uiAmount || 0).toFixed(2);
          const signerInfo = accounts[0];
          const tokenAccountBalance = parseTokenAccountBalance(signerInfo.data);
          jupBalance = tokenAccountBalance
            .div(new BN(1_000_000))
            .toNumber()
            .toFixed(2);
        }

        let votingPower = "0.00";
        if (accounts[1]) {
          const escrowInfo = accounts[1];
          const escrowData = parseEscrowAccount(escrowInfo.data);
          votingPower = this.calculateVotingPower(
            escrowData.amount,
            escrowData.escrowEndsAt,
          );
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

  async getJupBalance() {
    const { jupBalance } = await this.fetchBalances();
    return jupBalance;
  }

  async getVotingPower() {
    const { votingPower } = await this.fetchBalances();
    return votingPower;
  }
}
