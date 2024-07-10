"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";

import { Holding } from "../data/holdingSchema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { locations } from "../data/data";
import TruncateAddress from "../../../utils/TruncateAddress";

export const columns: ColumnDef<Holding>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Asset" />
    ),
    cell: ({ row }) => <div className="w-[100px] truncate">{row.getValue("name")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "symbol",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Symbol" />
    ),
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("symbol")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "mint",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Mint" />
    ),
    cell: ({ row }) => <div className="w-[80px]"><TruncateAddress address={row.getValue("mint")}/></div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "ata",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ATA" />
    ),
    cell: ({ row }) => <div className="w-[80px]"><TruncateAddress address={row.getValue("ata")}/></div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "balance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Balance" />
    ),
    cell: ({ row }) => {
      const balance = parseFloat(row.getValue("balance"));
      const formatted = new Intl.NumberFormat("en-US").format(balance);
      return <div className="w-[80px]">{formatted}</div>;
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "notional",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Notional" />
    ),
    cell: ({ row }) => {
      const notional = parseFloat(row.getValue("notional"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(notional);
      return <div className="w-[80px]">{formatted}</div>;
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
