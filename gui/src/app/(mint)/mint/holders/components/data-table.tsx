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
import { columns as defaultColumns, HoldersData } from "./columns"; // Import columns from columns.tsx
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
import { useGlam } from "@glamsystems/glam-sdk/react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "@/components/ui/use-toast";
import { ExplorerLink } from "@/components/ExplorerLink";
import { parseTxError } from "@/lib/error";

interface DataTableProps<TData extends HoldersData> {
  columns?: ColumnDef<TData>[];
  data: TData[];
}

export function DataTable<TData extends HoldersData>({
  columns = defaultColumns as ColumnDef<TData>[],
  data,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const { glamClient, activeGlamState } = useGlam();

  const thawOrFreeAccount = async (ata: string, frozen: boolean) => {
    if (!activeGlamState?.pubkey || !glamClient) {
      return;
    }

    const pubkey = new PublicKey(ata);
    try {
      const txSig = await glamClient.mint.setTokenAccountsStates(
        activeGlamState.pubkey,
        0,
        [pubkey],
        frozen,
      );
      toast({
        title: `Successfully ${frozen ? "froze" : "unfroze"} token account`,
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });
    } catch (e) {
      toast({
        title: `Failed to ${frozen ? "freeze" : "unfreeze"} token account`,
        description: parseTxError(e),
        variant: "destructive",
      });
    }
  };

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

  return (
    <div className="space-y-4 w-full">
      <DataTableToolbar table={table} />
      <div className="border">
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
                            header.getContext(),
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
                            cell.getContext(),
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
                      <SheetTitle>Edit Account</SheetTitle>
                      <SheetDescription>
                        Update the label or freeze this account.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="label" className="text-right">
                          Label
                        </Label>
                        <Input
                          id="label"
                          value={row.original.label}
                          className="col-span-3"
                          disabled
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="pubKey"
                          className="text-right text-muted-foreground"
                        >
                          Holder Public Key
                        </Label>
                        <Input
                          id="pubKey"
                          value={row.original.pubkey}
                          placeholder="GLAMvRgo7cHBPjQGf8UaVnsD6TUDjq16dEUuDPAPLjyJ"
                          className="col-span-3"
                          disabled
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="pubKey"
                          className="text-right text-muted-foreground"
                        >
                          Token Account
                        </Label>
                        <Input
                          id="pubKey"
                          value={row.original.ata}
                          placeholder="GLAMvRgo7cHBPjQGf8UaVnsD6TUDjq16dEUuDPAPLjyJ"
                          className="col-span-3"
                          disabled
                        />
                      </div>
                    </div>

                    <SheetFooter className="mt-4">
                      <Button
                        variant="outline"
                        className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                      >
                        Delete Account
                      </Button>
                      <SheetClose asChild>
                        <Button
                          variant="outline"
                          className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            thawOrFreeAccount(
                              row.original.ata,
                              !row.original.frozen,
                            );
                          }}
                        >
                          {row.original.frozen
                            ? "Thaw Account"
                            : "Freeze Account"}
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button type="submit">Update Account</Button>
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
      {/*<DataTablePagination table={table} />*/}
    </div>
  );
}
