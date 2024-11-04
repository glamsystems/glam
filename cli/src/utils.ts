import fs from "fs";
import * as anchor from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { GlamClient } from "@glam/anchor";

export const getGlamClient = () => {
  const defaultProvider = anchor.AnchorProvider.env();
  const url = defaultProvider.connection.rpcEndpoint;
  const connection = new Connection(url, {
    commitment: "confirmed",
  });
  const provider = new anchor.AnchorProvider(
    connection,
    defaultProvider.wallet,
    {
      ...defaultProvider.opts,
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    }
  );
  anchor.setProvider(provider);

  return new GlamClient({
    provider,
    cluster: "mainnet-beta",
  });
};

export const setFundToConfig = (fund, path) => {
  const config = fs.readFileSync(path, "utf8");
  const updatedConfig = { ...JSON.parse(config), fund };
  fs.writeFileSync(path, JSON.stringify(updatedConfig, null, 2), "utf8");
};
