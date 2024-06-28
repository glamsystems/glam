"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React from "react";
import { testProducts } from "./data/testProducts"

export default function Products() {
  return (
    <div className="flex w-2/3 mt-16 self-center">
      <DataTable data={testProducts} columns={columns} />
    </div>
  );
}
