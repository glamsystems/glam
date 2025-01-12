import { WalletSignTransactionError } from "@solana/wallet-adapter-base";
import { TransactionExpiredBlockheightExceededError } from "@solana/web3.js";
/**
 * Parse the error message from a transaction
 * @param error Error object
 * @returns Error message
 */
export function parseTxError(error: any): string {
  console.log("Parsing tx error:", error);
  if (error instanceof WalletSignTransactionError) {
    return "Transaction was cancelled by the user";
  }

  if (error instanceof TransactionExpiredBlockheightExceededError) {
    return "Transaction expired";
  }

  return error?.message || "Unknown error";
}
