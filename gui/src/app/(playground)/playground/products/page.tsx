"use client";

import { DataTable } from "../products/components/data-table";
import { columns } from "../products/components/columns";
import React, { useMemo } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { useGlam } from "@glamsystems/glam-sdk/react";

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
      (allGlamStates || []).map((s) => ({
        id: s.idStr,
        sparkleKey: s.sparkleKey,
        name: s.name || s.idStr || "",
        symbol: (s.mints || [])[0]?.symbol || "-",
        baseAsset: s.rawOpenfunds?.fundCurrency || "SOL",
        inception: s.rawOpenfunds?.fundLaunchDate || "-",
        status: "active",
        product: s.productType,
      })),
    [allGlamStates],
  );

  return (
    <PageContentWrapper>
      <DataTable data={products} columns={columns} isLoading={isLoading} />
    </PageContentWrapper>
  );
}
