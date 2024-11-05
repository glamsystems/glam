import * as anchor from "@coral-xyz/anchor";
import { FundModel, WSOL } from "@glam/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Command } from "commander";

import fs from "fs";
import os from "os";
import path from "path";
import { getGlamClient, setFundToConfig } from "./utils";
import { QuoteParams } from "anchor/src/client/jupiter";

const configPath = path.join(os.homedir(), ".config/glam/cli/config.json");
let fundPDA;
try {
  const config = fs.readFileSync(configPath, "utf8");
  const { json_rpc_url, keypair_path, fund } = JSON.parse(config);
  process.env.ANCHOR_PROVIDER_URL = json_rpc_url;
  process.env.ANCHOR_WALLET = keypair_path;
  fundPDA = new PublicKey(fund);
} catch (err) {
  console.error(`Could not load config at ${configPath}:`, err.message);
}

const glamClient = getGlamClient();

const program = new Command();

program
  .name("glam-cli")
  .description("CLI for interacting with the GLAM onchain program")
  .version("0.0.1");

program
  .command("env")
  .description("Show environment setup")
  .action(async () => {
    console.log("Program ID:", glamClient.programId.toBase58());
    console.log("Wallet connected:", glamClient.getManager().toBase58());
    console.log("RPC endpoint:", glamClient.provider.connection.rpcEndpoint);
  });

program
  .command("funds")
  .description("List all funds the connected wallet has access to")
  .option("-m, --manager-only", "Only list funds with full manager access")
  .option("-a, --all", "All GLAM funds")
  .action(async () => {
    const funds = await glamClient.fetchAllFunds();
    funds
      .sort((a, b) => (a.fundLaunchDate > b.fundLaunchDate ? 1 : -1))
      .map((f: FundModel) => {
        console.log(f.fundId.toBase58(), "\t", f.fundLaunchDate, "\t", f.name);
      });
  });

const fund = program.command("fund").description("Manage fund");

fund
  .command("set <fund>")
  .description("Set active fund")
  .action((fund) => {
    setFundToConfig(fund, configPath);
  });

