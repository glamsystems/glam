export const integrations = [
  {
    id: 0,
    name: "Drift",
    active: true,
    description: "Trade on Drift.",
    labels: ["trade"],
  },
  {
    id: 1,
    name: "Jupiter",
    active: true,
    description: "Swap on Jupiter.",
    labels: ["swap"],
  },
  {
    id: 2,
    name: "Marinade",
    active: false,
    description: "Stake on Marinade.",
    labels: ["stake"],
  },
  {
    id: 3,
    name: "Sanctum Stake Pools",
    active: false,
    description: "Stake on Sanctum pools.",
    labels: ["stake"],
  },
  {
    id: 4,
    name: "SPL Stake Pools",
    active: false,
    description: "Stake on SPL pools.",
    labels: ["stake"],
  },
  {
    id: 5,
    name: "Native Staking",
    active: false,
    description: "Stake natively.",
    labels: ["stake"],
  },
];

export type Integrations = (typeof integrations)[number];
