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
import { useGlamClient } from "@glam/anchor";

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
  const glamClient = useGlamClient();
  const query = useGetTokenAccounts({ address: glamClient.getTreasuryPDA(new PublicKey(testFund.fundPDA)) });
  const [jupiterData, setJupiterData] = useState([]);

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
      notional: 1234.56
    };
  }), [items, jupiterData]);

  return (
    <div className="flex w-2/3 mt-16 self-center">
      <DataTable data={data} columns={columns} />
    </div>
  );
}
