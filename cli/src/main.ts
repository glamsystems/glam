import * as anchor from "@coral-xyz/anchor";
import {
  StateModel,
  IntegrationName,
  PriorityLevel,
  WSOL,
  getPriorityFeeEstimate,
  GlamClient,
} from "@glam/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Command } from "commander";

import fs from "fs";
import os from "os";
import path from "path";
import { setStateToConfig } from "./utils";
import { QuoteParams } from "anchor/src/client/jupiter";
import { VersionedTransaction } from "@solana/web3.js";

// By default config is at ~/.config/glam/cli/config.json
// If running in docker, config is expected to be at /workspace/config.json
const configHomeDefault = path.join(os.homedir(), ".config/glam/cli/");
const configPath = path.join(
  process.env.DOCKER ? "/workspace" : configHomeDefault,
  "config.json",
);

let statePda;
let heliusApiKey;
let priorityFeeLevel = "Low" as PriorityLevel; // Defaults to Low
try {
  const config = fs.readFileSync(configPath, "utf8");
  const {
    keypair_path,
    helius_api_key,
    priority_fee_level,
    cluster,
    glam_state,
  } = JSON.parse(config);
  if (cluster.toLowerCase().startsWith("mainnet")) {
    process.env.ANCHOR_PROVIDER_URL = `https://mainnet.helius-rpc.com/?api-key=${helius_api_key}`;
  } else if (cluster.toLowerCase().startsWith("devnet")) {
    process.env.ANCHOR_PROVIDER_URL = `https://devnet.helius-rpc.com/?api-key=${helius_api_key}`;
  } else if (cluster.toLowerCase().startsWith("localnet")) {
    process.env.ANCHOR_PROVIDER_URL = "http://localhost:8899";
  } else {
    throw new Error(`Unsupported cluster: ${cluster}`);
  }
  process.env.ANCHOR_WALLET = keypair_path;
  if (glam_state) {
    statePda = new PublicKey(glam_state);
  }
  heliusApiKey = helius_api_key;
  priorityFeeLevel = priority_fee_level ?? priorityFeeLevel;
} catch (err) {
  console.error(`Could not load config at ${configPath}:`, err.message);
}

const cliTxOptions = {
  getPriorityFeeMicroLamports: async (tx: VersionedTransaction) =>
    await getPriorityFeeEstimate(heliusApiKey, tx, undefined, priorityFeeLevel),
};

const glamClient = new GlamClient();

const program = new Command();

program
  .name("glam-cli")
  .description("CLI for interacting with the GLAM onchain program")
  .version("0.0.1");

program
  .command("env")
  .description("Show environment setup")
  .action(async () => {
    console.log("Wallet connected:", glamClient.getSigner().toBase58());
    console.log("RPC endpoint:", glamClient.provider.connection.rpcEndpoint);
    console.log("Priority fee level:", priorityFeeLevel);
    console.log("Glam state:", statePda ? statePda.toBase58() : "not set");
    if (statePda) {
      const vault = glamClient.getVaultPda(statePda);
      console.log("Active vault:", vault.toBase58());
    }
  });

program
  .command("funds")
  .description("List all funds the connected wallet has access to")
  .option("-m, --manager-only", "Only list funds with full manager access")
  .option("-a, --all", "All GLAM funds")
  .action(async () => {
    const funds = await glamClient.fetchAllGlamStates();
    funds
      .sort((a, b) =>
        a.rawOpenfunds.fundLaunchDate > b.rawOpenfunds.fundLaunchDate ? 1 : -1,
      )
      .map((f: StateModel) => {
        console.log(
          f.id.toBase58(),
          "\t",
          f.rawOpenfunds.fundLaunchDate,
          "\t",
          f.name,
        );
      });
  });

const fund = program.command("fund").description("Manage fund");

fund
  .command("set <fund>")
  .description("Set active fund")
  .action((fund) => {
    setStateToConfig(fund, configPath);
    console.log("Active fund set to:", fund);
  });

fund
  .command("view [state]")
  .description("View a glam state")
  .action(async (state?) => {
    if (state) {
      const glamState = await glamClient.fetchState(new PublicKey(state));
      console.log(JSON.stringify(glamState, null, 2));
      return;
    }
    if (statePda) {
      const glamState = await glamClient.fetchState(statePda);
      console.log(JSON.stringify(glamState, null, 2));
      return;
    }
    console.error("Please specify a glam state to view.");
  });

