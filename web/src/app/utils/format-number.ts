export const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`;
};

export const formatNumber = (value: number) => {
  return value.toLocaleString('en-US');
};
