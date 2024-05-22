import { base58 } from "@scure/base";
import { PublicKey } from "@solana/web3.js";

export const validatePubkey = (pubkey: string) => {
  let key;
  try {
    key = new PublicKey(pubkey);
  } catch (_e) {
    return undefined;
  }
  return key;
};

module.exports = { validatePubkey };
