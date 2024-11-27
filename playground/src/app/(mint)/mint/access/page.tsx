"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";

export default function Access() {
  //@ts-ignore
  const { allFunds, activeFund } = useGlam();

  const fundId = activeFund?.address;
  const fund: any = fundId
    ? (allFunds || []).find((f: any) => f.idStr === fundId)
    : undefined;

  const data = (fund?.delegateAcls || []).map((acl: any) => ({
    pubkey: acl.pubkey.toBase58(),
    label: "-",
    tags: (acl.permissions || []).map((x: any) => Object.keys(x)[0]),
  }));

  return (
    <PageContentWrapper>
      <DataTable data={data} columns={columns} />
    </PageContentWrapper>
  );
}
