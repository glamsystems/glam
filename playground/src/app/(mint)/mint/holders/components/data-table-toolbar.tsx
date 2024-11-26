"use client";

import { Cross2Icon, DownloadIcon, PlusIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableRefresh } from "./data-table-refresh";

import { tag } from "../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import ToolbarTree from "@/components/ToolbarTree";
import * as React from "react";
import { useCallback, useState } from "react";
import { TreeNodeData } from "@/components/CustomTree";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpandCollapse = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCheckedItemsChange = useCallback(
    (newCheckedItems: Record<string, boolean>) => {
      setCheckedItems(newCheckedItems);
    },
    []
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="default" size="sm" className="h-8">
              <PlusIcon className="mr-2" />
              Add Account
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-12 sm:max-w-none w-1/2">
            <SheetHeader>
              <SheetTitle>Add Account</SheetTitle>
              <SheetDescription>
                Add a new account to the allowlist.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="label" className="text-right">
                  Label
                </Label>
                <Input id="label" value="" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Public key
                </Label>
                <Input
                  id="publicKey"
                  placeholder="Publ1cK3y4cc355R1gh75KqM7VxWzeA9cUjfP2y"
                  className="col-span-3"
                />
              </div>
            </div>
            <SheetFooter className="mt-4">
              <SheetClose asChild>
                <Button type="submit">Add Account</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Input
          placeholder="Search account..."
          value={(table.getColumn("pubkey")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("pubkey")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("tags") && (
          <DataTableFacetedFilter
            column={table.getColumn("tags")}
            title="Access"
            options={tag}
          />
        )}
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
      </div>
      <DataTableRefresh table={table} />
    </div>
  );
}
