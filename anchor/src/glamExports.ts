// Here we export some useful types and functions for interacting with the Anchor program.
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { Glam } from "../target/types/glam";
import GlamIDLUntyped from "../target/idl/glam.json";

import type { ClusterOrCustom } from "./clientConfig";

const GlamIDL = GlamIDLUntyped as Glam;
export { Glam, GlamIDL };
export type GlamProgram = Program<Glam>;

export const GLAM_PROGRAM_ID_DEV = new PublicKey(
  "Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc"
);
export const GLAM_PROGRAM_ID_MAINNET = new PublicKey(
  "GLAMpLuXu78TA4ao3DPZvT1zQ7woxoQ8ahdYbhnqY9mP"
);

export const GLAM_FORCE_MAINNET = false;

export function getGlamProgramId(cluster: ClusterOrCustom) {
  if (GLAM_FORCE_MAINNET) return GLAM_PROGRAM_ID_MAINNET;
  switch (cluster) {
    case "mainnet-beta":
      return GLAM_PROGRAM_ID_MAINNET;

    default:
      return GLAM_PROGRAM_ID_DEV;
  }
}
