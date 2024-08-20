"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React from "react";
import { testProducts } from "./data/testProducts";
import PageContentWrapper from "@/components/PageContentWrapper";

export default function Products() {
  return (
    <PageContentWrapper>
      <DataTable data={testProducts} columns={columns} />
    </PageContentWrapper>
  );
}
