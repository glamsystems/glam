"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import JupiterStrict from "./data/jupiterStrict";
import { Skeleton } from "@/components/ui/skeleton";
import PageContentWrapper from "@/components/PageContentWrapper";

export default function Assets() {
  const [assets, setAssets] = useState(null);

  useEffect(() => {
    async function fetchAssets() {
      const data = await JupiterStrict();
      setAssets(data);
    }

    fetchAssets();
  }, []);

  return (
    <PageContentWrapper>
      {assets ? (
        <DataTable data={assets} columns={columns} />
      ) : (
        <div className="flex flex-col w-full">
          <Skeleton className="w-full h-[32px] mb-[16px]" />
          <Skeleton className="w-full h-[48px] mb-2" />
          <Skeleton className="w-full h-[48px] mb-2" />
          <Skeleton className="w-full h-[48px] mb-2" />
          <Skeleton className="w-full h-[48px] mb-2" />
          <Skeleton className="w-full h-[48px] mb-2" />
          <Skeleton className="w-full h-[48px] mb-2" />
          <Skeleton className="w-full h-[48px] mb-2" />
          <Skeleton className="w-full h-[48px] mb-2" />
          <Skeleton className="w-full h-[48px] mb-2" />
          <Skeleton className="w-full h-[48px] mb-2" />
          <Skeleton className="w-full h-[48px] mb-2" />
        </div>
      )}
    </PageContentWrapper>
  );
}
