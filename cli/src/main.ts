import * as anchor from "@coral-xyz/anchor";
import { FundModel, GlamClient, MSOL, USDC, WSOL } from "@glam/anchor";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import * as fundJson from "../fund.json";
import { Command } from "commander";

import fs from "fs";
import os from "os";
import path from "path";
import { setFundToConfig } from "./utils";

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

const anchorProvider = anchor.AnchorProvider.env();
const glamClient = new GlamClient({
  provider: anchorProvider,
  cluster: "mainnet-beta",
});

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

const fund = program
  .command("fund")
  .description("Manage fund configurations")
  .option("-s, --simulate", "Simulate transactions");

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

program.parse(process.argv);

//
// For testing/debugging purpose, we can run arbitrary code in the main function
//
async function main(): Promise<void> {
  console.log(JSON.stringify(fundJson));
}

if (process.argv.length === 2 && !process.argv[1].endsWith(".js")) {
  // Not called as a cli, run main function
  main();
}

// const fundPDA = new PublicKey("BkbYM6H5zag7Z15U1VvaF7aE5gQYxF6UwS5tAM7cxVxR");
// const trader = new PublicKey("bot32VLbcjGTLCgi8aZ7Q7V8EgoNwpW4yzoqfJWZJyg");
// try {
//   const txId = await glamClient.drift.updateUserDelegate(fundPDA, trader);
//   console.log("driftUpdateUserDelegate", txId);
// } catch (e) {
//   console.error(e);
//   throw e;
// }
// Update the fund object listed above before creating the fund
/*
  const [txId, fundPDA] = await glamClient.createFund(fund);
  console.log("Fund PDA:", fundPDA.toBase58());
  console.log("txId:", txId);
  */

// Update the fund pubkey before closing the share class
/*
  const fundPDA = new PublicKey("Dc88inhuwymwyvVR7Sy7MdeYyxsAvPaCgYZfAQsY3skJ");
  try {
    const txId = await glamClient.program.methods
      .closeShareClass(0)
      .accounts({
        fund: fundPDA,
        shareClassMint: glamClient.getShareClassPDA(fundPDA, 0),
        openfunds: glamClient.getOpenfundsPDA(fundPDA),
      })
      .rpc();
    console.log("txId:", txId);
  } catch (error) {
    console.error(error);
    throw error;
  }
  */

// Update the fund pubkey before closing the fund
/*
  const fundPDA = new PublicKey("Dc88inhuwymwyvVR7Sy7MdeYyxsAvPaCgYZfAQsY3skJ");
  try {
    const txId = await glamClient.program.methods
      .closeFund()
      .accounts({
        fund: fundPDA,
        openfunds: glamClient.getOpenfundsPDA(fundPDA),
      })
      .rpc();
    console.log("txId:", txId);
  } catch (error) {
    console.error(error);
    throw error;
  }
  */
