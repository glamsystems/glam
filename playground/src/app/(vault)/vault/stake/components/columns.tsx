"use client";

import React from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { types, statuses } from "../data/data";
import { TicketOrStake } from "../data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

import TruncateAddress from "@/utils/TruncateAddress";
import {
  TooltipContent,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";

const isSkeletonRow = (row: Row<TicketOrStake>) => {
  return (
    row.original.service === "" &&
    row.original.validator === "" &&
    row.original.status === ""
  );
};

export const columns: ColumnDef<TicketOrStake>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "publicKey",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => {
      return isSkeletonRow(row) ? (
        <Skeleton className="h-6 w-12" />
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <TruncateAddress
                start={3}
                end={3}
                address={row.getValue("publicKey")}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              {row.getValue("publicKey")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "lamports",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SOL" />
    ),
    cell: ({ row }) => {
      const sol = (row.getValue("lamports") as number) / LAMPORTS_PER_SOL;
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 3,
      }).format(sol);

      return isSkeletonRow(row) ? (
        <Skeleton className="h-6 w-12" />
      ) : (
        <p>{formatted}</p>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = types.find((type) => type.value === row.getValue("type"));

      return isSkeletonRow(row) ? (
        <Skeleton className="h-6 w-12" />
      ) : (
        <div className="flex space-x-2">
          {type && (
            <Badge variant="outline" className="rounded-none">
              {type.label}
            </Badge>
          )}
          <span className="max-w-[500px] truncate font-medium"></span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "validator",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Validator" />
    ),
    cell: ({ row }) => {
      return isSkeletonRow(row) ? (
        <Skeleton className="h-6 w-12" />
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <TruncateAddress
                start={3}
                end={3}
                address={row.getValue("validator")}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              {row.getValue("validator")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = statuses.find(
        (status) => status.value === row.getValue("status"),
      );
      const { resolvedTheme } = useTheme();
      const colorClass =
        resolvedTheme === "dark"
          ? status?.darkModeColor
          : status?.lightModeColor;

      return !status || isSkeletonRow(row) ? (
        <Skeleton className="h-6 w-12" />
      ) : (
        <div className="flex w-[120px] items-center">
          {status.icon && (
            <status.icon className={`mr-2 h-4 w-4 ${colorClass}`} />
          )}
          <span className={colorClass}>{status.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: true,
  },
  {
    id: "actions",
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      return isSkeletonRow(row) ? (
        <Skeleton className="h-6 w-6" />
      ) : (
        <DataTableRowActions row={row} />
      );
    },
  },
];