fund
  .command("create <path>")
  .description("Create fund from a json file")
  .action(async (file) => {
    const data = fs.readFileSync(file, "utf8");
    const fundData = JSON.parse(data);

    // Convert pubkey strings to PublicKey objects
    for (let i = 0; i < fundData.shareClasses.length; ++i) {
      fundData.shareClasses[i].asset = new PublicKey(
        fundData.shareClasses[i].asset
      );
    }
    fundData.assets = fundData.assets.map((a) => new PublicKey(a));

    try {
      const [txSig, fundPDA] = await glamClient.createFund(fundData);
      console.log("Fund created:", fundPDA.toBase58());
      console.log("txSig:", txSig);

      setFundToConfig(fundPDA.toBase58(), configPath);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

fund
  .command("close <fund>")
  .description("Close the fund")
  .action(async (f) => {
    const fundPDA = new PublicKey(f);
    const { simulate } = fund.opts();

    try {
      const closeShareClassIx = await glamClient.program.methods
        .closeShareClass(0)
        .accounts({
          fund: fundPDA,
          shareClassMint: glamClient.getShareClassPDA(fundPDA, 0),
          openfunds: glamClient.getOpenfundsPDA(fundPDA),
        })
        .instruction();
      const builder = await glamClient.program.methods
        .closeFund()
        .accounts({
          fund: fundPDA,
          openfunds: glamClient.getOpenfundsPDA(fundPDA),
        })
        .preInstructions([closeShareClassIx]);

      if (simulate) {
        const res = await builder.simulate();
        console.log(`Simulated closing ${fundPDA.toBase58()}:`, res);
      } else {
        const txSig = await builder.rpc();
        console.log(`Fund ${fundPDA.toBase58()} closed:`, txSig);
      }
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

const delegate = fund.command("delegate").description("Manage fund delegates");
delegate
  .command("get")
  .description("List fund delegates and permissions")
  .action(async () => {
    if (!fundPDA) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    const fundModel = await glamClient.fetchFund(fundPDA);
    const cnt = fundModel.delegateAcls.length;
    console.log(
      `Fund ${fundPDA.toBase58()} has ${cnt} delegate acl${cnt > 1 ? "s" : ""}`
    );
    for (let [i, acl] of fundModel.delegateAcls.entries()) {
      console.log(
        `[${i}] ${acl.pubkey.toBase58()}:`,
        acl.permissions.map((p) => Object.keys(p)[0]).join(", ")
      );
    }
  });

delegate
  .command("set <pubkey> <permissions>")
  .description("Set delegate permissions")
  .action(async (pubkey, permissions) => {
    if (!fundPDA) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    const glamPermissions = permissions.split(",").map((p) => ({
      [p]: {},
    }));
    try {
      const txSig = await glamClient.upsertDelegateAcls(fundPDA, [
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
    if (!fundPDA) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    const fundModel = await glamClient.fetchFund(fundPDA);
    const cnt = fundModel.integrationAcls.length;
    console.log(
      `Fund ${fundPDA.toBase58()} has ${cnt} integration${
        cnt > 1 ? "s" : ""
      } enabled`
    );
    for (let [i, acl] of fundModel.integrationAcls.entries()) {
      console.log(`[${i}] ${Object.keys(acl.name)[0]}`);
    }
  });

integration
  .command("enable <integration>")
  .description("Enable an integration")
  .action(async (integration) => {
    if (!fundPDA) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    const fundModel = await glamClient.fetchFund(fundPDA);
    const acl = fundModel.integrationAcls.find(
      (integ) => Object.keys(integ.name)[0] === integration
    );
    if (acl) {
      console.log(
        `${integration} is already enabled on fund ${fundPDA.toBase58()}`
      );
      process.exit(0);
    }

    const updatedFund = glamClient.getFundModel({
      integrationAcls: [
        ...fundModel.integrationAcls,
        { name: { [integration]: {} }, features: [] },
      ],
    });

    try {
      const txSig = await glamClient.program.methods
        .updateFund(updatedFund)
        .accounts({ fund: fundPDA })
        .rpc();
      console.log(`${integration} enabled on fund ${fundPDA.toBase58()}`);
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
    if (!fundPDA) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    const fundModel = await glamClient.fetchFund(fundPDA);
    const acl = fundModel.integrationAcls.find(
      (integ) => Object.keys(integ.name)[0] === integration
    );
    if (!acl) {
      console.log(
        `${integration} is not enabled on fund ${fundPDA.toBase58()}`
      );
      process.exit(0);
    }

    const updatedFund = glamClient.getFundModel({
      integrationAcls: fundModel.integrationAcls.filter(
        (integ) => Object.keys(integ.name)[0] !== integration
      ),
    });

    try {
      const txSig = await glamClient.program.methods
        .updateFund(updatedFund)
        .accounts({ fund: fundPDA })
        .rpc();
      console.log(`${integration} disabled on fund ${fundPDA.toBase58()}`);
      console.log("txSig:", txSig);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

fund
  .command("wrap <amount>")
  .description("Wrap SOL")
  .action(async (amount) => {
    if (!fundPDA) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    try {
      const txSig = await glamClient.wsol.wrap(
        fundPDA,
        new anchor.BN(parseFloat(amount) * LAMPORTS_PER_SOL)
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
    if (!fundPDA) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    try {
      const txSig = await glamClient.wsol.unwrap(fundPDA);
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
    "Show all assets including token accounts with 0 balance"
  )
  .action(async (options) => {
    if (!fundPDA) {
      console.error("Error: fund not set");
      process.exit(1);
    }

    const { all } = options;
    const treasury = glamClient.getTreasuryPDA(fundPDA);
    const tokenAccounts = await glamClient.listTokenAccounts(treasury);
    const solBalance = await glamClient.provider.connection.getBalance(
      treasury
    );
    const mints = tokenAccounts.map((ta) => ta.mint);
    if (!mints.includes(WSOL.toBase58())) {
      mints.push(WSOL.toBase58());
    }
    const response = await fetch(
      `https://api.jup.ag/price/v2?ids=${mints.join(",")}`
    );
    const { data } = await response.json();

    console.log("Token", "\t", "Amount", "\t", "Value (USD)");
    console.log(
      "SOL",
      "\t",
      solBalance / LAMPORTS_PER_SOL,
      "\t",
      (parseFloat(data[WSOL.toBase58()].price) * solBalance) / LAMPORTS_PER_SOL
    );
    tokenAccounts.forEach((ta) => {
      if (all || parseFloat(ta.uiAmount) > 0) {
        console.log(
          ta.mint,
          "\t",
          ta.uiAmount,
          "\t",
          parseFloat(data[ta.mint].price) * parseFloat(ta.uiAmount)
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
      amount: parseFloat(amount) * 10 ** tokenFrom.decimals,
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
      const txSig = await glamClient.jupiter.swap(fundPDA, quoteParams);
      console.log(`Swapped ${amount} ${from} to ${to}`);
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
