import { PublicKey } from "@solana/web3.js";
import { GlamIDLJson } from "./glamExports";

export const SEED_METADATA = (
  GlamIDLJson.constants.find((x) => x.name === "SEED_METADATA")?.value || ""
).replace(/"/g, "");
export const SEED_MINT = (
  GlamIDLJson.constants.find((x) => x.name === "SEED_MINT")?.value || ""
).replace(/"/g, "");
export const SEED_STATE = (
  GlamIDLJson.constants.find((x) => x.name === "SEED_STATE")?.value || ""
).replace(/"/g, "");
export const SEED_VAULT = (
  GlamIDLJson.constants.find((x) => x.name === "SEED_VAULT")?.value || ""
).replace(/"/g, "");

/**
 * Token mints. If no devnet version is defined, assume mainnet and devnet addresses are the same.
 *
 * Unless otherwise noted, all mints have 9 decimals.
 */
export const WSOL = new PublicKey(
  "So11111111111111111111111111111111111111112",
);
export const MSOL = new PublicKey(
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
);
export const JITOSOL = new PublicKey(
  "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
);
// USDC, 6 decimals
export const USDC = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
);
// Wrapped ETH (Wormhole), 8 decimals
export const WETH = new PublicKey(
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
);
// Wrapped BTC (Wormhole), 8 decimals
export const WBTC = new PublicKey(
  "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
);
// JUP, 6 decimals
export const JUP = new PublicKey("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN");

/**
 * Program IDs
 */
export const MARINADE_PROGRAM_ID = new PublicKey(
  "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD",
);
export const DRIFT_PROGRAM_ID = new PublicKey(
  "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH",
);
export const JUPITER_PROGRAM_ID = new PublicKey(
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
);
export const SANCTUM_STAKE_POOL_PROGRAM_ID = new PublicKey(
  "SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY",
);
export const GOVERNANCE_PROGRAM_ID = new PublicKey(
  "GovaE4iu227srtG2s3tZzB4RmWBzw8sTwrCLZz7kN7rY",
);
export const JUP_VOTE_PROGRAM = new PublicKey(
  "voTpe3tHQ7AjQHMapgSue2HJFAh2cGsdokqN3XqmVSj",
);

/**
 * Stake pools
 */
export const JITO_STAKE_POOL = new PublicKey(
  "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb",
);

export const JUPSOL_STAKE_POOL = new PublicKey(
  "8VpRhuxa7sUUepdY3kQiTmX9rS5vx4WgaXiAnXq4KCtr",
);
