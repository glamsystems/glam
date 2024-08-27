"use client";

import { AnchorProvider } from "@coral-xyz/anchor";

import { createContext, useContext, useEffect, useState } from "react";
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
  treasury?: FundTreasury;
  refresh?: () => void;
}

interface TokenAccount {
  address: string;
  mint: string;
  decimals: number;
  amount: string;
  uiAmount: string;
}

interface FundTreasury {
  address: string;
  balanceLamports: number;
  tokenAccounts: TokenAccount[];
}

const GlamContext = createContext<GlamProviderContext>(
  {} as GlamProviderContext
);

const fundAtom = atomWithStorage<string>("active-fund", "");
const treasuryAtom = atomWithStorage<FundTreasury>(
  "active-fund-treasury",
  {} as FundTreasury
);

const GLAM_API = process.env.NEXT_PUBLIC_GLAM_API || "https://api.glam.systems";

export function GlamProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const setFund = useSetAtom(fundAtom);
  const setTreasury = useSetAtom(treasuryAtom);

  const wallet = useWallet();

  const { data } = useQuery({
    queryKey: ["fund"],
    queryFn: () =>
      // When wallet is not connected, use a dummy public key so the fetch request returns empty data
      fetch(
        `${GLAM_API}/funds?subject=${(
          wallet.publicKey || new PublicKey(0)
        ).toBase58()}`
      ).then((res) => res.json()),
    enabled: !!wallet.publicKey,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // 10 seconds
  });

  useEffect(() => {
    if (data) {
      if (process.env.NODE_ENV === "development") {
        console.log(`${GLAM_API} returned funds: ${JSON.stringify(data)}`);
      }
      if (data.length > 0 && data[0].fund) {
        setFund(data[0].fund);
        setTreasury(data[0].treasury as FundTreasury);
      } else if (data.length === 0) {
        setFund("");
        setTreasury({} as FundTreasury);
      }
    }
  }, [data, setFund]);

  const { connection } = useConnection();
  const provider = new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: "confirmed",
  });

  const fundAddress = useAtomValue(fundAtom);
  const value: GlamProviderContext = {
    glamClient: new GlamClient({ provider, cluster: "mainnet-beta" }),
    wallet: (wallet && wallet.publicKey) || undefined,
    fund: (fundAddress && new PublicKey(fundAddress)) || undefined,
    treasury: useAtomValue(treasuryAtom),
  };

  return <GlamContext.Provider value={value}>{children}</GlamContext.Provider>;
}

export const useGlam = () => useContext(GlamContext);
