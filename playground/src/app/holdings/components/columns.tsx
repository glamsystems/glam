"use client";

import {ColumnDef, Row} from "@tanstack/react-table";

import {Holding, holdingSchema} from "../data/holdingSchema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "../../../components/ui/tooltip";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export const columns: ColumnDef<Holding>[] = [
  {
    accessorKey: "logoURI",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="" />
    ),
    cell: ({ row }) => {
      const [isLoading, setIsLoading] = useState(true);
      const logoURI = row.getValue("logoURI") as string;

      useEffect(() => {
        if (logoURI) {
          const img = new Image();
          img.onload = () => setIsLoading(false);
          img.onerror = () => setIsLoading(false);
          img.src = logoURI;
        }
      }, [logoURI]);

      if (isLoading) {
        return <Skeleton className="h-6 w-6 rounded-full" />;
      }

      return <img className="h-6 w-6 rounded-full" src={logoURI} alt="Logo" />;
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "symbol",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Symbol" />
    ),
    cell: ({ row }) =>

    {
      const holding = holdingSchema.parse(row.original);
      return  <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="truncate cursor-default">{row.getValue("symbol")}</div>
          </TooltipTrigger>
          <TooltipContent side={"bottom"}>
            <p>{holding.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>;
    },
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
      <DataTableColumnHeader column={column} title="USD" />
    ),
    cell: ({ row }) => {
      const notional = parseFloat(row.getValue("notional"));
      const formatted = new Intl.NumberFormat("en-US"/*, { style: "currency", currency: "USD" }*/).format(notional);
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
