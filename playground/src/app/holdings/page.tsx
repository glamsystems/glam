"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React, { useMemo, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";
import { Holding } from "./data/holdingSchema"; // Make sure to import the Holding type

const SKELETON_ROW_COUNT = 5;

export default function Holdings() {
  const { activeFund, jupTokenList } = useGlam();

  const { treasury } = activeFund || {};

  const [isLoading, setIsLoading] = useState(false);

  const createSkeletonHolding = (): Holding => ({
    name: "",
    symbol: "",
    mint: "",
    ata: "",
    balance: 0,
    notional: 0,
    logoURI: "",
    location: "",
  });

  const tableData = useMemo(() => {
    if (isLoading) {
      return Array(SKELETON_ROW_COUNT).fill(null).map(createSkeletonHolding);
    }

    const solBalance = Number(treasury?.balanceLamports) / LAMPORTS_PER_SOL;
    const tokenAccounts: Holding[] = [];
    if (solBalance) {
      tokenAccounts.push({
        name: "Solana",
        symbol: "SOL",
        mint: "",
        ata: "",
        balance: solBalance,
        notional: 1234.56,
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
          return {
            name,
            symbol: symbol === "SOL" ? "wSOL" : symbol,
            mint: ta.mint,
            ata: ta.address,
            balance: Number(ta.uiAmount),
            notional: 1234.56,
            logoURI: logoURI,
            location: "vault",
          };
        })
      );
    }

    // Sort the tokenAccounts by balance in descending order
    return tokenAccounts.sort((a, b) => b.balance - a.balance);
  }, [treasury, jupTokenList, isLoading]);

  return (
    <PageContentWrapper>
      <DataTable data={tableData} columns={columns} isLoading={isLoading} />
    </PageContentWrapper>
  );
}
