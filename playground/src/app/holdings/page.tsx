"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React, {useMemo, useState} from "react";

import { testFund } from "@/app/testFund";
import {PublicKey} from "@solana/web3.js";
import {useQuery, useQueryClient } from "@tanstack/react-query";
import {TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {useConnection} from "@solana/wallet-adapter-react";
import {ExplorerLink} from "../../components/ExplorerLink"; // not sure if this is correct

const holdings = [
  {
    asset: "SOL",
    location: "internal",
    balance: 1234.56789,
    notional: 14000.14,
  },
  {
    asset: "wBTC",
    location: "external",
    balance: 69.42,
    notional: 4321000.56789,
  },
];

export function useGetTokenAccounts({ address }: { address: PublicKey }) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: [
      'get-token-accounts',
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

export default function Holdings() {

  const query = useGetTokenAccounts({address: new PublicKey(testFund.treasuryPDA)});

  const [showAll, setShowAll] = useState(false);
  const client = useQueryClient();
  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  return (<div>
      <div className="space-y-2">
        <div className="justify-between">
          <div className="flex justify-between">
            <h2 className="text-2xl font-bold">Token Accounts</h2>
            <div className="space-x-2">
              {query.isLoading ? (<span className="loading loading-spinner"></span>) : (<button
                  className="btn btn-sm btn-outline"
                  onClick={async () => {
                    await query.refetch();
                    await client.invalidateQueries({
                      queryKey: ['getTokenAccountBalance'],
                    });
                  }}
                >
                  Refresh
                </button>)}
            </div>
          </div>
        </div>
        {query.isError && (<pre className="alert alert-error">
          Error: {query.error?.message.toString()}
        </pre>)}
        {query.isSuccess && (<div>
            {query.data.length === 0 ? (<div>No token accounts found.</div>) : (<table className="table border-4 rounded-lg border-separate border-base-300">
                <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Public Key</th>
                  <th>Mint</th>
                  <th className="text-right">Balance</th>
                </tr>
                </thead>
                <tbody>
                {items?.map(({account, pubkey}) => (<tr key={pubkey.toString()}>
                    <td>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink
                            label={pubkey.toString()}
                            path={`account/${pubkey.toString()}`}
                          />
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink
                            label={account.data.parsed.info.mint}
                            path={`account/${account.data.parsed.info.mint.toString()}`}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="font-mono">
                        {account.data.parsed.info.tokenAmount.uiAmount}
                      </span>
                    </td>
                  </tr>))}

                {(query.data?.length ?? 0) > 5 && (<tr>
                    <td colSpan={4} className="text-center">
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? 'Show Less' : 'Show All'}
                      </button>
                    </td>
                  </tr>)}
                </tbody>
              </table>)}
          </div>)}
      </div>
      <div className="flex w-2/3 mt-16 self-center">
        <DataTable data={holdings} columns={columns}/>
      </div>
    </div>);
}
