"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React from "react";
import { testProducts } from "./data/testProducts";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";

export default function Products() {
  const { allFunds } = useGlam();

  const products = (allFunds || []).map((f: any) => ({
    id: f.idStr,
    imageKey: f.imageKey,
    name: f.name,
    symbol: "GLAM",
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
