"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { columns as defaultColumns } from "./columns"; // Import columns from columns.tsx
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TreeNodeData } from "@/components/CustomTree";
import { DownloadIcon } from "@radix-ui/react-icons";
import ToolbarTree from "@/components/ToolbarTree";
import { useCallback, useState } from "react";

// Define the type that TData should extend
export interface KeyData {
  pubkey: string;
  label: string;
  tags: string[];
}

// Update the DataTableProps to ensure TData extends KeyData
interface DataTableProps<TData extends KeyData> {
  columns?: ColumnDef<TData>[];
  data: TData[];
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
              description:
                "Deposit stake accounts into the Sanctum Stake Pool.",
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
              description:
                "Withdraw stake accounts from the Sanctum Stake Pool.",
              icon: <DownloadIcon className="w-4 h-4" />,
            },
          ],
        },
      ],
    },
  ],
};

export function DataTable<TData extends KeyData>({
  columns = defaultColumns as ColumnDef<TData>[], // Type cast to match the generic types
  data,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

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
    <div className="space-y-4 w-full">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <Sheet key={row.id}>
                  {/* Add key prop here */}
                  <SheetTrigger asChild>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </SheetTrigger>
                  <SheetContent
                    side="right"
                    className="p-12 sm:max-w-none w-1/2"
                  >
                    <SheetHeader>
                      <SheetTitle>Modify Key</SheetTitle>
                      <SheetDescription>
                        Modify the access rights of the public key.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="label" className="text-right">
                          Label
                        </Label>
                        <Input id="label" value="Jim" className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="pubKey"
                          className="text-right text-muted-foreground"
                        >
                          Public Key
                        </Label>
                        <Input
                          id="pubKey"
                          value=""
                          placeholder="GLAMvRgo7cHBPjQGf8UaVnsD6TUDjq16dEUuDPAPLjyJ"
                          className="col-span-3"
                          disabled
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-spar-3 text-right pt-1">
                        <Label htmlFor="accessRights" className="text-right">
                          Access Rights
                        </Label>
                      </div>
                      <div className="col-span-3">
                        <ToolbarTree
                          treeData={treeData}
                          setTreeData={() => {}}
                          isExpanded={isExpanded}
                          toggleExpandCollapse={toggleExpandCollapse}
                          handleCheckedItemsChange={handleCheckedItemsChange}
                        />
                      </div>
                    </div>
                    <SheetFooter className="mt-4">
                      <Button
                        variant="outline"
                        className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                      >
                        Delete Key
                      </Button>
                      <SheetClose asChild>
                        <Button type="submit">Modify Key</Button>
                      </SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
