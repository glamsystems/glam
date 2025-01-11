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

import type { StateModel } from "../models";
import { GlamClient } from "../client";
import { useAtomValue, useSetAtom } from "jotai/react";
import { PublicKey } from "@solana/web3.js";
import { WSOL } from "../constants";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { DriftMarketConfigs, GlamDriftUser } from "../client/drift";
import { TokenAccount } from "../client/base";
import { useCluster } from "./cluster-provider";

export interface JupTokenListItem {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags: string[];
}

interface TokenPrice {
  mint: string;
  price: number; // USD
}

interface GlamProviderContext {
  glamClient: GlamClient;
  activeFund?: FundCache;
  treasury?: Treasury;
  fundsList: FundCache[];
  allFunds: StateModel[];
  userWallet: UserWallet;
  prices: TokenPrice[];
  setActiveFund: (f: FundCache) => void;
  jupTokenList?: JupTokenListItem[];
  driftMarketConfigs: DriftMarketConfigs;
  driftUser: GlamDriftUser;
  refresh: () => Promise<void>;
}

interface UserWallet {
  queryKey: string[];
  pubkey?: PublicKey; // if pubkey is null, wallet is not connected
  balanceLamports: number;
  tokenAccounts: TokenAccount[];
}

interface Treasury {
  pubkey: PublicKey;
  balanceLamports: number; // TODO: this should be a BN or string, it works until ~9M SOL
  tokenAccounts: TokenAccount[];
}

interface FundCache {
  address: string;
  pubkey: PublicKey;
  sparkleKey: string;
  name: string;
  product: "Mint" | "Vault" | "Fund";
}

const GlamContext = createContext<GlamProviderContext>(
  {} as GlamProviderContext,
);

const fundAtom = atomWithStorage<FundCache>("active-fund", {} as FundCache);
const fundsListAtom = atomWithStorage<FundCache[]>(
  "funds-list",
  [] as FundCache[],
);

// In order to properly deser funds, we need to
// convert string -> pubkey (and maybe more in future)
const deserializeFundCache = (f: any) => {
  if (!f) {
    return undefined;
  }
  if (typeof f.pubkey === "string") {
    f.address = f.pubkey;
    f.pubkey = new PublicKey(f.pubkey);
  }
  return f as FundCache;
};

const toFundCache = (f: StateModel) => {
  return {
    pubkey: f.id,
    sparkleKey: f.sparkleKey,
    address: f.idStr,
    name: f.name,
    product: f.productType,
  } as FundCache;
};

const fetchBalances = async (glamClient: GlamClient, owner: PublicKey) => {
  const balanceLamports =
    await glamClient.provider.connection.getBalance(owner);
  const tokenAccounts = await glamClient.getTokenAccountsByOwner(owner);

  // Add wSOL account if it doesn't exist, so that we can properly combine SOL and wSOL balances
  // FIXME: this leads to a bug on holdings page that the wSOL ata has balance 0 but cannot be closed
  if (!tokenAccounts.find((ta) => ta.mint.equals(WSOL))) {
    tokenAccounts.push({
      owner,
      mint: WSOL,
      programId: TOKEN_PROGRAM_ID,
      pubkey: getAssociatedTokenAddressSync(WSOL, owner, true),
      amount: "0",
      uiAmount: 0,
      decimals: 9,
      frozen: false,
    });
  }

  return {
    balanceLamports,
    tokenAccounts,
  };
};

