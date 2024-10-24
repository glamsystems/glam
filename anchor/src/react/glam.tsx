"use client";

import { AnchorProvider } from "@coral-xyz/anchor";

import {
  act,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import { ASSETS_MAINNET } from "../client/assets";
import { WSOL } from "../constants";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

interface JupTokenListItem {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}

interface PythPrice {
  mint: string;
  price: number; // USD
}

interface GlamProviderContext {
  glamClient: GlamClient;
  wallet?: PublicKey;
  activeFund?: FundCache;
  fund?: PublicKey;
  treasury?: TreasuryCache;
  fundsList: FundCache[];
  //@ts-ignore
  allFunds: FundModel[];
  walletBalances: any;
  walletBalancesQueryKey: any[];
  refresh?: () => void;
  prices: PythPrice[];
  setActiveFund: any;
  jupTokenList?: JupTokenListItem[];
  driftMarketConfigs: DriftMarketConfigs;
}

interface TokenAccount {
  address: string;
  mint: string;
  decimals: number;
  amount: string;
  uiAmount: string;
}

interface TreasuryCache {
  pubkey: PublicKey;
  balanceLamports: number;
  tokenAccounts: TokenAccount[];
}

interface FundCache {
  address: string;
  pubkey: PublicKey;
  imageKey: string;
  name: string;
}

interface PerpMarketConfig {
  fullName: string;
  categories: string[];
  symbol: string;
  baseAsset: string;
  marketIndex: number;
  launchTs: string;
  oracle: string;
  pythPullOraclePDA: string;
  pythFeedId: string;
  marketPDA: string;
}

interface SpotMarketConfig {
  symbol: string;
  marketIndex: number;
  launchTs?: string;
  oracle: string;
  pythPullOraclePDA: string;
  pythFeedId: string;
  marketPDA: string;
  mint: string;
  serumMarket?: string;
  phoenixMarket?: string;
  openBookMarket?: string;
}

interface DriftMarketConfigs {
  perp: PerpMarketConfig[];
  spot: SpotMarketConfig[];
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
  if (typeof f.pubkey === "string") {
    f.address = f.pubkey;
    f.pubkey = new PublicKey(f.pubkey);
  }
  return f as FundCache;
};

const toFundCache = (f: FundModel) => {
  return {
    pubkey: f.id,
    imageKey: f.imageKey,
    address: f.id.toBase58(),
    name: f.name,
  } as FundCache;
};

const fetchBalances = async (glamClient: GlamClient, owner: PublicKey) => {
  const balanceLamports = await glamClient.provider.connection.getBalance(
    owner
  );
  const tokenAccounts = await glamClient.listTokenAccounts(owner);
  tokenAccounts.forEach((ta: any) => {
    ta.address = ta.address.toBase58();
  });

  // Add wSOL account if it doesn't exist, so that we can properly combine SOL and wSOL balances
  if (!tokenAccounts.find((ta: any) => ta.mint === WSOL.toBase58())) {
    tokenAccounts.push({
      mint: WSOL.toBase58(),
      address: getAssociatedTokenAddressSync(WSOL, owner, true).toBase58(),
      amount: "0",
      uiAmount: "0",
    });
  }

  return {
    balanceLamports,
    tokenAccounts,
  };
};

export function GlamProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const setActiveFund = useSetAtom(fundAtom);
  const setFundsList = useSetAtom(fundsListAtom);

  const [treasury, setTreasury] = useState({} as TreasuryCache);
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
  const [pythPrices, setPythPrices] = useState([] as PythPrice[]);
  const [driftMarketConfigs, setDriftMarketConfigs] = useState(
    {} as DriftMarketConfigs
  );

  const activeFund = deserializeFundCache(useAtomValue(fundAtom)) as FundCache;

  // Build a lookup table for price account -> mint account
  const priceFeedToMint = new Map<string, string>([]);
  for (let [mint, asset] of ASSETS_MAINNET) {
    priceFeedToMint.set(asset.priceFeed!, mint);
  }

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
      if (!activeFund) {
        setActiveFund(fundList[0]);
      }
    }

    const fetchData = async () => {
      if (activeFund && activeFund.pubkey) {
        const treasury = glamClient.getTreasuryPDA(activeFund.pubkey);
        const balances = await fetchBalances(glamClient, treasury);
        setTreasury({
          ...balances,
          pubkey: treasury,
        } as TreasuryCache);
      }
    };

    fetchData();
  }, [allFundsData, activeFund, wallet]);

  //
  // Fetch prices from pyth
  //

  const { data: pythData } = useQuery({
    queryKey: ["/prices"],
    enabled: !!treasury?.tokenAccounts,
    refetchInterval: 10 * 1000,
    queryFn: () => {
      const pythFeedIds = new Set([] as string[]);
      treasury.tokenAccounts.forEach((ta: TokenAccount) => {
        const hex = ASSETS_MAINNET.get(ta.mint)?.priceFeed!;
        pythFeedIds.add(hex);
      });
      // Always add wSOL feed so that we can price SOL
      pythFeedIds.add(ASSETS_MAINNET.get(WSOL.toBase58())?.priceFeed!);

      const params = Array.from(pythFeedIds)
        .map((hex) => `ids[]=${hex}`)
        .join("&");

      return fetch(
        `https://hermes.pyth.network/v2/updates/price/latest?${params}`
      ).then((res) => res.json());
    },
  });
  useEffect(() => {
    if (pythData) {
      const prices = pythData.parsed.map((p: any) => {
        const price =
          Number.parseFloat(p.price.price) *
          10 ** Number.parseInt(p.price.expo);

        return {
          mint: priceFeedToMint.get(p.id),
          price,
        } as PythPrice;
      });
      setPythPrices(prices);
    }
  }, [pythData]);

  //
  // Balance and token accounts of the connected wallet
  //
  const walletBalancesQueryKey = ["balances", wallet?.publicKey];
  const { data: walletBalances } = useQuery({
    queryKey: walletBalancesQueryKey,
    enabled: !!wallet?.publicKey,
    queryFn: () => fetchBalances(glamClient, wallet?.publicKey!),
  });

  //
  // Fetch token list from jupiter api
  //
  const { data: tokenList } = useQuery({
    queryKey: ["jupiter-tokens-list"],
    queryFn: async () => {
      const response = await fetch(
        "https://tokens.jup.ag/tokens?tags=verified"
      );
      const data = await response.json();
      const tokenList = data?.map((t: any) => ({
        address: t.address,
        name: t.name,
        symbol: t.symbol,
        decimals: t.decimals,
        logoURI: t.logoURI,
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
    queryFn: async () => {
      const response = await fetch(
        "https://rest.glam.systems/v0/drift/market_configs/"
      );
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
  useEffect(() => setDriftMarketConfigs(marketConfigs), [marketConfigs]);

  const value: GlamProviderContext = {
    glamClient,
    wallet: (wallet && wallet.publicKey) || undefined,
    activeFund,
    fund: activeFund?.pubkey,
    treasury,
    fundsList: useAtomValue(fundsListAtom),
    allFunds,
    walletBalances,
    walletBalancesQueryKey,
    jupTokenList,
    prices: pythPrices,
    setActiveFund,
    driftMarketConfigs,
  };

  return <GlamContext.Provider value={value}>{children}</GlamContext.Provider>;
}

export const useGlam = () => useContext(GlamContext);
