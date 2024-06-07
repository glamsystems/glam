import express, { Express, Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { Connection } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import imageRouter from "./routers/image";
import txRouter from "./routers/tx";
import openfundsRouter from "./routers/openfunds";
import fundRouter from "./routers/fund";

import { GlamClient, JUPITER_API_DEFAULT } from "@glam/anchor";

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: ".env.local", override: true });
}

const BASE_URL = "https://api.glam.systems";
const SOLANA_RPC = process.env.SOLANA_RPC || "http://localhost:8899";
const SOLANA_MAINNET_KEY = process.env.SOLANA_MAINNET_KEY || "";
const FORCE_MAINNET = process.env.MAINNET === "1";
const JUPITER_API = process.env.JUPITER_API || JUPITER_API_DEFAULT;

/* GlamClient for devnet and testnet */

const mainnetConnection = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${SOLANA_MAINNET_KEY}`,
  "confirmed"
);
const mainnetProvider = new AnchorProvider(mainnetConnection, null, {
  commitment: "confirmed"
});
const mainnetClient = new GlamClient({
  cluster: "mainnet-beta",
  provider: mainnetProvider,
  jupiterApi: JUPITER_API
});

const devnetConnection = new Connection(SOLANA_RPC, "confirmed");
const devnetProvider = new AnchorProvider(devnetConnection, null, {
  commitment: "confirmed"
});
const devnetClient = FORCE_MAINNET
  ? mainnetClient
  : new GlamClient({ provider: devnetProvider });

/* Express app */

const app: Express = express();
app.use(cors({ origin: "*", methods: "GET" }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "assets")));
app.use((req, res, next) => {
  if (req.hostname === "api.glam.systems") {
    req.client = mainnetClient;
  } else {
    req.client = devnetClient;
  }
  next();
});

app.use(imageRouter);
// routers that need to use glam client must be registered after req.client is set
app.use(txRouter);
app.use(fundRouter);
app.use(openfundsRouter);

/*
 * Endpoints for dev ops
 */

app.get("/genesis", async (req: Request, res: Response) => {
  const genesis = await req.client.provider.connection.getGenesisHash();
  res.send({ genesis });
});

app.get("/version", async (req: Request, res: Response) => {
  res.send({ id: process.env.GAE_VERSION });
});

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Api ${process.env.NODE_ENV} at http://localhost:${port}`);
});
server.on("error", console.error);

export default server;
