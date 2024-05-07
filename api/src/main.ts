/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from "express";
import * as ExcelJS from "exceljs";
import * as path from "path";
import * as util from "util";
import { write, writeToBuffer } from "@fast-csv/format";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";

import { GlamClient } from "@glam/anchor";
import { validatePubkey } from "./validation";
import { openfunds } from "./openfunds";

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

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on("error", console.error);