fund
  .command("create <path>")
  .description("Create fund from a json file")
  .action(async (file) => {
    const data = fs.readFileSync(file, "utf8");
    const glamState = JSON.parse(data);

    // Convert pubkey strings to PublicKey objects
    for (let i = 0; i < glamState?.shareClasses?.length || 0; ++i) {
      glamState.shareClasses[i].asset = new PublicKey(
        glamState.shareClasses[i].asset,
      );
    }
    glamState.assets = glamState.assets.map((a) => new PublicKey(a));

    try {
      const [txSig, statePda] = await glamClient.state.createState(glamState);
      console.log("Glam state created:", statePda.toBase58());
      console.log("txSig:", txSig);

      setStateToConfig(statePda.toBase58(), configPath);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

fund
  .command("close <fund>")
  .description("Close the fund")
  .action(async (f) => {
    const statePda = new PublicKey(f);

    const preInstructions = [];
    const stateAccount = await glamClient.fetchStateAccount(statePda);
    if (stateAccount.mints.length > 0) {
      const closeShareClassIx = await glamClient.program.methods
        .closeShareClass(0)
        .accounts({
          state: statePda,
          shareClassMint: glamClient.getShareClassPda(statePda, 0),
          metadata: glamClient.getOpenfundsPda(statePda),
        })
        .instruction();
      preInstructions.push(closeShareClassIx);
    }
    try {
      const builder = await glamClient.program.methods
        .closeState()
        .accounts({
          state: statePda,
          metadata: glamClient.getOpenfundsPda(statePda),
        })
        .preInstructions(preInstructions);

      const txSig = await builder.rpc();
      console.log(`Fund ${statePda.toBase58()} closed:`, txSig);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

fund
  .command("withdraw <asset> <amount>")
  .description("Withdraw <asset> (mint address) from the vault")
  .action(async (asset, amount) => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    if (asset.toLowerCase() === "SOL") {
      asset = WSOL.toBase58();
    } else if (asset.toLowerCase() === "jitosol") {
      asset = "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn";
    }

    const { mint } = await glamClient.fetchMintWithOwner(new PublicKey(asset));

    await glamClient.state.withdraw(
      statePda,
      new PublicKey(asset),
      new anchor.BN(parseFloat(amount) * mint.decimals),
      cliTxOptions,
    );
  });

const delegate = fund.command("delegate").description("Manage fund delegates");
delegate
  .command("get")
  .description("List fund delegates and permissions")
  .action(async () => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    const stateModel = await glamClient.fetchState(statePda);
    const cnt = stateModel.delegateAcls.length;
    console.log(
      `Fund ${statePda.toBase58()} has ${cnt} delegate acl${cnt > 1 ? "s" : ""}`,
    );
    for (let [i, acl] of stateModel.delegateAcls.entries()) {
      console.log(
        `[${i}] ${acl.pubkey.toBase58()}:`,
        acl.permissions.map((p) => Object.keys(p)[0]).join(", "),
      );
    }
  });

delegate
  .command("set <pubkey> <permissions>")
  .description("Set delegate permissions")
  .action(async (pubkey, permissions) => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    const glamPermissions = permissions.split(",").map((p) => ({
      [p]: {},
    }));
    try {
      const txSig = await glamClient.state.upsertDelegateAcls(statePda, [
        {
          pubkey: new PublicKey(pubkey),
          permissions: glamPermissions,
        },
      ]);
      console.log(`Granted ${pubkey} permissions ${permissions}:`, txSig);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

const integration = fund
  .command("integration")
  .description("Manage fund integrations");
integration
  .command("get")
  .description("List enabled integrations")
  .action(async () => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    const stateModel = await glamClient.fetchState(statePda);
    const cnt = stateModel.integrationAcls.length;
    console.log(
      `Fund ${statePda.toBase58()} has ${cnt} integration${
        cnt > 1 ? "s" : ""
      } enabled`,
    );
    for (let [i, acl] of stateModel.integrationAcls.entries()) {
      console.log(`[${i}] ${Object.keys(acl.name)[0]}`);
    }
  });

integration
  .command("enable <integration>")
  .description("Enable an integration")
  .action(async (integration) => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    const stateModel = await glamClient.fetchState(statePda);
    const acl = stateModel.integrationAcls.find(
      (integ) => Object.keys(integ.name)[0] === integration,
    );
    if (acl) {
      console.log(
        `${integration} is already enabled on fund ${statePda.toBase58()}`,
      );
      process.exit(0);
    }

    const updatedFund = new StateModel({
      integrationAcls: [
        ...stateModel.integrationAcls,
        { name: { [integration]: {} } as IntegrationName, features: [] },
      ],
    });

    try {
      const txSig = await glamClient.program.methods
        .updateState(updatedFund)
        .accounts({ state: statePda })
        .rpc();
      console.log(`${integration} enabled on fund ${statePda.toBase58()}`);
      console.log("txSig:", txSig);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

integration
  .command("disable <integration>")
  .description("Disable an integration")
  .action(async (integration) => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    const stateModel = await glamClient.fetchState(statePda);
    const acl = stateModel.integrationAcls.find(
      (integ) => Object.keys(integ.name)[0] === integration,
    );
    if (!acl) {
      console.log(
        `${integration} is not enabled on fund ${statePda.toBase58()}`,
      );
      process.exit(0);
    }

    const updatedFund = new StateModel({
      integrationAcls: stateModel.integrationAcls.filter(
        (integ) => Object.keys(integ.name)[0] !== integration,
      ),
    });

    try {
      const txSig = await glamClient.program.methods
        .updateState(updatedFund)
        .accounts({ state: statePda })
        .rpc();
      console.log(`${integration} disabled on fund ${statePda.toBase58()}`);
      console.log("txSig:", txSig);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

const jup = fund.command("jup").description("JUP staking");
jup
  .command("stake <amount>")
  .description("Stake JUP tokens")
  .action(async (amount) => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    try {
      const txId = await glamClient.jupiter.stakeJup(
        statePda,
        new anchor.BN(amount * 10 ** 6), // decimals 6
      );
      console.log("stakeJup txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

jup
  .command("unstake")
  .description("Unstake JUP tokens")
  .action(async () => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }
    console.error("Not implemented");
    process.exit(1);
  });

const vote = fund
  .command("vote <proposal> <side>")
  .description("Vote on a proposal")
  .action(async (_proposal, side) => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    let proposal;
    let governor;
    try {
      proposal = new PublicKey(_proposal);
      const proposalAccountInfo =
        await glamClient.provider.connection.getAccountInfo(proposal);
      governor = new PublicKey(proposalAccountInfo.data.subarray(8, 40)); // first 8 bytes are discriminator
      console.log("Proposal governor:", governor.toBase58());
    } catch (e) {
      console.error("Error: invalid proposal:", _proposal);
      process.exit(1);
    }

    try {
      const txId = await glamClient.jupiter.voteOnProposal(
        statePda,
        proposal,
        governor,
        Number(side),
      );
      console.log("castVote txId", txId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

fund
  .command("wrap <amount>")
  .description("Wrap SOL")
  .action(async (amount) => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    try {
      const txSig = await glamClient.wsol.wrap(
        statePda,
        new anchor.BN(parseFloat(amount) * LAMPORTS_PER_SOL),
        cliTxOptions,
      );
      console.log(`Wrapped ${amount} SOL:`, txSig);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

fund
  .command("unwrap")
  .description("Unwrap wSOL")
  .action(async () => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    try {
      const txSig = await glamClient.wsol.unwrap(statePda, cliTxOptions);
      console.log(`All wSOL unwrapped:`, txSig);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

fund
  .command("balances")
  .description("Get fund balances")
  .option(
    "-a, --all",
    "Show all assets including token accounts with 0 balance",
  )
  .action(async (options) => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    const { all } = options;
    const vault = glamClient.getVaultPda(statePda);
    const tokenAccounts = await glamClient.getTokenAccountsByOwner(vault);
    const solBalance = await glamClient.provider.connection.getBalance(vault);

    const mints = tokenAccounts.map((ta) => ta.mint.toBase58());
    if (!mints.includes(WSOL.toBase58())) {
      mints.push(WSOL.toBase58());
    }
    const response = await fetch(
      `https://api.jup.ag/price/v2?ids=${mints.join(",")}`,
    );
    const { data } = await response.json();

    console.log("Token", "\t", "Amount", "\t", "Value (USD)");
    console.log(
      "SOL",
      "\t",
      solBalance / LAMPORTS_PER_SOL,
      "\t",
      (parseFloat(data[WSOL.toBase58()].price) * solBalance) / LAMPORTS_PER_SOL,
    );
    tokenAccounts.forEach((ta) => {
      if (all || ta.uiAmount > 0) {
        console.log(
          ta.mint.toBase58(),
          "\t",
          ta.uiAmount,
          "\t",
          parseFloat(data[ta.mint.toBase58()].price) * ta.uiAmount,
        );
      }
    });
  });

fund
  .command("swap <from> <to> <amount>")
  .description("Swap fund assets")
  .option("-m, --max-accounts <num>", "Specify max accounts allowed")
  .option("-s, --slippage-bps <bps>", "Specify slippage bps")
  .option("-d, --only-direct-routes", "Direct routes only")
  .action(async (from, to, amount, options) => {
    const { maxAccounts, slippageBps, onlyDirectRoutes } = options;

    const response = await fetch("https://tokens.jup.ag/tokens?tags=verified");
    const data = await response.json(); // an array of tokens

    const tokenFrom = data.find((t) => t.address === from);
    const tokenTo = data.find((t) => t.address === to);

    if (!tokenFrom || !tokenTo) {
      console.error("Error: cannot swap unverified token");
      process.exit(1);
    }

    let quoteParams = {
      inputMint: from,
      outputMint: to,
      amount: Math.floor(parseFloat(amount) * 10 ** tokenFrom.decimals),
      swapMode: "ExactIn",
      slippageBps: slippageBps ? parseInt(slippageBps) : 5,
      asLegacyTransaction: false,
    } as QuoteParams;
    if (maxAccounts) {
      quoteParams = {
        ...quoteParams,
        maxAccounts: parseInt(maxAccounts),
      };
    }
    if (onlyDirectRoutes) {
      quoteParams = {
        ...quoteParams,
        onlyDirectRoutes,
      };
    }
    console.log("Quote params:", quoteParams);
    try {
      const txSig = await glamClient.jupiter.swap(
        statePda,
        quoteParams,
        undefined,
        undefined,
        cliTxOptions,
      );
      console.log(`Swapped ${amount} ${from} to ${to}`);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

const lst = fund.command("lst").description("Liquid staking");
lst
  .command("stake <asset> <amount>")
  .description("Stake <amount> SOL into <asset> (mint address)")
  .action(async (asset, amount) => {
    console.error("Not implemented");
    process.exit(1);
  });
lst
  .command("unstake <asset> <amount>")
  .description("Unstake <amount> worth of <asset> (mint address)")
  .action(async (asset, amount) => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    try {
      const txSig = await glamClient.staking.unstake(
        statePda,
        new PublicKey(asset),
        //TODO: better decimals (even though all LSTs have 9 right now)
        new anchor.BN(parseFloat(amount) * LAMPORTS_PER_SOL),
        cliTxOptions,
      );
      console.log(`Unstaked ${amount} ${asset}:`, txSig);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
lst
  .command("list")
  .description("List all staking accounts")
  .action(async () => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    try {
      let stakeAccounts = await glamClient.staking.getStakeAccountsWithStates(
        glamClient.getVaultPda(statePda),
      );
      console.log(
        "Account                                     ",
        "\t",
        "Lamports",
        "\t",
        "State",
      );
      stakeAccounts.forEach((acc: any) => {
        console.log(
          acc.address.toBase58(),
          "\t",
          acc.lamports,
          "\t",
          acc.state,
        );
      });
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
lst
  .command("withdraw <accounts>")
  .description("Withdraw staking accounts (comma-separated)")
  .action(async (accounts) => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    try {
      const txSig = await glamClient.staking.withdrawFromStakeAccounts(
        statePda,
        accounts.split(",").map((addr: string) => new PublicKey(addr)),
      );
      console.log(`Withdrew from ${accounts}:`, txSig);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
lst
  .command("marinade-list")
  .description("List all Marinade tickets")
  .action(async () => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    try {
      let stakeAccounts = await glamClient.marinade.getTickets(statePda);
      console.log(
        "Ticket                                      ",
        "\t",
        "Lamports",
        "\t",
        "State",
      );
      stakeAccounts.forEach((acc: any) => {
        console.log(
          acc.address.toBase58(),
          "\t",
          acc.lamports,
          "\t",
          acc.state,
        );
      });
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
lst
  .command("marinade-claim <tickets>")
  .description("Claim Marinade tickets (comma-separated)")
  .action(async (tickets) => {
    if (!statePda) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    try {
      const txSig = await glamClient.marinade.claimTickets(
        statePda,
        tickets.split(",").map((addr: string) => new PublicKey(addr)),
      );
      console.log(`Claimed ${tickets}:`, txSig);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

program.parse(process.argv);

//
// For testing/debugging purpose, we can run arbitrary code in the main function
//
async function main(): Promise<void> {
  console.log("Main() called");
}

if (process.argv.length === 2 && !process.argv[1].endsWith(".js")) {
  // Not called as a cli, run main function
  main();
}
