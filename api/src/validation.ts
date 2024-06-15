import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export const validatePubkey = (pubkey: string): PublicKey => {
  let key;
  try {
    key = new PublicKey(pubkey);
  } catch (_e) {
    return undefined;
  }
  return key;
};

export const validateBN = (num: string): BN => {
  let res;
  try {
    res = new BN(num);
  } catch (_e) {
    console.error(_e);
    return undefined;
  }
  return res;
};
