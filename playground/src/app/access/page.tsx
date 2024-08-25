"use client";

import { DataTable } from "./components/data-table";
import { KeyData } from "./components/data-table";
import { columns } from "./components/columns";
import React from "react";
import { testKeys } from "./data/testKeys";
import PageContentWrapper from "@/components/PageContentWrapper";

export default function Access() {
  return (
    <PageContentWrapper>
      <DataTable data={testKeys as KeyData[]} columns={columns} />
    </PageContentWrapper>
  );
}
