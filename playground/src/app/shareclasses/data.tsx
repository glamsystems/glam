export const shareClasses = [
  {
    id: 0,
    name: "Share Class 1",
    active: true,
    description: "",
    labels: ["Accumulating"],
  },
];

export type ShareClasses = (typeof shareClasses)[number];
