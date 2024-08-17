export const shareClasses = [
  {
    id: "1",
    name: "Share Class 1",
    active: true,
    description: "",
    labels: ["USD","Accumulating"]
  },
  {
    id: "2",
    name: "Share Class 2",
    active: true,
    description: "",
    labels: ["USD", "Distributing"]
  },
  {
    id: "3",
    name: "Share Class 3",
    active: false ,
    description: "",
    labels: ["SOL","Distributing", "Projected"]
  },
]

export type ShareClasses = (typeof shareClasses)[number]
