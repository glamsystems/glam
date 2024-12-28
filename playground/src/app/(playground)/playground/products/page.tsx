"use client";

import { DataTable } from "../products/components/data-table";
import { columns } from "../products/components/columns";
import React, { useMemo } from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { FundModel, useGlam } from "@glam/anchor/react";

export default function Products() {
  const { allFunds } = useGlam();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (allFunds) {
      setIsLoading(false);
    }
  }, [allFunds]);

  const getProduct = (f: FundModel) => {
    if (f.shareClasses.length === 0) {
      return "Vault";
    }
    // @ts-ignore
    if (f.integrationAcls.find((acl) => Object.keys(acl.name)[0] === "mint")) {
      return "Mint";
    }
    return "Fund";
  };

  const products = useMemo(
    () =>
      (allFunds || []).map((f) => ({
        id: f.idStr,
        sparkleKey: f.sparkleKey,
        name: f.name || f.idStr || "",
        symbol: f.shareClasses[0]?.symbol || "-",
        baseAsset: f.rawOpenfunds?.fundCurrency || "SOL",
        inception: f.rawOpenfunds?.fundLaunchDate || "-",
        status: "active",
        product: getProduct(f),
      })),
    [allFunds],
  );

  return (
    <PageContentWrapper>
      <DataTable data={products} columns={columns} isLoading={isLoading} />
    </PageContentWrapper>
  );
}
