"use client";

import { DataTable } from "./products/components/data-table";
import { columns } from "./products/components/columns";
import React from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";

export default function Products() {
  const { allFunds } = useGlam();

  const products = (allFunds || []).map((f: any) => ({
    id: f.idStr,
    imageKey: f.imageKey,
    name: f.name,
    symbol: f.shareClasses[0]?.shareClassSymbol || "",
    baseAsset: f.fundCurrency,
    inception: f.fundLaunchDate,
    status: "active",
  }));

  return (
    <PageContentWrapper>
      {/*@ts-ignore*/}
      <DataTable data={products} columns={columns} />
    </PageContentWrapper>
  );
}
