"use client";

import { DataTable } from "./products/components/data-table";
import { columns } from "./products/components/columns";
import React from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";

export default function Products() {
  // @ts-ignore Type instantiation is excessively deep and possibly infinite.
  const { allFunds } = useGlam();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (allFunds) {
      setIsLoading(false);
    }
  }, [allFunds]);

  const products = (allFunds || []).map((f: any) => ({
    id: f.idStr,
    imageKey: f.imageKey,
    name: f.name || f.idStr,
    symbol: f.shareClasses[0]?.shareClassSymbol || "NA",
    baseAsset: f.fundCurrency || "NA",
    inception: f.fundLaunchDate,
    status: "active",
  }));

  return (
    <PageContentWrapper>
      <DataTable data={products} columns={columns} isLoading={isLoading} />
    </PageContentWrapper>
  );
}
