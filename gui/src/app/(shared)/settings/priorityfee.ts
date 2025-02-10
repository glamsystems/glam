import { getPriorityFeeEstimate } from "@glam/anchor/react";
import { LAMPORTS_PER_SOL, VersionedTransaction } from "@solana/web3.js";

const parseFeeSettings = () => {
  const storedValues = localStorage.getItem("priorityFee");

  let parsedValues = {};
  if (storedValues) {
    try {
      parsedValues = JSON.parse(storedValues);
    } catch (e) {}
  }
  return parsedValues as any;
};

export const getMaxCapFeeLamports = () => {
  const parsedValues = parseFeeSettings();
  const { maxCapFee, maxCapFeeUnit } = parsedValues;
  if (maxCapFeeUnit === "SOL") {
    return parseFloat(maxCapFee) * LAMPORTS_PER_SOL;
  }
  return parseFloat(maxCapFee);
};

export const getPriorityFeeMicroLamports = async (tx: VersionedTransaction) => {
  const parsedValues = parseFeeSettings();
  const { option } = parsedValues;
  if (option === "custom") {
    const { customFee } = parsedValues;
    console.log(`customFee ${customFee} microLamports`);
    // return customFeeUnit === "SOL"
    // ? customFee * LAMPORTS_PER_SOL * 1_000_000 // micro lamports
    return parseFloat(customFee);
  }

  if (["multiple", "dynamic"].includes(option)) {
    const { multiplier, maxCapFee, maxCapFeeUnit } = parsedValues;
    const parsedMultiplier =
      option === "multiple" ? parseFloat(multiplier) : 1.0;
    const estimate = await getPriorityFeeEstimate(
      process.env.NEXT_PUBLIC_HELIUS_API_KEY!,
      tx,
    );

    return estimate * parsedMultiplier;
  }

  return await getPriorityFeeEstimate(
    process.env.NEXT_PUBLIC_HELIUS_API_KEY!,
    tx,
  );
};
