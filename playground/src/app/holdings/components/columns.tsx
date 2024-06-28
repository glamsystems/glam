"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";

import { Holding } from "../data/holdingSchema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { locations } from "../data/data";

export const columns: ColumnDef<Holding>[] = [
  {
    accessorKey: "asset",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Asset" />
    ),
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("asset")}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => {
      const location = locations.find(
        (location) => location.value === row.original.location
      );

      return (
        <div className="flex space-x-2">
          {location && <Badge variant="outline">{location.label}</Badge>}
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("title")}
          </span>
        </div>
      );
    },
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
