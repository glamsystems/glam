"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";

import { Asset } from "../data/assetSchema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

export const columns: ColumnDef<Asset>[] = [
  {
    accessorKey: "address",
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => (
      <img
        src={`https://api.glam.systems/image/${row.getValue("address")}.svg`}
        className="min-w-8 min-h-8 max-h-8 max-w-8"
        alt="Sparkle"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <div className="w-[100px] truncate">{row.getValue("name")}</div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "symbol",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Symbol" />
    ),
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("symbol")}</div>,
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "decimals",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Decimals" />
    ),
    cell: ({ row }) => (
      <div className="w-[80px]">{row.getValue("decimals")}</div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
