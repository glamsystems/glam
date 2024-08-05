import { PublicKey } from "@solana/web3.js";

// Only need to provide fund and manager addresses. All other addresses can be derived from them.
export const testFund = {
  fundPDA: new PublicKey("4gAcSdfSAxVPcxj2Hi3AvKKViGat3iUysDD5ZzbqhDTk"),
  manager: new PublicKey("gLJHKPrZLGBiBZ33hFgZh6YnsEhTVxuRT17UCqNp6ff"),
};

// Override test fund and manager if environment variables are set
if (
  process.env.NEXT_PUBLIC_TEST_FUND_PDA &&
  process.env.NEXT_PUBLIC_TEST_FUND_MANAGER
) {
  testFund.fundPDA = new PublicKey(process.env.NEXT_PUBLIC_TEST_FUND_PDA);
  testFund.manager = new PublicKey(process.env.NEXT_PUBLIC_TEST_FUND_MANAGER);
}
