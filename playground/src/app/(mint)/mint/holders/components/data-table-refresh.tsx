"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

interface DataTableRefreshProps<TData> {
  table: Table<TData>;
}

export function DataTableRefresh<TData>({
  table,
}: DataTableRefreshProps<TData>) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="ml-auto hidden h-8 lg:flex"
    >
      <ReloadIcon className="h-4 w-4" />
    </Button>
  );
}
