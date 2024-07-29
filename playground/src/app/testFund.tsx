import { PublicKey } from "@solana/web3.js";

export const testFund = {
  fundPDA: new PublicKey("4gAcSdfSAxVPcxj2Hi3AvKKViGat3iUysDD5ZzbqhDTk"),
  treasuryPDA: "B6pnanhAQosKjSbWvhvQX3oxZfRJn1jmMpuXYqSrAR3d",
  treasuryMsolATA: "GSkYFJBNcnRNgGmC6KgkrGtsy2omk8yf94wTPJtcYNtw",
  treasuryWsolATA: "7VGH5FtzCcNGEor1Uaa1CA65v6D5xqrUDB7h9VJn8PUy",
  manager: "gLJHKPrZLGBiBZ33hFgZh6YnsEhTVxuRT17UCqNp6ff",
};

if (process.env.NODE_ENV === "development") {
  testFund.manager = "testzoWJjNHnojSLHTpbiktKGxuRRmgu1BKLSdVZ9o5";
  testFund.treasuryPDA = "7i41VPc3QiQog9GyhwkpieqwrEvC6PsiPfqRMTftyWAN";
  testFund.fundPDA = new PublicKey(
    "F5jC1BVPtRaHfYrjfSCUb66NAqYxbea5VXQFop3ttNni"
  );
}
