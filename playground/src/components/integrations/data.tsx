import { VaultIntegrations } from "../../../../anchor/src";

const metadata = {
  Drift: {
    description: "Trade on Drift, a decentralized exchange",
    labels: ["DeFi"],
  },
  SplStakePool: {
    description:
      "SPL liquid staking protocol that allows users to stake their SOL and receive LST",
    labels: ["LST"],
  },
  SanctumStakePool: {
    description:
      "Sanctum liquid staking protocol that allows users to stake their SOL and receive LST",
    labels: ["LST"],
  },
  NativeStaking: {
    description: "Stake SOL natively",
    labels: ["Staking"],
  },
  Marinade: {
    description: "Stake SOL and receive mSOL",
    labels: ["LST"],
  },
  JupiterSwap: {
    description: "Swap tokens with Jupiter",
    labels: ["DeFi", "LST"],
  },
  JupiterVote: {
    description: "Vote on Jupiter DAO proposals",
    labels: ["DAO"],
  },
} as { [key: string]: { description: string; labels: string[] } };

export const allIntegrations = VaultIntegrations.sort().map((integ, index) => ({
  id: index,
  name: integ,
  enabled: false,
  ...(metadata[integ] || {}),
}));

export type Integration = (typeof allIntegrations)[number];
