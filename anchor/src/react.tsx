"use client";

import { Connection } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";

import { createContext, useContext } from "react";
import {
  AnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";

import { GlamClient } from "./client";

const provider = new AnchorProvider(
  new Connection("https://api.devnet.solana.com", "confirmed"),
  //@ts-ignore
  null,
  {}
);
const glamClient = new GlamClient({ provider });
const GlamContext = createContext(glamClient);

export function GlamProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const provider = new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: "confirmed",
  });
  return (
    <GlamContext.Provider value={new GlamClient({ provider })}>
      {children}
    </GlamContext.Provider>
  );
}

export const useGlamClient = () => useContext(GlamContext);
