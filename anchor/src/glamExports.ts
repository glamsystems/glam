import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

import type { ClusterNetwork } from "./clientConfig";
import type { Glam } from "../target/types/glam";
import GlamIDLJson from "../target/idl/glam.json";

const GlamIDL = GlamIDLJson as Glam;
export { Glam, GlamIDL, GlamIDLJson };
export type GlamProgram = Program<Glam>;

export const GLAM_PROGRAM_ID_DEV = new PublicKey(
  "Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc",
);
export const GLAM_PROGRAM_ID_MAINNET = new PublicKey(
  "GLAMpLuXu78TA4ao3DPZvT1zQ7woxoQ8ahdYbhnqY9mP",
);

export function getGlamProgramId(cluster: ClusterNetwork) {
  switch (cluster) {
    case "mainnet-beta":
      return GLAM_PROGRAM_ID_MAINNET;

    default:
      return GLAM_PROGRAM_ID_DEV;
  }
}
