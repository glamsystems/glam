export const formatPercent = (value: number) => {
  return value > 0 ? `${(value).toFixed(3)}%` : "0";
};

export const formatNumber = (value: number) => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: "USD",
    currencyDisplay: "symbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};
