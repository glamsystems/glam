export const integrations = [
  {
    id: "1",
    name: "Stake",
    active: true,
    disabled: false,
    description: "",
    labels: []
  },
  {
    id: "2",
    name: "Swap",
    active: true,
    disabled: false,
    description: "",
    labels: []
  },
  {
    id: "3",
    name: "Trade",
    active: true,
    disabled: false,
    description: "",
    labels: []
  },
  {
    id: "4",
    name: "Lend",
    active: false,
    disabled: false,
    description: "Coming Soon",
    labels: []
  },
]

export type Integrations = (typeof integrations)[number]
