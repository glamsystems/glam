const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const { validatePubkey } = require("./validation");
const { priceHistory, fundPerformance } = require("./prices");

BASE_URL = "https://api.glam.systems";

const app = express();
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send(`Hello from ${BASE_URL}!`);
});

app.get("/_/health", (req, res) => {
  res.send("ok");
});

app.get("/fund/:pubkey/perf", async (req, res) => {
  // TODO: validate input
  // TODO: Should we fetch weights from blockchain, or let client side pass them in?
  // Client side should have all fund info including assets and weights
  const [btcWeight, ethWeight] = [0.7, 0.3];
  console.log(`ethWeight: ${ethWeight}, btcWeight: ${btcWeight}`);
  const { timestamps, closingPrices: ethClosingPrices } = await priceHistory(
    "Crypto.ETH/USD"
  );
  const { closingPrices: btcClosingPrices } = await priceHistory(
    "Crypto.BTC/USD"
  );

  // console.log(
  //   `Last30dPrices (USD): ETH ${ethClosingPrices}, BTC ${btcClosingPrices}`
  // );

  const performance = fundPerformance(
    btcWeight,
    btcClosingPrices,
    ethWeight,
    ethClosingPrices
  );
  res.send(JSON.stringify({ timestamps, performance }));
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
