import { Provider } from "@coral-xyz/anchor";
import { Cluster } from "@solana/web3.js";

export type GlamClientConfig = {
  provider?: Provider;
  cluster?: Cluster;
};
