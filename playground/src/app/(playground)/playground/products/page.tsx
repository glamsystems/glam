"use client";

import { DataTable } from "../products/components/data-table";
import { columns } from "../products/components/columns";
import React, { useMemo } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glam/anchor/react";

export default function Products() {
  const { allGlamStates } = useGlam();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (allGlamStates) {
      setIsLoading(false);
    }
  }, [allGlamStates]);

  const products = useMemo(
    () =>
      (allGlamStates || []).map((f) => ({
        id: f.idStr,
        sparkleKey: f.sparkleKey,
        name: f.name || f.idStr || "",
        symbol: f.mints[0]?.symbol || "-",
        baseAsset: f.rawOpenfunds?.fundCurrency || "SOL",
        inception: f.rawOpenfunds?.fundLaunchDate || "-",
        status: "active",
        product: f.productType,
      })),
    [allGlamStates],
  );

  return (
    <PageContentWrapper>
      <DataTable data={products} columns={columns} isLoading={isLoading} />
    </PageContentWrapper>
  );
}
