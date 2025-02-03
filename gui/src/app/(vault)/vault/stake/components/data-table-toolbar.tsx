"use client";

import { Cross2Icon, PlusIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableRefresh } from "./data-table-refresh";

import { statuses, types } from "../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { AccountsMerge } from "@/app/(vault)/vault/stake/components/accounts-merge";
import { TicketsClaim } from "@/app/(vault)/vault/stake/components/tickets-claim";
import { AccountsClose } from "@/app/(vault)/vault/stake/components/accounts-close";
import * as React from "react";

interface AccountRow {
  type: string;
  status: string;
  validator?: string;
}

interface DataTableToolbarProps<TData extends AccountRow> {
  table: Table<TData>;
  onOpenSheet: () => void; // Add this prop
}

export function DataTableToolbar<TData extends AccountRow>({
  table,
  onOpenSheet, // Destructure the prop here
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  // Get the selected rows
  const selectedRows = table
    .getSelectedRowModel()
    .rows.map((row) => row.original);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Button
          variant="default"
          size="sm"
          className="h-8"
          onClick={onOpenSheet} // Trigger the Sheet opening
        >
          <PlusIcon className="mr-2" />
          Stake
        </Button>

        <Input
          placeholder="Filter tickets and stakes ..."
          value={
            (table.getColumn("publicKey")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("publicKey")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("type") && (
          <DataTableFacetedFilter
            column={table.getColumn("type")}
            title="Type"
            options={types}
          />
        )}
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8"
          >
            <Cross2Icon className="h-4 w-4" />
          </Button>
        )}
      </div>
      <TicketsClaim selectedRows={selectedRows} />
      <AccountsClose selectedRows={selectedRows} />
      <AccountsMerge selectedRows={selectedRows} />
      <DataTableRefresh table={table} />
    </div>
  );
}
