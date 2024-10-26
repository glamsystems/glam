import express, { Express, Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { Connection } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import imageRouter from "./routers/image";
import openfundsRouter from "./routers/openfunds";
import miscRouter from "./routers/misc";
import shareClassRouter from "./routers/shareclass";

import { GlamClient, JUPITER_API_DEFAULT } from "@glam/anchor";

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: ".env.local", override: true });
}

const SOLANA_RPC = process.env.SOLANA_RPC || "http://localhost:8899";
const SOLANA_CLUSTER = (process.env.SOLANA_CLUSTER || "custom") as any;
const JUPITER_API = process.env.JUPITER_API || JUPITER_API_DEFAULT;

/* GlamClient setup */

// Default client is configured by environment variables
const defaultClient = new GlamClient({
  cluster: SOLANA_CLUSTER,
  provider: new AnchorProvider(
    new Connection(SOLANA_RPC, "confirmed"),
    null,
    {}
  ),
  jupiterApi: JUPITER_API,
});

const devnetClient = new GlamClient({
  cluster: "devnet",
  provider: new AnchorProvider(
    new Connection("https://api.devnet.solana.com", "confirmed"),
    null,
    {}
  ),
});

/* Express app */

const app: Express = express();
app.use(cors({ origin: "*", methods: "GET" }));
app.use(bodyParser.json({ type: () => true })); // parse all reqs as json
app.use(express.static(path.join(__dirname, "assets")));
app.use((req, res, next) => {
  req.client = defaultClient;
  // Use devnet client if running on GAE and not on api.glam.systems
  if (process.env.GAE_SERVICE && req.hostname !== "api.glam.systems") {
    req.client = devnetClient;
  }
  if (process.env.NODE_ENV === "development") {
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  }
  next();
});

app.use(miscRouter);
app.use(imageRouter);

// routers that need to use glam client must be registered after req.client is set
app.use(openfundsRouter);
app.use(shareClassRouter);

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Api ${process.env.NODE_ENV} at http://localhost:${port}`);
});
server.on("error", console.error);

export default server;
