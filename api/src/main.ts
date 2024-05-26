import express, { Express, Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import * as path from "path";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";

import { createCanvas, loadImage } from "canvas";
import {
  PythHttpClient,
  PythCluster,
  getPythClusterApiUrl,
  getPythProgramKeyForCluster
} from "@pythnetwork/client";

import { GlamClient } from "@glam/anchor";
import { validatePubkey } from "./validation";
import { priceHistory, fundPerformance } from "./prices";
import { openfunds } from "./openfunds";
import { marinadeDelayedUnstakeTx, marinadeDelayedUnstakeClaimTx } from "./tx";

const BASE_URL = "https://api.glam.systems";
const SOLANA_RPC = process.env.SOLANA_RPC || "http://localhost:8899";

const app: Express = express();
app.use(cors({ origin: "*", methods: "GET" }));
app.use(bodyParser.json());

const connection = new Connection(SOLANA_RPC, "confirmed");
const provider = new AnchorProvider(connection, null, {
  commitment: "confirmed"
});
const client = new GlamClient({ provider });

const PYTHNET_CLUSTER_NAME: PythCluster = "pythnet";
const pythClient = new PythHttpClient(
  new Connection(getPythClusterApiUrl(PYTHNET_CLUSTER_NAME)),
  getPythProgramKeyForCluster(PYTHNET_CLUSTER_NAME),
  "confirmed"
);

app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/api", (req: Request, res: Response) => {
  res.send({ message: "Welcome to Glam!" });
});

/*
 * Openfunds
 */

app.get("/openfunds", async (req, res) => {
  return openfunds(
    req.query.funds.split(","),
    req.query.template,
    req.query.format,
    client,
    res
  );
});

app.get("/openfunds/:pubkey.:ext", async (req, res) => {
  return openfunds([req.params.pubkey], "auto", req.params.ext, client, res);
});

app.get("/openfunds/:pubkey", async (req, res) => {
  return openfunds([req.params.pubkey], "auto", "json", client, res);
});

/*
 * Tx
 */

app.post("/tx/jupiter/swap", async (req, res) => {
  // TODO: implement
  return res.send("Not implemented");
});

app.post("/tx/marinade/unstake", async (req, res) => {
  return marinadeDelayedUnstakeTx(client, req, res);
});

app.post("/tx/marinade/unstake/claim", async (req, res) => {
  return marinadeDelayedUnstakeClaimTx(client, req, res);
});

/*
 * Other
 */

app.get("/prices", async (req, res) => {
  const data = await pythClient.getData();
  res.set("content-type", "application/json");
  res.send(
    JSON.stringify({
      btc: data.productPrice.get("Crypto.BTC/USD").price,
      eth: data.productPrice.get("Crypto.ETH/USD").price,
      sol: data.productPrice.get("Crypto.SOL/USD").price,
      usdc: data.productPrice.get("Crypto.USDC/USD").price
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
  const image = await loadImage(path.join(__dirname, "assets/glam.png"));
  ctx.drawImage(image, -offset, -offset, fullSize, fullSize);

  // return the image
  const buffer = canvas.toBuffer("image/png");
  res.set("content-type", "image/png");
  res.send(buffer);
});

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on("error", console.error);

export default server;
