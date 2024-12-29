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
import ToolbarTree from "@/components/ToolbarTree";
import { useRef, useState } from "react";
import {
  vaultTreeDataPermissions,
  mintTreeDataPermissions,
} from "./data/permissions";
import { toast } from "../ui/use-toast";
import { useGlam } from "@glam/anchor/react";
import { ExplorerLink } from "@/components/ExplorerLink";
import { parseTxError } from "@/lib/error";
import { PublicKey } from "@solana/web3.js";
import { KeyData } from "./columns";
import { useKeyLabels } from "@/hooks/useKeyLabels";

interface DataTableProps<TData extends KeyData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  perms: "vault" | "mint" | "all";
  onSuccess?: () => void;
}

export function DataTable<TData extends KeyData>({
  columns,
  data,
  perms,
  onSuccess,
}: DataTableProps<TData>) {
  // Permissions
  const allChildren = (vaultTreeDataPermissions.children || []).concat(
    mintTreeDataPermissions.children || [],
  );
  let treeDataPermissions = { ...vaultTreeDataPermissions };
  if (perms === "mint") {
    treeDataPermissions = mintTreeDataPermissions;
  } else if (perms === "all") {
    treeDataPermissions.children = allChildren;
  }

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [activeRow, setActiveRow] = useState<string | null>(null);

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

  const [isExpanded, setIsExpanded] = useState(true);
  const [treeData, setTreeData] = useState<TreeNodeData>(treeDataPermissions);
  const { updateLabel } = useKeyLabels();
  const [labelInput, setLabelInput] = useState("");

  const toggleExpandCollapse = () => {
    setIsExpanded(!isExpanded);
  };

  const { glamClient, activeFund } = useGlam();

  // Helper function to reset states
  const resetStates = () => {
    setActiveRow(null);
    setTreeData({ ...treeDataPermissions });
    setLabelInput("");
  };

  // Helper function to initialize tree with permissions
  const initializeTreeWithPermissions = (currentPermissions: string[]) => {
    const newTreeData = { ...treeDataPermissions };

    const initializeNode = (node: TreeNodeData) => {
      if (node.children) {
        node.children.forEach(initializeNode);
      } else if (node.id) {
        node.checked = currentPermissions.includes(node.id);
      }
    };

    initializeNode(newTreeData);
    return newTreeData;
  };

  const handleModifyKey = async (
    event: React.MouseEvent<HTMLButtonElement>,
    publicKey: string,
  ) => {
    event.preventDefault();

    if (labelInput) {
      updateLabel(publicKey, labelInput);
    }

    const permissions = treeData.children?.flatMap((lvl1) =>
      lvl1.children?.filter((node) => node.checked).map((node) => node.id),
    );

    if (!permissions || permissions.length === 0) {
      toast({
        title: "No permissions selected",
        description: "Please select at least one permission.",
        variant: "destructive",
      });
      return;
    }

    let pubkey;
    try {
      pubkey = new PublicKey(publicKey);
    } catch (e) {
      toast({
        title: "Invalid public key",
        description: "Please enter a valid public key.",
        variant: "destructive",
      });
      return;
    }

    const delegateAcls = [
      //@ts-ignore
      { pubkey, permissions: permissions.map((p) => ({ [p]: {} })) },
    ];

    try {
      // @ts-ignore
      const txSig = await glamClient.fund.upsertDelegateAcls(
        activeFund!.pubkey,
        delegateAcls,
      );

      resetStates();

      toast({
        title: "Delegate key permissions updated",
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });

      onSuccess?.();
    } catch (e) {
      toast({
        title: "Failed to update delegate key",
        description: parseTxError(e),
        variant: "destructive",
      });
    }
  };

  const handleDeleteKey = async (
    event: React.MouseEvent<HTMLButtonElement>,
    publicKey: string,
  ) => {
    event.preventDefault();

    let pubkey;
    try {
      pubkey = new PublicKey(publicKey);
    } catch (e) {
      toast({
        title: "Invalid public key",
        description: "Please enter a valid public key.",
        variant: "destructive",
      });
      return;
    }

    try {
      const txSig = await glamClient.fund.deleteDelegateAcls(
        activeFund!.pubkey,
        [pubkey],
      );

      resetStates();

      toast({
        title: "Delegate key deleted",
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });

      onSuccess?.();
    } catch (e) {
      toast({
        title: "Failed to delete delegate key",
        description: parseTxError(e),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 w-full">
      <DataTableToolbar
        table={table}
        treeDataPermissions={treeDataPermissions}
        onSuccess={onSuccess}
      />
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
                <Sheet
                  key={row.id}
                  open={activeRow === row.original.pubkey}
                  onOpenChange={(open) => {
                    if (open) {
                      setActiveRow(row.original.pubkey);
                      const currentPermissions = row.original.tags;
                      setTreeData(
                        initializeTreeWithPermissions(currentPermissions),
                      );
                      setLabelInput(row.original.label);
                    } else {
                      resetStates();
                    }
                  }}
                >
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
                    onOpenAutoFocus={(e) => {
                      e.preventDefault();
                    }}
                    role="dialog"
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
                        <Input
                          id="label"
                          placeholder="Label"
                          className="col-span-3"
                          value={labelInput}
                          onChange={(e) => setLabelInput(e.target.value)}
                          autoFocus={false}
                          tabIndex={-1}
                        />
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
                          value={row.original.pubkey}
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
                      <div className="col-span-3 max-h-[50vh] overflow-y-auto">
                        <ToolbarTree
                          treeData={treeData}
                          setTreeData={setTreeData}
                          isExpanded={isExpanded}
                          toggleExpandCollapse={toggleExpandCollapse}
                          onCheckedItemsChange={() => {}}
                        />
                      </div>
                    </div>
                    <SheetFooter className="mt-4">
                      <Button
                        variant="outline"
                        className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                        onClick={(e) => handleDeleteKey(e, row.original.pubkey)}
                      >
                        Delete Key
                      </Button>
                      <SheetClose asChild>
                        <Button
                          type="submit"
                          onClick={(e) =>
                            handleModifyKey(e, row.original.pubkey)
                          }
                        >
                          Modify Key
                        </Button>
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
