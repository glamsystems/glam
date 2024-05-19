import { Provider } from "@coral-xyz/anchor";
import { Cluster } from "@solana/web3.js";

export type ClusterOrCustom = Cluster | "custom";

export type GlamClientConfig = {
  provider?: Provider;
  cluster?: ClusterOrCustom;
};
