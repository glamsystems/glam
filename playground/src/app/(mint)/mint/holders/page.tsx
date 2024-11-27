"use client";

import React from "react";
import PageContentWrapper from "@/components/PageContentWrapper";
import { DataTable } from "@/app/(mint)/mint/holders/components/data-table";
import { columns } from "@/app/(mint)/mint/holders/components/columns";
import { testKeys } from "@/app/(mint)/mint/holders/data/testKeys";

const data = testKeys;

export default function HoldersPage() {
  return (
    <PageContentWrapper>
      <DataTable data={data} columns={columns} />
    </PageContentWrapper>
  );
}
