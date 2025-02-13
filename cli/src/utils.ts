import { AnchorError } from "@coral-xyz/anchor";
import { PriorityLevel } from "@glamsystems/glam-sdk";
import { TransactionExpiredBlockheightExceededError } from "@solana/web3.js";
import fs from "fs";
import os from "os";
import path from "path";

export type CliConfig = {
  cluster: string;
  json_rpc_url: string;
  tx_rpc_url: string;
  keypair_path: string;
  priority_fee?: {
    micro_lamports?: number;
    level?: PriorityLevel;
    helius_api_key?: string;
  };
  glam_state?: string;
};

const getConfigPath = () => {
  // By default config.json is under ~/.config/glam/
  // If running in docker, config.json is expected to be at /workspace/config.json
  const configHomeDefault = path.join(os.homedir(), ".config/glam/");
  const configPath = path.join(
    process.env.DOCKER ? "/workspace" : configHomeDefault,
    "config.json",
  );
  return configPath;
};

export const loadingConfig = () => {
  const configPath = getConfigPath();
  let cliConfig: CliConfig;
  try {
    const config = fs.readFileSync(configPath, "utf8");
    cliConfig = JSON.parse(config) as CliConfig;
  } catch (err) {
    console.error(`Could not load glam config at ${configPath}:`, err.message);
  }

  if (!cliConfig.json_rpc_url) {
    throw new Error("Missing json_rpc_url in config.json");
  }

  if (!cliConfig.keypair_path) {
    throw new Error("Missing keypair_path in config.json");
  }

  if (
    !["mainnet-beta", "devnet", "localnet"].includes(
      cliConfig.cluster.toLowerCase(),
    )
  ) {
    throw new Error(
      `Unsupported cluster: ${cliConfig.cluster}, must be mainnet-beta, devnet or localnet`,
    );
  }

  if (cliConfig.tx_rpc_url) {
    process.env.TX_RPC = cliConfig.tx_rpc_url;
  }

  process.env.ANCHOR_PROVIDER_URL = cliConfig.json_rpc_url;
  process.env.ANCHOR_WALLET = cliConfig.keypair_path;

  return cliConfig;
};

export const setStateToConfig = (statePda: string) => {
  const configPath = getConfigPath();
  const config = fs.readFileSync(configPath, "utf8");
  const updated = { ...JSON.parse(config), glam_state: statePda };
  fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), "utf8");
};

export const parseTxError = (error: any) => {
  if (error instanceof TransactionExpiredBlockheightExceededError) {
    return "Transaction expired";
  }

  if (error instanceof AnchorError) {
    return error.error.errorMessage;
  }

  return error?.message || "Unknown error";
};
