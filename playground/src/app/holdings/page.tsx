"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React, { useEffect, useMemo, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";
import { Holding } from "./data/holdingSchema";
import { useQuery } from "@tanstack/react-query";
import { SpotPosition } from "@drift-labs/sdk";

const SKELETON_ROW_COUNT = 5;

export default function Holdings() {
  const { activeFund, treasury, driftMarketConfigs, jupTokenList, prices } =
    useGlam();

  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [isLoadingData, setIsLoading] = useState(true);
  const [driftSpotPositions, setDriftSpotPositions] = useState(
    [] as SpotPosition[]
  );

  const createSkeletonHolding = (): Holding => ({
    name: "",
    symbol: "",
    mint: "",
    ata: "",
    price: 0,
    balance: 0,
    notional: 0,
    logoURI: "",
    location: "",
  });

  const skeletonData = useMemo(() => {
    return Array(SKELETON_ROW_COUNT).fill(null).map(createSkeletonHolding);
  }, []);

  const tableData = useMemo(() => {
    const tokenAccounts: Holding[] = [];

    const solBalance = Number(treasury?.balanceLamports) / LAMPORTS_PER_SOL;
    if (solBalance > 0) {
      const mint = "So11111111111111111111111111111111111111112";
      const price = prices?.find((p) => p.mint === mint)?.price || 0;
      tokenAccounts.push({
        name: "Solana",
        symbol: "SOL",
        mint: "",
        ata: "",
        price: price,
        balance: solBalance,
        notional: solBalance * price || 0,
        location: "vault",
        logoURI:
          "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      });
    }

    if (treasury?.tokenAccounts) {
      tokenAccounts.push(
        ...treasury.tokenAccounts.map((ta) => {
          const logoURI =
            jupTokenList?.find((t: any) => t.address === ta.mint)?.logoURI ||
            "";
          const name =
            jupTokenList?.find((t: any) => t.address === ta.mint)?.name ||
            "Unknown";
          const symbol =
            jupTokenList?.find((t: any) => t.address === ta.mint)?.symbol ||
            ta.mint;
          const price = prices?.find((p) => p.mint === ta.mint)?.price || 0;
          return {
            name,
            symbol: symbol === "SOL" ? "wSOL" : symbol,
            mint: ta.mint,
            ata: ta.address,
            price: price,
            balance: Number(ta.uiAmount),
            notional: Number(ta.uiAmount) * price || 0,
            logoURI: logoURI,
            location: "vault",
          };
        })
      );
    }

    if (driftSpotPositions.length > 0) {
      const spotMarkets = driftMarketConfigs.spot;
      const driftHoldings = driftSpotPositions.map((p) => {
        const market = spotMarkets.find((m) => m.marketIndex === p.marketIndex);
        const price = prices?.find((p) => p.mint === market?.mint)?.price || 0;
        const balance = Number(p.scaledBalance) / 10 ** 9;
        return {
          name: `${p.marketIndex}`,
          symbol: market?.symbol || "",
          mint: "NA",
          ata: "NA",
          price,
          balance,
          notional: balance * price || 0,
          logoURI: "https://avatars.githubusercontent.com/u/83389928?s=48&v=4",
          location: "drift",
        };
      });
      tokenAccounts.push(...driftHoldings);
    }

    return tokenAccounts.sort((a, b) => {
      if (b.location > a.location) return 1;
      if (b.location < a.location) return -1;
      return b.balance - a.balance;
    });
  }, [treasury, driftSpotPositions, jupTokenList, prices]);

  const { data: driftUser } = useQuery({
    queryKey: ["/drift-user"],
    enabled: !!treasury,
    refetchInterval: 30 * 1000,
    queryFn: () => {
      return fetch(
        `https://api.glam.systems/v0/drift/user?authority=${treasury?.pubkey.toBase58()}&accountId=0`
      ).then((res) => res.json());
    },
  });
  useEffect(() => {
    if (driftUser) {
      const { spotPositions } = driftUser;
      if (spotPositions && spotPositions.length && spotPositions.length > 0) {
        setDriftSpotPositions(spotPositions);
      }
    }
  }, [driftUser]);

  useEffect(() => {
    if (activeFund && treasury && jupTokenList && prices) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [treasury, jupTokenList, prices, activeFund]);

  return (
    <PageContentWrapper>
      <DataTable
        data={
          isLoadingData
            ? skeletonData
            : showZeroBalances
            ? tableData
            : tableData.filter((d) => d.balance > 0)
        }
        columns={columns}
        setShowZeroBalances={setShowZeroBalances}
      />
    </PageContentWrapper>
  );
}
