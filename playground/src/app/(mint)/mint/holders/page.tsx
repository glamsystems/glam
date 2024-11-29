"use client";

import React from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import {
  DataTable,
  HoldersData,
} from "@/app/(mint)/mint/holders/components/data-table";
import { columns } from "@/app/(mint)/mint/holders/components/columns";
import { GlamClient, useGlam } from "@glam/anchor/react";
import { TOKEN_2022_PROGRAM_ID, unpackAccount } from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

const fetchTokenHolders = async (
  glamClient?: GlamClient,
  fundPDA?: PublicKey
) => {
  if (!fundPDA || !glamClient) {
    return [];
  }
  const shareClassMint = glamClient.getShareClassPDA(fundPDA, 0);
  const accounts = await glamClient.provider.connection.getProgramAccounts(
    TOKEN_2022_PROGRAM_ID,
    {
      filters: [
        {
          dataSize: 175, // Size of a token 2022 ata
        },
        {
          memcmp: {
            offset: 0,
            bytes: shareClassMint.toBase58(),
          },
        },
      ],
    }
  );
  return accounts.map((a) => {
    const { pubkey, account } = a;
    const tokenAccount = unpackAccount(pubkey, account, TOKEN_2022_PROGRAM_ID);
    return {
      pubkey: tokenAccount.address.toBase58(),
      label: "Token holder " + Math.floor(Math.random() * 10000),
      frozen: tokenAccount.isFrozen,
      quantity: Number(tokenAccount.amount) / LAMPORTS_PER_SOL,
    };
  });
};

export default function HoldersPage() {
  // @ts-ignore
  const { glamClient, fund: fundPDA } = useGlam();
  const [holders, setHolders] = React.useState([] as HoldersData[]);

  React.useEffect(() => {
    const fetchData = async () => {
      const holders = await fetchTokenHolders(glamClient, fundPDA);
      setHolders(holders);
    };

    fetchData();
  }, [glamClient, fundPDA]);

  return (
    <PageContentWrapper>
      <DataTable data={holders} columns={columns} />
    </PageContentWrapper>
  );
}
