"use client";

import React, { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Product } from "../data/productSchema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { statuses } from "../data/data";
import Sparkle from "../../../../utils/Sparkle";
import { Skeleton } from "@/components/ui/skeleton";

// Function to generate a random width within a range
const randomWidth = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// Component for variable width skeleton
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

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "imageKey",
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => (
      <div className="flex items-center justify-center w-8 h-8">
        {row.original.id.startsWith("skeleton-") ? (
          <Skeleton className="h-8 w-8" />
        ) : (
          <Sparkle address={row.getValue("imageKey")} size={32} />
        )}
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
      <div className="w-[150px]">
        {row.original.id.startsWith("skeleton-") ? (
          <VariableWidthSkeleton minWidth={100} maxWidth={150} height={20} />
        ) : (
          <div className="truncate">{row.getValue("name")}</div>
        )}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "symbol",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Symbol" />
    ),
    cell: ({ row }) => (
      <div className="w-[80px]">
        {row.original.id.startsWith("skeleton-") ? (
          <VariableWidthSkeleton minWidth={40} maxWidth={80} height={20} />
        ) : (
          <div className="truncate">{row.getValue("symbol")}</div>
        )}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "baseAsset",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Base Asset" />
    ),
    cell: ({ row }) => (
      <div className="w-[100px]">
        {row.original.id.startsWith("skeleton-") ? (
          <VariableWidthSkeleton minWidth={60} maxWidth={100} height={24} />
        ) : (
          <Badge variant="outline" className="rounded-none">
            {row.getValue("baseAsset")}
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "inception",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Inception" />
    ),
    cell: ({ row }) => (
      <div className="w-[120px]">
        {row.original.id.startsWith("skeleton-") ? (
          <VariableWidthSkeleton minWidth={80} maxWidth={120} height={20} />
        ) : (
          <div className="truncate">{row.getValue("inception")}</div>
        )}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <div className="w-[100px]">
        {row.original.id.startsWith("skeleton-") ? (
          <VariableWidthSkeleton minWidth={60} maxWidth={100} height={20} />
        ) : (
          <div className="truncate font-medium">
            {
              statuses.find((status) => status.value === row.original.status)
                ?.label
            }
          </div>
        )}
      </div>
    ),
  },
  // {
  //   id: "actions",
  //   cell: ({ row }) => <DataTableRowActions row={row} />,
  // },
];
