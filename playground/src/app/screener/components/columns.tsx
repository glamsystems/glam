"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Product } from "../data/productSchema"; // Ensure correct import path
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { statuses } from "../data/data";
import Sparkle from "../../../utils/Sparkle";

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "address",
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => (
      <div>
  <Sparkle address={row.getValue('address')} size={32}/>
  {/*<img*/}
  {/*      src={`https://api.glam.systems/image/${row.getValue("address")}.svg`}*/}
  {/*      className="min-w-8 min-h-8 max-h-8 max-w-8"*/}
  {/*      alt="Sparkle"*/}
  {/*    />*/}
      </div>
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
    enableSorting: false,
    enableHiding: false,
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
    accessorKey: "baseAsset",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Base Asset" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <Badge variant="outline" className="rounded-none">{row.getValue("baseAsset")}</Badge>
          <span className="max-w-[500px] truncate font-medium"></span>
        </div>
      );
    },
  },
  {
    accessorKey: "inception",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Inception" />
    ),
    cell: ({ row }) => (
      <div className="w-[90px]">{row.getValue("inception")}</div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.original.status
      );

      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {status?.label}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
