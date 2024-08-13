export const integrations = [
  {
    id: "1",
    name: "Drift",
    active: true,
    description: "Trade on Drift.",
    labels: ["trading","derivatives"]
  },
  {
    id: "2",
    name: "Marinade",
    active: false,
    description: "Stake on Marinade.",
    labels: ["staking"]
  },
  {
    id: "3",
    name: "Jupiter",
    active: true,
    description: "Swap on Jupiter.",
    labels: ["swap","spot"]
  },
]

export type Integrations = (typeof integrations)[number]
