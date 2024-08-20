"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React from "react";
import { testKeys } from "./data/testKeys";

export default function Access() {
  return (
    <div className="flex w-2/3 mt-16 self-center">
      <DataTable data={testKeys} columns={columns} />
    </div>
  );
}
