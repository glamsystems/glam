export const integrations = [
  {
    id: 0,
    name: "Stake",
    active: true,
    disabled: false,
    description: "",
    labels: [],
  },
  {
    id: 1,
    name: "Swap",
    active: true,
    disabled: false,
    description: "",
    labels: [],
  },
  {
    id: 2,
    name: "Trade",
    active: true,
    disabled: false,
    description: "",
    labels: [],
  },
  {
    id: 3,
    name: "Lend",
    active: false,
    disabled: true,
    description: "Coming Soon",
    labels: [],
  },
];

export type Integrations = (typeof integrations)[number];
