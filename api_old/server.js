const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const { validatePubkey } = require("./validation");
const { priceHistory, fundPerformance } = require("./prices");
const cors = require("cors");
const pyth = require("@pythnetwork/pyth-evm-js");

const BASE_URL = "https://api.glam.systems";
const SOLANA_RPC = process.env.SOLANA_RPC || "http://localhost:8899";

const app = express();
app.use(express.static("public"));
app.use(
  cors({
    origin: "*",
    methods: "GET"
  })
);

app.get("/", (req, res) => {
  res.send(`Hello from ${BASE_URL}!`);
});

app.get("/_/health", (req, res) => {
  res.send("ok");
});

app.get("/prices", async (req, res) => {
  const connection = new pyth.EvmPriceServiceConnection(
    "https://hermes.pyth.network"
  );
  // You can find the ids of prices at https://pyth.network/developers/price-feed-ids#pyth-evm-stable
  const priceIds = [
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", // BTC/USD price id
    "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // ETH/USD price id
    "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d", // SOL/USD price id
    "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a" // USDC/USD price id
  ];
  const priceFeeds = await connection.getLatestPriceFeeds(priceIds);
  res.set("content-type", "application/json");
  res.send(
    JSON.stringify({
      btc: parseFloat(priceFeeds[0].price.price) / 1e8,
      eth: parseFloat(priceFeeds[1].price.price) / 1e8,
      sol: parseFloat(priceFeeds[2].price.price) / 1e8,
      usdc: parseFloat(priceFeeds[3].price.price) / 1e8
    })
  );
});

app.get("/fund/:pubkey/perf", async (req, res) => {
  const { w_btc = 0.4, w_eth = 0, w_sol = 0.6 } = req.query;
  // TODO: validate input
  // TODO: Should we fetch weights from blockchain, or let client side pass them in?
  // Client side should have all fund info including assets and weights
  console.log(`btcWeight: ${w_btc}, ethWeight: ${w_eth}, solWeight: ${w_sol}`);
  const { timestamps, closingPrices: ethClosingPrices } = await priceHistory(
    "Crypto.ETH/USD"
  );
  const { closingPrices: btcClosingPrices } = await priceHistory(
    "Crypto.BTC/USD"
  );
  const { closingPrices: solClosingPrices } = await priceHistory(
    "Crypto.SOL/USD"
  );
  // const { closingPrices: usdcClosingPrices } = await priceHistory(
  //   "Crypto.USDC/USD"
  // );

  const { weightedChanges, btcChanges, ethChanges, solChanges } =
    fundPerformance(
      w_btc,
      btcClosingPrices,
      w_eth,
      ethClosingPrices,
      w_sol,
      solClosingPrices
    );
  res.set("content-type", "application/json");
  res.send(
    JSON.stringify({
      timestamps,
      // usdcClosingPrices,
      fundPerformance: weightedChanges,
      btcPerformance: btcChanges,
      ethPerformance: ethChanges,
      solPerformance: solChanges
    })
  );
});

app.get("/metadata/:pubkey", async (req, res) => {
  const key = validatePubkey(req.params.pubkey);
  if (!key) {
    return res.sendStatus(404);
  }

  // TODO: Fetch name and symbol from blockchain

  const imageUri = `${BASE_URL}/image/${req.params.pubkey}.png`;
  res.set("content-type", "application/json");
  res.send(
    JSON.stringify({
      name: "name_placeholder",
      symbol: "symbol_placeholder",
      description: "",
      external_url: "https://glam.systems",
      image: imageUri
    })
  );
});

app.get("/image/:pubkey.png", async (req, res) => {
  // convert pubkey from base58 to bytes[32]
  const key = validatePubkey(req.params.pubkey);
  if (!key) {
    return res.sendStatus(404);
  }

  // fetch params from the key bytes
  const angle = 6.28 * (key[0] / 256.0); // between 0.0 and 2*pi
  const alpha = key[1] / 256.0 / 4 + 0.75; // between 0.5 and 1.0
  const colorR = key[2]; // between 0 and 255
  const colorG = key[3];
  const colorB = key[4];

  const fullSize = 512; // size of the input
  const size = fullSize / 2; // size of the output
  const offset = size / 2; // offset for rotation/translation

  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  // canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // base color
  ctx.fillStyle = rgbToHex(colorR, colorG, colorB);
  ctx.fillRect(0, 0, size, size);

  // rotation (relative to image center)
  ctx.translate(offset, offset);
  ctx.rotate(angle);
  ctx.translate(-offset, -offset);

  // render the image full size, on half size canvas
  // so that we don't see broken corners
  ctx.globalAlpha = alpha;
  const image = await loadImage("./public/glam.png");
  ctx.drawImage(image, -offset, -offset, fullSize, fullSize);

  // return the image
  const buffer = canvas.toBuffer("image/png");
  res.set("content-type", "image/png");
  res.send(buffer);
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
const host = process.env.NODE_ENV ? "" : "http://localhost";
const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${host}:${PORT}...`);
});

module.exports = server;