export function GlamProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const setActiveFund = useSetAtom(fundAtom);
  const setFundsList = useSetAtom(fundsListAtom);

  const [treasury, setTreasury] = useState({} as Treasury);
  const [userWallet, setUserWallet] = useState({} as UserWallet);
  const wallet = useWallet();
  const { connection } = useConnection();
  const { cluster } = useCluster();

  const glamClient = useMemo(
    () =>
      new GlamClient({
        provider: new AnchorProvider(connection, wallet as AnchorWallet, {
          commitment: "confirmed",
        }),
        cluster: cluster.network,
      }),
    [connection, wallet, cluster],
  );
  const [allFunds, setAllFunds] = useState([] as StateModel[]);
  const [jupTokenList, setJupTokenList] = useState([] as JupTokenListItem[]);
  const [tokenPrices, setTokenPrices] = useState([] as TokenPrice[]);
  const [driftMarketConfigs, setDriftMarketConfigs] = useState(
    {} as DriftMarketConfigs,
  );
  const [driftUser, setDriftUser] = useState({} as GlamDriftUser);

  const activeFund = deserializeFundCache(useAtomValue(fundAtom)) as FundCache;

  //
  // Fetch all funds
  //
  const refreshTreasury = async () => {
    if (activeFund?.pubkey && wallet?.publicKey) {
      console.log(
        "fetching treasury data for fund",
        activeFund.pubkey.toBase58(),
      );
      const treasury = glamClient.getVaultPda(activeFund.pubkey);
      const balances = await fetchBalances(glamClient, treasury);
      setTreasury({
        ...balances,
        pubkey: treasury,
      } as Treasury);
    }
  };

  const { data: allFundsData } = useQuery({
    queryKey: ["/funds", activeFund?.pubkey],
    queryFn: () => glamClient.fetchAllFunds(),
  });
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("All funds:", allFundsData);
    }
    const fundModels = (allFundsData || []).sort(
      (a: StateModel, b: StateModel) => {
        if (!a.rawOpenfunds?.fundLaunchDate) {
          return 1;
        }
        if (!b.rawOpenfunds?.fundLaunchDate) {
          return -1;
        }
        if (a.rawOpenfunds?.fundLaunchDate > b.rawOpenfunds?.fundLaunchDate) {
          return -1;
        } else if (
          a.rawOpenfunds?.fundLaunchDate < b.rawOpenfunds?.fundLaunchDate
        ) {
          return 1;
        }
        return 0;
      },
    );
    setAllFunds(fundModels);

    const fundList = [] as FundCache[];
    fundModels.forEach((f: StateModel) => {
      if (wallet?.publicKey?.equals(f.owner!.pubkey!)) {
        const fundCache = toFundCache(f);
        fundList.push(fundCache);
      } else {
        // Iterate over delegateAcls to find funds that the wallet has access to
        f.delegateAcls.forEach((acl: any) => {
          if (wallet?.publicKey?.equals(acl.pubkey)) {
            fundList.push(toFundCache(f));
          }
        });
      }
    });
    if (fundList.length > 0) {
      setFundsList(fundList);
      if (
        !activeFund ||
        !fundList.find(
          (f) =>
            f.pubkey && activeFund.pubkey && f.pubkey.equals(activeFund.pubkey),
        )
      ) {
        setActiveFund(fundList[0]);
      }
    }

    refreshTreasury();
  }, [allFundsData, activeFund, wallet, cluster]);

  //
  // Fetch token prices https://station.jup.ag/docs/apis/price-api-v2
  //
  const { data: jupTokenPricesData } = useQuery({
    queryKey: ["/jup-token-prices", treasury?.pubkey],
    enabled: cluster.network === "mainnet-beta",
    refetchInterval: 10_000,
    queryFn: () => {
      const tokenMints = new Set([] as string[]);

      tokenMints.add(WSOL.toBase58()); // Always add wSOL feed so that we can price SOL

      // Token accounts owned by the treasury
      (treasury.tokenAccounts || []).forEach((ta: TokenAccount) => {
        tokenMints.add(ta.mint.toBase58());
      });

      // Drift spot positions
      (driftUser.spotPositions || []).forEach((position) => {
        const marketConfig = driftMarketConfigs.spot.find(
          (m) => position.marketIndex === m.marketIndex,
        );
        if (marketConfig) {
          tokenMints.add(marketConfig.mint);
        }
      });

      const param = Array.from(tokenMints).join(",");
      return fetch(`https://api.jup.ag/price/v2?ids=${param}`).then((res) =>
        res.json(),
      );
    },
  });
  useEffect(() => {
    if (jupTokenPricesData) {
      const prices = Object.values(jupTokenPricesData.data).map(
        (p: any) =>
          ({
            mint: p.id,
            price: Number(p.price),
          }) as TokenPrice,
      );

      setTokenPrices(prices);
    }
  }, [jupTokenPricesData]);

  //
  // Balance and token accounts of the connected wallet
  //
  const walletBalancesQueryKey = ["balances", wallet?.publicKey];
  const { data: walletBalances } = useQuery({
    queryKey: walletBalancesQueryKey,
    enabled: !!wallet?.publicKey,
    queryFn: () => fetchBalances(glamClient, wallet?.publicKey!),
  });
  useEffect(() => {
    setUserWallet({
      queryKey: walletBalancesQueryKey,
      pubkey: wallet.publicKey,
      ...walletBalances,
    } as UserWallet);
  }, [walletBalances, wallet]);

  //
  // Fetch token list from jupiter api
  //
  const { data: tokenList } = useQuery({
    queryKey: ["jupiter-tokens-list"],
    queryFn: async () => {
      const response = await fetch(
        "https://tokens.jup.ag/tokens?tags=verified",
      );
      const data = await response.json();
      const tokenList = data?.map((t: any) => ({
        address: t.address,
        name: t.name,
        symbol: t.symbol,
        decimals: t.decimals,
        logoURI: t.logoURI,
        tags: t.tags,
      }));
      return tokenList;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
  useEffect(() => setJupTokenList(tokenList), [tokenList]);

  //
  // Fetch drift market configs
  //
  const { data: marketConfigs } = useQuery({
    queryKey: ["drift-market-configs"],
    enabled: cluster.network === "mainnet-beta",
    queryFn: async () => {
      const response = await fetch(
        "https://api.glam.systems/v0/drift/market_configs/",
      );
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
  useEffect(() => setDriftMarketConfigs(marketConfigs), [marketConfigs]);

  //
  // Fetch drift positions
  //
  const { data: driftUserData } = useQuery({
    queryKey: ["/drift-positions", treasury?.pubkey],
    enabled: !!treasury,
    refetchInterval: 30 * 1000,
    queryFn: () => {
      return fetch(
        `https://api.glam.systems/v0/drift/user?authority=${treasury?.pubkey.toBase58()}&accountId=0`,
      ).then((res) => res.json());
    },
  });
  useEffect(() => {
    setDriftUser(driftUserData || {});
  }, [driftUserData, activeFund]);

  const value: GlamProviderContext = {
    glamClient,
    activeFund,
    treasury,
    fundsList: useAtomValue(fundsListAtom),
    allFunds, // TODO: only keep one of allFunds or fundsList
    userWallet,
    jupTokenList,
    prices: tokenPrices,
    setActiveFund,
    driftMarketConfigs,
    driftUser,
    refresh: async () => {
      refreshTreasury();
    },
  };

  return <GlamContext.Provider value={value}>{children}</GlamContext.Provider>;
}

export const useGlam = () => useContext(GlamContext);
