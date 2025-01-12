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
  activeGlamState?: GlamStateCache;
  vault?: Vault;
  glamStatesList: GlamStateCache[];
  allGlamStates: StateModel[];
  userWallet: UserWallet;
  prices: TokenPrice[];
  jupTokenList?: JupTokenListItem[];
  driftMarketConfigs: DriftMarketConfigs;
  driftUser: GlamDriftUser;
  setActiveGlamState: (f: GlamStateCache) => void;
  refresh: () => Promise<void>;
}

interface UserWallet {
  queryKey: string[];
  pubkey?: PublicKey; // if pubkey is null, wallet is not connected
  balanceLamports: number;
  tokenAccounts: TokenAccount[];
}

interface Vault {
  pubkey: PublicKey;
  balanceLamports: number; // TODO: this should be a BN or string, it works until ~9M SOL
  tokenAccounts: TokenAccount[];
}

interface GlamStateCache {
  address: string;
  pubkey: PublicKey;
  sparkleKey: string;
  name: string;
  product: "Mint" | "Vault" | "Fund";
}

const GlamContext = createContext<GlamProviderContext>(
  {} as GlamProviderContext,
);

const activeGlamStateAtom = atomWithStorage<GlamStateCache>(
  "active-glam-state",
  {} as GlamStateCache,
);
const glamStatesListAtom = atomWithStorage<GlamStateCache[]>(
  "glam-states-list",
  [] as GlamStateCache[],
);

// In order to properly deser states, we need to
// convert string -> pubkey (and maybe more in future)
const deserializeGlamStateCache = (f: any) => {
  if (!f) {
    return undefined;
  }
  if (typeof f.pubkey === "string") {
    f.address = f.pubkey;
    f.pubkey = new PublicKey(f.pubkey);
  }
  return f as GlamStateCache;
};

const toStateCache = (f: StateModel) => {
  return {
    pubkey: f.id,
    sparkleKey: f.sparkleKey,
    address: f.idStr,
    name: f.name,
    product: f.productType,
  } as GlamStateCache;
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
  const setActiveGlamState = useSetAtom(activeGlamStateAtom);
  const setGlamStatesList = useSetAtom(glamStatesListAtom);

  const [vault, setVault] = useState({} as Vault);
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
  const [allGlamStates, setAllGlamStates] = useState([] as StateModel[]);
  const [jupTokenList, setJupTokenList] = useState([] as JupTokenListItem[]);
  const [tokenPrices, setTokenPrices] = useState([] as TokenPrice[]);
  const [driftMarketConfigs, setDriftMarketConfigs] = useState(
    {} as DriftMarketConfigs,
  );
  const [driftUser, setDriftUser] = useState({} as GlamDriftUser);

  const activeGlamState = deserializeGlamStateCache(
    useAtomValue(activeGlamStateAtom),
  ) as GlamStateCache;

  //
  // Fetch all glam states
  //
  const refreshVaultHoldings = async () => {
    if (activeGlamState?.pubkey && wallet?.publicKey) {
      console.log(
        "fetching vault data for active glam state:",
        activeGlamState.pubkey.toBase58(),
      );
      const vault = glamClient.getVaultPda(activeGlamState.pubkey);
      const balances = await fetchBalances(glamClient, vault);
      setVault({
        ...balances,
        pubkey: vault,
      } as Vault);
    }
  };

  const { data: allGlamStatesData } = useQuery({
    queryKey: ["/all-glam-states", activeGlamState?.pubkey],
    queryFn: () => glamClient.fetchAllGlamStates(),
  });
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("All glam states:", allGlamStatesData);
    }
    const stateModels = (allGlamStatesData || []).sort(
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
    setAllGlamStates(stateModels);

    const glamStatesList = [] as GlamStateCache[];
    stateModels.forEach((f: StateModel) => {
      if (wallet?.publicKey?.equals(f.owner!.pubkey!)) {
        const stateCache = toStateCache(f);
        glamStatesList.push(stateCache);
      } else {
        // Iterate over delegateAcls to find funds that the wallet has access to
        f.delegateAcls.forEach((acl: any) => {
          if (wallet?.publicKey?.equals(acl.pubkey)) {
            glamStatesList.push(toStateCache(f));
          }
        });
      }
    });
    if (glamStatesList.length > 0) {
      setGlamStatesList(glamStatesList);
      if (
        !activeGlamState ||
        !glamStatesList.find(
          (state) =>
            state.pubkey &&
            activeGlamState.pubkey &&
            state.pubkey.equals(activeGlamState.pubkey),
        )
      ) {
        setActiveGlamState(glamStatesList[0]);
      }
    }

    refreshVaultHoldings();
  }, [allGlamStatesData, activeGlamState, wallet, cluster]);

  //
  // Fetch token prices https://station.jup.ag/docs/apis/price-api-v2
  //
  const { data: jupTokenPricesData } = useQuery({
    queryKey: ["/jup-token-prices", vault?.pubkey],
    enabled: cluster.network === "mainnet-beta",
    refetchInterval: 10_000,
    queryFn: () => {
      const tokenMints = new Set([] as string[]);

      tokenMints.add(WSOL.toBase58()); // Always add wSOL feed so that we can price SOL

      // Token accounts owned by the vault
      (vault.tokenAccounts || []).forEach((ta: TokenAccount) => {
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
    queryKey: ["/drift-positions", vault?.pubkey],
    enabled: !!vault,
    refetchInterval: 30 * 1000,
    queryFn: () => {
      return fetch(
        `https://api.glam.systems/v0/drift/user?authority=${vault?.pubkey.toBase58()}&accountId=0`,
      ).then((res) => res.json());
    },
  });
  useEffect(() => {
    setDriftUser(driftUserData || {});
  }, [driftUserData, activeGlamState]);

  const value: GlamProviderContext = {
    glamClient,
    activeGlamState,
    vault,
    glamStatesList: useAtomValue(glamStatesListAtom),
    allGlamStates,
    userWallet,
    jupTokenList,
    prices: tokenPrices,
    setActiveGlamState,
    driftMarketConfigs,
    driftUser,
    refresh: async () => {
      refreshVaultHoldings();
    },
  };

  return <GlamContext.Provider value={value}>{children}</GlamContext.Provider>;
}

export const useGlam = () => useContext(GlamContext);
