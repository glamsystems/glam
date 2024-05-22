// Here we export some useful types and functions for interacting with the Anchor program.
import { Cluster, PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { IDL as GlamIDL } from "../target/types/glam";
import type { Glam } from "../target/types/glam";

import type { ClusterOrCustom } from "./clientConfig";

// anchor 0.30
// import GlamIDLUntyped from '../target/idl/glam.json';
// const GlamIDL = GlamIDLUntyped as Glam;

export { Glam, GlamIDL };
export type GlamProgram = Program<Glam>;

// After updating your program ID (e.g. after running `anchor keys sync`) update the value below.
export const GLAM_PROGRAM_ID = new PublicKey(
  "Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc"
);

// This is a helper function to get the program ID for the Glam program depending on the cluster.
export function getGlamProgramId(cluster: ClusterOrCustom) {
  switch (cluster) {
    case "devnet":
    case "testnet":
    case "mainnet-beta":
      // You only need to update this if you deploy your program on one of these clusters.
      return GLAM_PROGRAM_ID;
    default:
      return GLAM_PROGRAM_ID;
  }
}
