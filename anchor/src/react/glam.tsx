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

interface JupTokenListItem {
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
  //@ts-ignore
  allFunds: FundModel[];
  walletBalances: any;
  walletBalancesQueryKey: any[];
  refresh?: () => void;
  setActiveFund: any;
  jupTokenList?: JupTokenListItem[];
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

// In order to properly deser funds, we need to
// convert string -> pubkey (and maybe more in future)
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

const toFundCache = (f: FundModel) => {
  return {
    fund: f.id,
    imageKey: f.imageKey,
    addressStr: f.id.toBase58(),
    name: f.name,
    treasury: {},
  } as FundCache;
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
  const [jupTokenList, setJupTokenList] = useState([] as JupTokenListItem[]);

  const activeFund = deserializeFundCache(useAtomValue(fundAtom)) as FundCache;

  //
  // Fetch all funds
  //
  const { data: allFundsData } = useQuery({
    queryKey: ["/funds"],
    queryFn: () => glamClient.fetchAllFunds(),
  });
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("All funds:", allFundsData);
    }
    const fundModels = (allFundsData || []).sort(
      (a: FundModel, b: FundModel) => {
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
      }
    );
    setAllFunds(fundModels);

    const fundList = [] as FundCache[];
    fundModels.forEach((f: FundModel) => {
      if (wallet?.publicKey?.equals(f.manager)) {
        const fundCache = toFundCache(f);
        if (!activeFund) {
          setActiveFund(fundCache);
        }
        fundList.push(fundCache);
      } else {
        // Iterate over delegateAcls to find funds that the wallet has access to
        f.delegateAcls.forEach((acl: any) => {
          if (wallet?.publicKey?.equals(acl.pubkey)) {
            fundList.push(toFundCache(f));
          }
        });
      }
      setFundsList(fundList);
    });
  }, [allFundsData, activeFund, wallet]);

  //
  // Balance and token accounts of the connected wallet
  //
  const walletBalancesQueryKey = ["balances", wallet?.publicKey];
  const { data: walletBalances } = useQuery({
    queryKey: walletBalancesQueryKey,
    enabled: !!wallet?.publicKey,
    queryFn: async () => {
      console.log("fetching walletBalances");
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

  //
  // Fetch token list from jupiter api
  //
  const { data: tokens } = useQuery({
    queryKey: ["jupiter-api"],
    queryFn: () =>
      fetch("https://tokens.jup.ag/tokens?tags=verified").then((res) =>
        res.json()
      ),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  useEffect(() => {
    if (!tokens) {
      return;
    }
    const tokenList = tokens?.map((t: any) => ({
      address: t.address,
      name: t.name,
      symbol: t.symbol,
      decimals: t.decimals,
      logoURI: t.logoURI,
    }));
    setJupTokenList(tokenList);
  }, [tokens]);

  const value: GlamProviderContext = {
    glamClient,
    wallet: (wallet && wallet.publicKey) || undefined,
    activeFund,
    fund: activeFund?.fund,
    treasury: (useAtomValue(fundAtom) as FundCache)?.treasury,
    fundsList: useAtomValue(fundsListAtom),
    allFunds,
    walletBalances,
    walletBalancesQueryKey,
    jupTokenList: jupTokenList,
    setActiveFund,
  };

  return <GlamContext.Provider value={value}>{children}</GlamContext.Provider>;
}

export const useGlam = () => useContext(GlamContext);
