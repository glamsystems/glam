"use client";

import { AnchorProvider } from "@coral-xyz/anchor";

import { createContext, useContext } from "react";
import {
  AnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { atomWithStorage } from "jotai/utils";

import { GlamClient } from "./client";
import { useAtomValue, useSetAtom } from "jotai/react";

// TODO: implement a fund selector which calls setFund to set the active fund
interface GlamProviderContext {
  glamClient: GlamClient;
  fund: string;
  setFund: (fund: string) => void;
}

const GlamContext = createContext<GlamProviderContext>(
  {} as GlamProviderContext
);

const fundAtom = atomWithStorage<string>("active-fund", "");

export function GlamProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const setFund = useSetAtom(fundAtom);
  const wallet = useWallet();

  const { data } = useQuery({
    queryKey: ["fund"],
    queryFn: () =>
      fetch(`https://api.glam.systems/funds?subject=${wallet.publicKey}`).then(
        (res) => res.json()
      ),
  });
  if (data && data.length > 0 && data[0].fund) {
    setFund(data[0].fund);
  }

  const { connection } = useConnection();
  const provider = new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: "confirmed",
  });

  const value: GlamProviderContext = {
    glamClient: new GlamClient({ provider, cluster: "mainnet-beta" }),
    fund: useAtomValue(fundAtom),
    setFund,
  };

  return <GlamContext.Provider value={value}>{children}</GlamContext.Provider>;
}

export const useGlam = () => useContext(GlamContext);
