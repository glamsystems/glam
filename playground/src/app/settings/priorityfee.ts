import { getPriorityFeeEstimate } from "@glam/anchor/react";
import { VersionedTransaction } from "@solana/web3.js";

export const getPriorityFeeMicroLamports = async (tx: VersionedTransaction) =>
  await getPriorityFeeEstimate(process.env.NEXT_PUBLIC_HELIUS_API_KEY!, tx);
