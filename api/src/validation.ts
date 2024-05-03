import { base58 } from "@scure/base";
import { PublicKey } from "@solana/web3.js";

export function validatePubkey(pubkey: string): PublicKey | undefined {
  if (pubkey.length > 50) {
    return undefined;
  }
  let key;
  try {
    key = base58.decode(pubkey);
    if (key.length != 32) {
      return undefined;
    }
  } catch (_e) {
    return undefined;
  }
  return new PublicKey(key);
}
