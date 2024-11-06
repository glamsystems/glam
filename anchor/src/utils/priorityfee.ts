import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { VersionedTransaction } from "@solana/web3.js";

// https://docs.helius.dev/guides/priority-fee-api
type PriorityLevel =
  | "Min"
  | "Low"
  | "Medium"
  | "High"
  | "VeryHigh"
  | "UnsafeMax"
  | "Default";

export const getPriorityFeeEstimate = async (
  priorityLevel: PriorityLevel,
  tx: VersionedTransaction,
  heliusApiKey: string
) => {
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
            transaction: bs58.encode(tx.serialize()),
            options: { priorityLevel },
          },
        ],
      }),
    }
  );
  const data = await response.json();
  console.log(
    `priorityFeeEstimate for priorityLevel ${priorityLevel}: ${data.result.priorityFeeEstimate}`
  );
  return data.result.priorityFeeEstimate;
};
