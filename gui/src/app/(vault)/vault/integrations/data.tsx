import { GlamIntegrations } from "@glamsystems/glam-sdk";

export interface IntegrationMetadata {
  name: string;
  description: string;
  labels: string[];
  imagePath: string;
}

export const metadata: { [key: string]: IntegrationMetadata } = {
  Drift: {
    name: "Drift",
    description: "Trade perpetual futures on Drift, a decentralized exchange.",
    labels: ["DEX", "Derivatives"],
    imagePath: "/images/integrations/drift.svg",
  },
  SplStakePool: {
    name: "SPL Stake Pool",
    description:
      "Stake SOL with the SPL liquid staking protocol and receive liquid staked tokens.",
    labels: ["Staking", "LST"],
    imagePath: "/images/integrations/solana.svg",
  },
  SanctumStakePool: {
    name: "Sanctum Stake Pool",
    description:
      "Stake SOL with the Sanctum liquid staking protocol and receive liquid staked tokens.",
    labels: ["Staking", "LST"],
    imagePath: "/images/integrations/sanctum.svg",
  },
  NativeStaking: {
    name: "Native Staking",
    description:
      "Stake SOL natively to secure the Solana network and earn yield.",
    labels: ["Staking"],
    imagePath: "/images/integrations/solana.svg",
  },
  Marinade: {
    name: "Marinade",
    description:
      "Stake SOL with Marinade and receive mSOL, a liquid staking token.",
    labels: ["Staking", "LST"],
    imagePath: "/images/integrations/marinade.svg",
  },
  JupiterSwap: {
    name: "Jupiter Swap",
    description:
      "Swap tokens using Jupiter, a DEX aggregator with access to multiple liquidity sources.",
    labels: ["DEX"],
    imagePath: "/images/integrations/jupiter.svg",
  },
  JupiterVote: {
    name: "Jupiter Governance",
    description:
      "Participate in Jupiter DAO governance by voting on proposals.",
    labels: ["Governance"],
    imagePath: "/images/integrations/jupiter.svg",
  },
  KaminoLending: {
    name: "Kamino Lending",
    description:
      "Lend and borrow SOL and other assets with Kamino, a decentralized lending protocol.",
    labels: ["Lending"],
    imagePath: "/images/integrations/kamino2.svg",
  },
} satisfies { [key: string]: IntegrationMetadata };

export const allIntegrations = GlamIntegrations.sort().map((integ, index) => ({
  id: index,
  key: integ, // Keep original key for integration identification
  enabled: false,
  comingSoon: false,
  ...(metadata[integ] || {}),
}));
// TODO: move to metadata list once program is ready
allIntegrations.push({
  id: allIntegrations.length,
  name: "Meteora DLMM",
  key: "MeteoraDLMM",
  enabled: false,
  description:
    "Trade tokens on Meteora's Dynamic Liquidity Market Maker (DLMM).",
  labels: ["LP"],
  comingSoon: true,
  imagePath: "/images/integrations/meteora.svg",
});

export type Integration = (typeof allIntegrations)[number];
