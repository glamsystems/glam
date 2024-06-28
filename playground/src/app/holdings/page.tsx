"use client";

import { DataTable } from "./components/data-table";
import { columns } from "./components/columns";
import React from "react";

const holdings = [
  {
    asset: "SOL",
    location: "internal",
    balance: 1234.56789,
    notional: 14000,
  },
];

export default function Holdings() {
  return (
    <div className="flex w-2/3 mt-16 self-center">
      <DataTable data={holdings} columns={columns} />
    </div>
  );
}
