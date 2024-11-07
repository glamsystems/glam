"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataTableRefreshProps<TData> {
  table: Table<TData>;
  className?: string;
  onClick?: () => Promise<void>;
}

export function DataTableRefresh<TData>({
  table,
  className,
  onClick,
}: DataTableRefreshProps<TData>) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(className, "ml-auto hidden h-8 lg:flex")}
      onClick={onClick}
    >
      <ReloadIcon className="h-4 w-4" />
    </Button>
  );
}
