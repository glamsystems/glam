"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React, { useMemo, useState, useEffect } from "react";

import { testFund } from "@/app/testFund";
import { PublicKey } from "@solana/web3.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection } from "@solana/wallet-adapter-react";
import JupiterStrict from "../assets/data/jupiterStrict";

export function useGetTokenAccounts({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['get-token-accounts', { endpoint: connection.rpcEndpoint, address }],
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

export default function Holdings() {
  const query = useGetTokenAccounts({ address: new PublicKey(testFund.treasuryPDA) });
  const [jupiterData, setJupiterData] = useState([]);
  const client = useQueryClient();

  useEffect(() => {
    const fetchJupiterData = async () => {
      const data = await JupiterStrict();
      setJupiterData(data);
    };
    fetchJupiterData();
  }, []);

  const items = useMemo(() => query.data ?? [], [query.data]);

  const data = useMemo(() => items.map(({ account, pubkey }) => {
    const mintAddress = account.data.parsed.info.mint.toString();
    const jupiterAsset = jupiterData.find(asset => asset.address === mintAddress) || {};

    return {
      name: jupiterAsset.name || "Placeholder Name",
      symbol: jupiterAsset.symbol || "Placeholder Symbol",
      mint: mintAddress,
      ata: pubkey.toString(),
      balance: account.data.parsed.info.tokenAmount.uiAmount,
      notional: 123
    };
  }), [items, jupiterData]);

  return (
    <div className="flex w-2/3 mt-16 self-center">
      <DataTable data={data} columns={columns} />
    </div>
  );
}
