"use client";

import { AnchorProvider } from "@coral-xyz/anchor";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { atomWithStorage } from "jotai/utils";

import type { FundModel } from "../models";
import { GlamClient } from "../client";
import { useAtomValue, useSetAtom } from "jotai/react";
import { PublicKey } from "@solana/web3.js";

interface TokenListItem {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}

interface GlamProviderContext {
  glamClient: GlamClient;
  wallet?: PublicKey;
  activeFund?: FundCache;
  fund?: PublicKey;
  treasury?: FundCacheTreasury;
  fundsList: FundCache[];
  allFunds: FundModel[];
  walletBalances: any;
  refresh?: () => void;
  setActiveFund: any;
  tokenList?: TokenListItem[];
}

interface TokenAccount {
  address: string;
  mint: string;
  decimals: number;
  amount: string;
  uiAmount: string;
}

interface FundCacheTreasury {
  address: PublicKey;
  balanceLamports: number;
  tokenAccounts: TokenAccount[];
}

interface FundCache {
  fund: PublicKey;
  imageKey: string;
  addressStr: string;
  name: string;
  treasury: FundCacheTreasury;
}

const GlamContext = createContext<GlamProviderContext>(
  {} as GlamProviderContext
);

const fundAtom = atomWithStorage<FundCache>("active-fund", {} as FundCache);
const fundsListAtom = atomWithStorage<FundCache[]>(
  "funds-list",
  [] as FundCache[]
);

const GLAM_API = process.env.NEXT_PUBLIC_GLAM_API || "https://api.glam.systems";

// Whether from API or localstore, funds are not deser properly...
// we need to convert string -> pubkey (and maybe more in future)
const deserializeFundCache = (f: any) => {
  if (!f) {
    return undefined;
  }
  if (typeof f.fund === "string") {
    f.addressStr = f.fund;
    f.fund = new PublicKey(f.fund);
  }
  return f as FundCache;
};

export function GlamProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const setActiveFund = useSetAtom(fundAtom);
  const setFundsList = useSetAtom(fundsListAtom);
  const wallet = useWallet();
  const { connection } = useConnection();
  const glamClient = useMemo(
    () =>
      new GlamClient({
        provider: new AnchorProvider(connection, wallet as AnchorWallet, {
          commitment: "confirmed",
        }),
      }),
    [connection, wallet]
  );
  const [allFunds, setAllFunds] = useState([] as FundModel[]);
  const [tokenList, setTokenList] = useState([] as TokenListItem[]);

  // fetch fundsList (manager and delegated)
  const { data } = useQuery({
    // using wallet?.publicKey in queryKey will auto-refresh when wallet changes
    queryKey: ["/funds?subject=" + wallet?.publicKey || ""],
    enabled: !!wallet.publicKey,
    queryFn: () =>
      fetch(
        `${GLAM_API}/funds?subject=${(
          wallet.publicKey || new PublicKey(0)
        ).toBase58()}`
      ).then((res) => res.json()),
  });
  useEffect(() => {
    if (data) {
      if (process.env.NODE_ENV === "development") {
        console.log(`${GLAM_API} returned funds: ${JSON.stringify(data)}`);
      }
      if (data.length > 0 && data[0].fund) {
        // sort funds, otherwise the list randomly changes
        const fundsList = data
          .sort((a: any, b: any) => (a.name < b.name ? -1 : 1))
          .map((f: any) => deserializeFundCache(f));
        setFundsList(fundsList);
        // if active fund is in list, update it with the latest data from api
        // otherwise set the first element as active fund
        const idxActiveFund = fundsList
          .map((f: any) => f.addressStr)
          .indexOf(activeFund?.addressStr);
        const idx = idxActiveFund < 0 ? 0 : idxActiveFund;
        setActiveFund(fundsList[idx] as FundCache);
      } else {
        setFundsList([] as FundCache[]);
        setActiveFund({} as FundCache);
      }
    }
  }, [data]);

  let activeFund = deserializeFundCache(useAtomValue(fundAtom)) as FundCache;
  if (activeFund && typeof activeFund.fund === "string") {
    activeFund.fund = new PublicKey(activeFund.fund);
  }
  let fundsList = useAtomValue(fundsListAtom) || [];
  fundsList.forEach((f) => deserializeFundCache(f));

  // all funds
  const { data: allFundsData } = useQuery({
    queryKey: ["/funds"],
    queryFn: () => glamClient.fetchAllFunds(),
  });
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("All funds:", allFundsData);
    }
    setAllFunds(
      (allFundsData || []).sort((a: any, b: any) => {
        if (a.fundLaunchDate > b.fundLaunchDate) {
          return -1;
        } else if (a.fundLaunchDate < b.fundLaunchDate) {
          return 1;
        } else if (a.name < b.name) {
          return -1;
        } else if (a.name > b.name) {
          return 1;
        }
        return 0;
      })
    );
  }, [allFundsData]);

  const { data: walletBalances } = useQuery({
    queryKey: ["balances", wallet?.publicKey],
    enabled: !!wallet?.publicKey,
    queryFn: async () => {
      const balanceLamports = await glamClient.provider.connection.getBalance(
        wallet?.publicKey || new PublicKey(0)
      );
      const tokenAccounts = await glamClient.listTokenAccounts(
        wallet?.publicKey || new PublicKey(0)
      );

      return {
        balanceLamports,
        tokenAccounts,
      };
    },
  });

  // token list from jupiter api
  const { data: tokens } = useQuery({
    queryKey: ["jupiter-api"],
    queryFn: () =>
      fetch("https://tokens.jup.ag/tokens?tags=strict").then((res) =>
        res.json()
      ),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
  const _tokenList = useMemo(
    () =>
      tokens?.map((t: any) => ({
        address: t.address,
        name: t.name,
        symbol: t.symbol,
        decimals: t.decimals,
        logoURI: t.logoURI,
      })) || [],
    [tokens]
  );
  useEffect(() => {
    if (tokens) {
      setTokenList(_tokenList);
    }
  }, [tokens, _tokenList]);

  const value: GlamProviderContext = {
    glamClient,
    wallet: (wallet && wallet.publicKey) || undefined,
    activeFund,
    fund: activeFund?.fund,
    treasury: (useAtomValue(fundAtom) as FundCache)?.treasury,
    fundsList: useAtomValue(fundsListAtom),
    allFunds,
    walletBalances,
    tokenList,
    setActiveFund,
  };

  return <GlamContext.Provider value={value}>{children}</GlamContext.Provider>;
}

export const useGlam = () => useContext(GlamContext);
