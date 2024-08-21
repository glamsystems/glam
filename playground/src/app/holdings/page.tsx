"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React, { useMemo, useState, useEffect } from "react";

import { testFund } from "@/app/testFund";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection } from "@solana/wallet-adapter-react";
import JupiterStrict from "../jupiter/data/jupiterStrict";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";

export function useGetTokenAccounts({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: [
      "get-token-accounts",
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      const [tokenAccounts, token2022Accounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_PROGRAM_ID,
        }),
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_2022_PROGRAM_ID,
        }),
      ]);
      return [...tokenAccounts.value, ...token2022Accounts.value];
    },
  });
}

export function useGetSolBalance({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["get-balance", { endpoint: connection.rpcEndpoint, address }],
    queryFn: async () => {
      const balance = await connection.getBalance(address);
      return balance;
    },
  });
}

export default function Holdings() {
  const { glamClient } = useGlam();
  const fundPDA = new PublicKey(testFund.fundPDA);
  const treasuryPDA = glamClient.getTreasuryPDA(fundPDA);
  const query = useGetTokenAccounts({ address: treasuryPDA });
  const solBalanceQuery = useGetSolBalance({ address: treasuryPDA });
  const [jupiterData, setJupiterData] = useState([]);

  useEffect(() => {
    const fetchJupiterData = async () => {
      const data = await JupiterStrict();
      setJupiterData(data);
    };
    fetchJupiterData();
  }, []);

  const items = useMemo(() => query.data ?? [], [query.data]);

  const solBalance = useMemo(
    () => solBalanceQuery.data ?? -1,
    [solBalanceQuery.data]
  );

  const data = useMemo(() => {
    const tokenAccounts = items.map(({ account, pubkey }) => {
      const mintAddress = account.data.parsed.info.mint.toString();
      const jupiterAsset =
        jupiterData.find((asset: any) => asset.address === mintAddress) ||
        ({} as any);

      return {
        name: jupiterAsset.name || "Placeholder Name",
        symbol:
          jupiterAsset.symbol === "SOL"
            ? "wSOL"
            : jupiterAsset.symbol || "Placeholder Symbol",
        mint: mintAddress,
        ata: pubkey.toString(),
        balance: account.data.parsed.info.tokenAmount.uiAmount,
        notional: 1234.56,
      };
    });

    if (solBalance !== -1) {
      tokenAccounts.push({
        name: "Solana",
        symbol: "SOL",
        mint: "",
        ata: "",
        balance: solBalance / LAMPORTS_PER_SOL,
        notional: 1234.56,
      });
    }

    // Sort the tokenAccounts by balance in descending order
    tokenAccounts.sort((a, b) => b.balance - a.balance);

    return tokenAccounts;
  }, [items, jupiterData, solBalance]);

  return (
    <PageContentWrapper>
      <DataTable data={data} columns={columns} />
    </PageContentWrapper>
  );
}
