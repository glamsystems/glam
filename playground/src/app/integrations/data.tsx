export const integrations = [
  {
    id: "1",
    name: "Stake",
    active: true,
    description: "",
    labels: []
  },
  {
    id: "2",
    name: "Swap",
    active: true,
    description: "",
    labels: []
  },
  {
    id: "3",
    name: "Trade",
    active: true,
    description: "",
    labels: []
  },
  {
    id: "4",
    name: "Borrow/Lend",
    active: false,
    description: "Coming Soon",
    labels: []
  },
]

export type Integrations = (typeof integrations)[number]
