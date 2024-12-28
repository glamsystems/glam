"use client";

import { DataTable } from "../products/components/data-table";
import { columns } from "../products/components/columns";
import React from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";

export default function Products() {
  const { allFunds } = useGlam();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (allFunds) {
      setIsLoading(false);
    }
  }, [allFunds]);

  const products = (allFunds || []).map((f) => ({
    id: f.idStr,
    imageKey: f.sparkleKey,
    name: f.name || f.id?.toBase58() || "",
    symbol: f.shareClasses[0]?.symbol || "-",
    baseAsset: f.rawOpenfunds?.fundCurrency || "SOL",
    inception: f.rawOpenfunds?.fundLaunchDate || "-",
    status: "active",
  }));

  return (
    <PageContentWrapper>
      <DataTable data={products} columns={columns} isLoading={isLoading} />
    </PageContentWrapper>
  );
}
