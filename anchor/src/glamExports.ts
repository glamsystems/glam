import { Program, Provider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

import type { ClusterNetwork } from "./clientConfig";
import type { Glam } from "../target/types/glam";
import GlamIDLJson from "../target/idl/glam.json";

const GlamIDL = GlamIDLJson as Glam;
export { Glam, GlamIDL, GlamIDLJson };
export type GlamProgram = Program<Glam>;

export function getGlamProgramId(cluster?: ClusterNetwork) {
  switch (cluster) {
    case "mainnet-beta":
      return new PublicKey("GLAMbTqav9N9witRjswJ8enwp9vv5G8bsSJ2kPJ4rcyc");

    default:
      return new PublicKey("Gco1pcjxCMYjKJjSNJ7mKV7qezeUTE7arXJgy7PAPNRc");
  }
}

export function getGlamProgram(
  cluster: ClusterNetwork,
  provider: Provider,
): GlamProgram {
  switch (cluster) {
    case "mainnet-beta":
      return new Program(GlamIDL, provider) as GlamProgram;

    default:
      const idl = { ...GlamIDLJson };
      idl.address = getGlamProgramId(cluster).toBase58();
      return new Program(idl as Glam, provider) as GlamProgram;
  }
}
