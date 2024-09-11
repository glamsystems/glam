"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React, { useMemo } from "react";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";
import { useQuery } from "@tanstack/react-query";

export default function Holdings() {
  const { treasury } = useGlam();
  const solBalance = Number(treasury?.balanceLamports) / LAMPORTS_PER_SOL;

  const { data: tokensInfo } = useQuery({
    queryKey: ["jupiter-api"],
    queryFn: () =>
      fetch("https://token.jup.ag/strict").then((res) => res.json()),
  });

  const tableData = useMemo(() => {
    const tokenAccounts = [];
    if (solBalance) {
      tokenAccounts.push({
        name: "Solana",
        symbol: "SOL",
        mint: "",
        ata: "",
        balance: solBalance,
        notional: 1234.56,
        logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
      });
    }
    if (treasury?.tokenAccounts) {
      tokenAccounts.push(
        ...treasury.tokenAccounts.map((ta) => {
          const logoURI =
            tokensInfo?.find((t: any) => t.address === ta.mint)?.logoURI ||
            "";
          const name =
            tokensInfo?.find((t: any) => t.address === ta.mint)?.name ||
            "Unknown";
          const symbol =
            tokensInfo?.find((t: any) => t.address === ta.mint)?.symbol ||
            ta.mint;
          return {
            name,
            symbol: symbol === "SOL" ? "wSOL" : symbol,
            mint: ta.mint,
            ata: ta.address,
            balance: Number(ta.uiAmount),
            notional: 1234.56,
            logoURI: logoURI,
          };
        })
      );
    }

    // Sort the tokenAccounts by balance in descending order
    tokenAccounts.sort((a, b) => b.balance - a.balance);

    return tokenAccounts;
  }, [treasury, tokensInfo]);

  return (
    <PageContentWrapper>
      <DataTable data={tableData} columns={columns} />
    </PageContentWrapper>
  );
}
