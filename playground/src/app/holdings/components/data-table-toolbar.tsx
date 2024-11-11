"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableRefresh } from "./data-table-refresh";

import { useGlam } from "@glam/anchor/react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  setShowZeroBalances: (showZeroBalances: boolean) => void;
}

export function DataTableToolbar<TData>({
  table,
  setShowZeroBalances,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const { refresh } = useGlam();

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search holdings..."
          value={(table.getColumn("symbol")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("symbol")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-1/2"
        />

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}

        <Checkbox
          id="zero-balances"
          onCheckedChange={(checked: boolean) => {
            setShowZeroBalances(checked);
          }}
        />
        <Label htmlFor="zero-balances">Show Zero Balances</Label>
      </div>
      <DataTableRefresh onClick={async () => await refresh()} table={table} />
    </div>
  );
}
