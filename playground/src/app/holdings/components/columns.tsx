"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { Holding, holdingSchema } from "../data/holdingSchema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import NumberFormatter from "@/utils/NumberFormatter";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

const randomWidth = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const VariableWidthSkeleton = ({
  minWidth,
  maxWidth,
  height,
}: {
  minWidth: number;
  maxWidth: number;
  height: number;
}) => {
  const [width, setWidth] = useState(minWidth);

  useEffect(() => {
    setWidth(randomWidth(minWidth, maxWidth));
  }, [minWidth, maxWidth]);

  return <Skeleton style={{ width: `${width}px`, height: `${height}px` }} />;
};

// Helper function to check if a row is a skeleton
const isSkeletonRow = (row: Row<Holding>) => {
  return (
    row.original.symbol === "" &&
    row.original.name === "" &&
    row.original.balance === 0
  );
};

export const columns: ColumnDef<Holding>[] = [
  {
    accessorKey: "logoURI",
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
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

      return (
        <div className="flex items-center justify-center w-6 h-6">
          {isLoading || isSkeletonRow(row) ? (
            <Skeleton className="h-6 w-6 rounded-full" />
          ) : (
            <img className="h-6 w-6 rounded-full" src={logoURI} alt="Logo" />
          )}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "symbol",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Symbol" />
    ),
    cell: ({ row }) => {
      return (
        <div className="w-[100px]">
          {isSkeletonRow(row) ? (
            <VariableWidthSkeleton minWidth={60} maxWidth={100} height={20} />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="truncate cursor-default">
                    {row.getValue("symbol")}
                  </div>
                </TooltipTrigger>
                <TooltipContent side={"bottom"}>
                  <p>{row.original.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "balance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Quantity" />
    ),
    cell: ({ row }) => {
      return (
        <div className="w-[80px]">
          {isSkeletonRow(row) ? (
            <VariableWidthSkeleton minWidth={40} maxWidth={80} height={20} />
          ) : (
            new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 9,
            }).format(row.getValue("balance"))
          )}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "notional",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Value" />
    ),
    cell: ({ row }) => {
      // Parse the row data using holdingSchema
      const holding = holdingSchema.parse(row.original);

      return (
        <div className="w-[80px]">
          {isSkeletonRow(row) || row.original.notional === 0 ? (
            <VariableWidthSkeleton minWidth={40} maxWidth={80} height={20} />
          ) : (
            <span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground mr-0.5">$</span>
                  </TooltipTrigger>
                  <TooltipContent side={"left"}>
                    <span className="text-muted-foreground mr-0.5">$</span>
                    <NumberFormatter
                      value={holding.price}
                      addCommas={true}
                      minDecimalPlaces={0}
                      maxDecimalPlaces={9}
                    />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <NumberFormatter
                value={holding.notional}
                addCommas={true}
                minDecimalPlaces={0}
                maxDecimalPlaces={9}
              />
            </span>
          )}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => (
      <div className="w-[100px]">
        {isSkeletonRow(row) ? (
          <VariableWidthSkeleton minWidth={60} maxWidth={100} height={24} />
        ) : (
          <Badge variant="outline" className="rounded-none">
            {(row.getValue("location") as string)?.charAt(0)?.toUpperCase() +
              (row.getValue("location") as string)?.slice(1) || "N/A"}
          </Badge>
        )}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
