import { getPriorityFeeEstimate } from "@glam/anchor/react";
import { LAMPORTS_PER_SOL, VersionedTransaction } from "@solana/web3.js";

export const getPriorityFeeMicroLamports = async (tx: VersionedTransaction) => {
  const storedValues = localStorage.getItem("priorityFee");

  if (storedValues) {
    let parsedValues;
    try {
      parsedValues = JSON.parse(storedValues);
    } catch (e) {
      parsedValues = {};
    }

    const { option } = parsedValues;
    if (option === "custom") {
      const { customFee, customFeeUnit } = parsedValues;
      console.log(`customFee ${customFee}: customFeeUnit ${customFeeUnit}`);
      return customFeeUnit === "SOL" ? customFee * LAMPORTS_PER_SOL : customFee;
    }

    if (["multiple", "dynamic"].includes(option)) {
      const { multiplier, maxCapFee, maxCapFeeUnit } = parsedValues;
      const parsedMultiplier = option === "multiple" ? parseInt(multiplier) : 1;
      const estimate = await getPriorityFeeEstimate(
        process.env.NEXT_PUBLIC_HELIUS_API_KEY!,
        tx
      );

      const totalEstimate = estimate * parsedMultiplier;
      const maxAllowed =
        maxCapFeeUnit === "SOL" ? maxCapFee * LAMPORTS_PER_SOL : maxCapFee;

      console.log(
        `totalEstimate ${totalEstimate}: estimate: ${estimate}, parsedMultiplier ${parsedMultiplier}`
      );
      console.log(
        `maxAllowed ${maxAllowed}: maxCapFee ${maxCapFee}, maxCapFeeUnit ${maxCapFeeUnit}`
      );

      return totalEstimate > maxAllowed ? maxAllowed : totalEstimate;
    }
  }

  return await getPriorityFeeEstimate(
    process.env.NEXT_PUBLIC_HELIUS_API_KEY!,
    tx
  );
};
