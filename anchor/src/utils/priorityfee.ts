import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { VersionedTransaction } from "@solana/web3.js";

// https://docs.helius.dev/guides/priority-fee-api
export type PriorityLevel =
  | "Min"
  | "Low"
  | "Medium"
  | "High"
  | "VeryHigh"
  | "UnsafeMax"
  | "Default";

export const getPriorityFeeEstimate = async (
  heliusApiKey: string,
  tx?: VersionedTransaction,
  accountKeys?: string[],
  priorityLevel?: PriorityLevel,
) => {
  if (!tx && !accountKeys) {
    throw new Error("Either tx or accountKeys must be provided");
  }

  const options = priorityLevel ? { priorityLevel } : { recommended: true };
  const param = tx
    ? { transaction: bs58.encode(tx.serialize()) }
    : { accountKeys };

  const response = await fetch(
    `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getPriorityFeeEstimate",
        params: [
          {
            ...param,
            options,
          },
        ],
      }),
    },
  );
  const data = await response.json();
  console.log("getPriorityFeeEstimate with options", options, data.result);
  return data.result.priorityFeeEstimate as number;
};
