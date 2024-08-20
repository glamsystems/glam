"use client";

import { Cross2Icon, DownloadIcon, PlusIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableRefresh } from "./data-table-refresh";

import { tag } from "../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger
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

const treeData: TreeNodeData = {
  id: "all",
  label: "All",
  description: "",
  collapsed: false,
  children: [
    {
      id: "native",
      label: "Native",
      description: "",
      collapsed: true,
      children: [
        {
          id: "initialize_and_delegate_stake",
          label: "Initialize and delegate stake",
          description: "",
          icon: <DownloadIcon className="w-4 h-4" />,
        },
        {
          id: "deactivate_stake_accounts",
          label: "Deactivate stake accounts",
          description: "",
          icon: <DownloadIcon className="w-4 h-4" />,
        },
        {
          id: "withdraw_from_stake_accounts",
          label: "Withdraw from stake accounts",
          description: "",
          icon: <DownloadIcon className="w-4 h-4" />,
        },
      ],
    },
    {
      id: "marinade_staking",
      label: "Marinade Staking",
      description: "",
      collapsed: false,
      children: [
        {
          id: "marinade_staking_deposit",
          label: "Deposit",
          description: "",
          collapsed: true,
          children: [
            {
              id: "marinade_deposit_sol",
              label: "Deposit SOL",
              description: "Deposit SOL directly into Marinade.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "marinade_deposit_stake",
              label: "Deposit stake",
              description: "Deposit existing stake accounts into Marinade.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
        {
          id: "marinade_staking_withdraw",
          label: "Withdraw",
          description: "",
          collapsed: true,
          children: [
            {
              id: "marinade_delayed_unstake",
              label: "Delayed unstake",
              description: "Unstake SOL with a delay.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "marinade_claim_tickets",
              label: "Claim tickets",
              description: "Claim tickets after delayed unstaking.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
      ],
    },
    {
      id: "splStakePool",
      label: "SPL Stake Pool",
      description: "",
      collapsed: false,
      children: [
        {
          id: "splStakePool_deposit",
          label: "Deposit",
          description: "",
          collapsed: true,
          children: [
            {
              id: "spl_stake_pool_deposit_sol",
              label: "Deposit SOL",
              description: "Deposit SOL into the SPL Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "spl_stake_pool_deposit_stake",
              label: "Deposit stake",
              description: "Deposit stake accounts into the SPL Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
        {
          id: "splStakePool_withdraw",
          label: "Withdraw",
          description: "",
          collapsed: true,
          children: [
            {
              id: "spl_stake_pool_withdraw_sol",
              label: "Withdraw SOL",
              description: "Withdraw SOL from the SPL Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "spl_stake_pool_withdraw_stake",
              label: "Withdraw stake",
              description: "Withdraw stake accounts from the SPL Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
      ],
    },
    {
      id: "sanctumStakePool",
      label: "Sanctum Stake Pool",
      description: "",
      collapsed: false,
      children: [
        {
          id: "sanctumStakePool_deposit",
          label: "Deposit",
          description: "",
          collapsed: true,
          children: [
            {
              id: "sanctum_stake_pool_deposit_sol",
              label: "Deposit SOL",
              description: "Deposit SOL into the Sanctum Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "sanctum_stake_pool_deposit_stake",
              label: "Deposit stake",
              description: "Deposit stake accounts into the Sanctum Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
        {
          id: "sanctumStakePool_withdraw",
          label: "Withdraw",
          description: "",
          collapsed: true,
          children: [
            {
              id: "sanctum_stake_pool_withdraw_sol",
              label: "Withdraw SOL",
              description: "Withdraw SOL from the Sanctum Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
            {
              id: "sanctum_stake_pool_withdraw_stake",
              label: "Withdraw stake",
              description: "Withdraw stake accounts from the Sanctum Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
      ],
    },
  ],
};

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

          <Button
          variant="default"
          size="sm"
          className="h-8"
        >
          <PlusIcon className="mr-2"/>
          Add key
        </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-12 sm:max-w-none w-1/2">
            <SheetHeader>
              <SheetTitle>Add key</SheetTitle>
              <SheetDescription>
                Add a new key with access rights.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="label" className="text-right">
                  Label
                </Label>
                <Input id="labek" value="" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Public key
                </Label>
                <Input id="username" placeholder="Publ1cK3y4cc355R1gh75KqM7VxWzeA9cUjfP2y" className="col-span-3" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-spar-3 text-right pt-1">
                <Label htmlFor="accessRights" className="text-right">
                  Access rights
                </Label>
              </div>
              <div className="col-span-3">
                <ToolbarTree
                  treeData={treeData}
                  isExpanded={isExpanded}
                  toggleExpandCollapse={toggleExpandCollapse}
                  handleCheckedItemsChange={handleCheckedItemsChange}
                />
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button type="submit">Save changes</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Input
          placeholder="Filter keys..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
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
