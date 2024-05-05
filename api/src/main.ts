/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from "express";
import * as path from "path";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";

import { GlamClient } from "@glam/anchor";
import { validatePubkey } from "./validation";

const BASE_URL = "https://api.glam.systems";
const SOLANA_RPC = process.env.SOLANA_RPC || "http://localhost:8899";

const app = express();

const connection = new Connection(SOLANA_RPC, "confirmed");
const provider = new AnchorProvider(connection, null, {
  commitment: "confirmed"
});
const client = new GlamClient({ provider });

app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/", (req, res) => {
  res.send({ message: "Welcome to Glam!" });
});

app.get("/_/health", (req, res) => {
  res.send("ok");
});

app.get("/openfund/:pubkey", async (req, res) => {
  const key = validatePubkey(req.params.pubkey);
  if (!key) {
    return res.sendStatus(404);
  }

  let fund;
  try {
    fund = await client.fetchFund(key);
  } catch (e) {
    console.log(e);
    return res.sendStatus(404);
  }
  res.send(JSON.stringify(fund));

  // TODO: Fetch name and symbol from blockchain

  // const imageUri = `${BASE_URL}/image/${req.params.pubkey}.png`;
  // res.set("content-type", "application/json");
  // res.send(
  //   JSON.stringify({
  //     name: "name_placeholder",
  //     symbol: "symbol_placeholder",
  //     description: "",
  //     external_url: "https://glam.systems",
  //     image: imageUri
  //   })
  // );
});

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on("error", console.error);
