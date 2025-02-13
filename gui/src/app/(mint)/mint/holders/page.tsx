"use client";

import React from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { DataTable } from "@/app/(mint)/mint/holders/components/data-table";
import {
  columns,
  HoldersData,
} from "@/app/(mint)/mint/holders/components/columns";
import { useGlam } from "@glamsystems/glam-sdk/react";

export default function HoldersPage() {
  const { glamClient, activeGlamState } = useGlam();
  const [holders, setHolders] = React.useState([] as HoldersData[]);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!glamClient || !activeGlamState?.pubkey) {
        return;
      }
      const tokenAccounts = await glamClient.mint.getHolders(
        activeGlamState.pubkey,
        0,
      );

      // convert token accounts to holder data models
      setHolders(
        tokenAccounts.map((ta) => ({
          pubkey: ta.owner.toBase58(),
          ata: ta.pubkey.toBase58(),
          label: "Token holder " + Math.floor(Math.random() * 10000),
          frozen: ta.frozen,
          quantity: ta.uiAmount,
        })),
      );
    };

    fetchData();
  }, [glamClient, activeGlamState]);

  return (
    <PageContentWrapper>
      <DataTable data={holders} columns={columns} />
    </PageContentWrapper>
  );
}
