/**
 * Fetch price data from benchmarks.pyth.network
 * Rate limit: https://docs.pyth.network/benchmarks/rate-limits
 */
export const priceHistory = async (symbol) => {
  const emptyResult = { timestamps: null, closingPrices: null };
  if (
    ![
      "Crypto.ETH/USD",
      "Crypto.BTC/USD",
      "Crypto.SOL/USD",
      "Crypto.USDC/USD"
    ].includes(symbol)
  ) {
    console.error("Invalid symbol", symbol);
    return emptyResult;
  }
  const tsEnd = Math.floor(Date.now() / 1000);
  const tsStart = tsEnd - 60 * 60 * 24 * 30; // 30 days ago

  const queryParams = [
    ["symbol", symbol],
    ["resolution", "1D"],
    ["from", tsStart],
    ["to", tsEnd]
  ];
  const baseUrl =
    "https://benchmarks.pyth.network/v1/shims/tradingview/history";
  const queryString = new URLSearchParams(queryParams).toString();
  const urlWithQuery = `${baseUrl}?${queryString}`;
  const response = await fetch(urlWithQuery, {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  if (response.status === 200) {
    // {"s":"ok","t":[...],"o":[...],"h":[...],"l":[...],"c":[...],"v":[...]}
    // https://www.tradingview.com/rest-api-spec/#operation/getHistory
    const { t: timestamps, c: closingPrices } = await response.json();
    return { timestamps, closingPrices };
  }
  return emptyResult;
};

/**
 * Percent change in the last X days
 */
export const fundPerformance = (
  btcWeight,
  btcPrices,
  ethWeight,
  ethPrices,
  solWeight,
  solPrices
) => {
  if (
    btcPrices.length === 0 ||
    ethPrices.length === 0 ||
    solPrices.length === 0
  ) {
    throw new Error("No price data");
  }
  if (
    btcPrices.length !== ethPrices.length ||
    btcPrices.length !== solPrices.length
  ) {
    throw new Error("Price data mismatch");
  }

  const btcChanges = btcPrices.map((p) => p / btcPrices[0] - 1);
  const ethChanges = ethPrices.map((p) => p / ethPrices[0] - 1);
  const solChanges = solPrices.map((p) => p / solPrices[0] - 1);

  const weightedChanges = btcChanges.map((btcChange, i) => {
    return (
      btcWeight * btcChange +
      ethWeight * ethChanges[i] +
      solWeight * solChanges[i]
    );
  });

  return { weightedChanges, btcChanges, ethChanges, solChanges };
};

module.exports = { priceHistory, fundPerformance };
