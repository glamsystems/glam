export const products = [
  {
    id: "1",
    name: "SpaciousSchnorrSafe",
    active: true,
    description: "",
    labels: ["trading","derivatives"]
  },
  {
    id: "2",
    name: "YummyTestVehicle",
    active: false,
    description: "",
    labels: ["staking"]
  },
  {
    id: "3",
    name: "TopGammaBag",
    active: true,
    description: "",
    labels: ["swap","spot"]
  },
]

export type Products = (typeof products)[number]
