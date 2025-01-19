import { VaultIntegrations } from "@glam/anchor";

const metadata = {
  Drift: {
    description: "Trade perpetual futures on Drift, a decentralized exchange.",
    labels: ["DEX", "Derivatives"],
  },
  SplStakePool: {
    description:
      "Stake SOL with the SPL liquid staking protocol and receive liquid staked tokens.",
    labels: ["Staking", "LST"],
  },
  SanctumStakePool: {
    description:
      "Stake SOL with the Sanctum liquid staking protocol and receive liquid staked tokens.",
    labels: ["Staking", "LST"],
  },
  NativeStaking: {
    description:
      "Stake SOL natively to secure the Solana network and earn yield.",
    labels: ["Staking"],
  },
  Marinade: {
    description:
      "Stake SOL with Marinade and receive mSOL, a liquid staking token.",
    labels: ["Staking", "LST"],
  },
  JupiterSwap: {
    description:
      "Swap tokens using Jupiter, a DEX aggregator with access to multiple liquidity sources.",
    labels: ["DEX"],
  },
  JupiterVote: {
    description:
      "Participate in Jupiter DAO governance by voting on proposals.",
    labels: ["Governance"],
  },
} as { [key: string]: { description: string; labels: string[] } };

export const allIntegrations = VaultIntegrations.sort().map((integ, index) => ({
  id: index,
  name: integ,
  enabled: false,
  ...(metadata[integ] || {}),
}));

export type Integration = (typeof allIntegrations)[number];
