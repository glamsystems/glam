import fs from "fs";
import * as anchor from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { ClusterNetwork, GlamClient } from "@glam/anchor";

export const getGlamClient = () => {
  return new GlamClient();
};

export const setFundToConfig = (fund, path) => {
  const config = fs.readFileSync(path, "utf8");
  const updatedConfig = { ...JSON.parse(config), fund };
  fs.writeFileSync(path, JSON.stringify(updatedConfig, null, 2), "utf8");
};
