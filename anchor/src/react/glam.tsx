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

import { GlamClient } from "../client";
import { useAtomValue, useSetAtom } from "jotai/react";
import { PublicKey } from "@solana/web3.js";

// TODO: implement a fund selector which calls setFund to set the active fund
interface GlamProviderContext {
  glamClient: GlamClient;
  wallet?: PublicKey;
  fund?: PublicKey;
  setFund?: (fund: string) => void;
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
      // When wallet is not connected, use a dummy public key so the fetch request returns empty data
      fetch(
        `https://api.glam.systems/funds?subject=${(
          wallet.publicKey || new PublicKey(0)
        ).toBase58()}`
      ).then((res) => res.json()),
    staleTime: 1000 * 60 * 5,
    enabled: !!wallet.publicKey,
  });
  // If data is an empty array, set the fund to an empty string
  if (data) {
    if (data.length > 0 && data[0].fund) {
      setFund(data[0].fund);
    } else if (data.length === 0) {
      setFund("");
    }
  }

  const { connection } = useConnection();
  const provider = new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: "confirmed",
  });

  const fundAddress = useAtomValue(fundAtom);
  const value: GlamProviderContext = {
    glamClient: new GlamClient({ provider, cluster: "mainnet-beta" }),
    wallet: (wallet && wallet.publicKey) || undefined,
    fund: (fundAddress && new PublicKey(fundAddress)) || undefined,
    setFund,
  };

  return <GlamContext.Provider value={value}>{children}</GlamContext.Provider>;
}

export const useGlam = () => useContext(GlamContext);
