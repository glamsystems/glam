"use client";

import { Cross2Icon, PlusIcon } from "@radix-ui/react-icons";
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
import ToolbarTree from "@/components/ToolbarTree";
import * as React from "react";
import { useState } from "react";
import { TreeNodeData } from "@/components/CustomTree";
import { mintPermissions, treeDataPermissions } from "../data/permissions";
import { toast } from "@/components/ui/use-toast";
import { PublicKey } from "@solana/web3.js";
import { useGlam } from "@glam/anchor/react";
import { ExplorerLink } from "@/components/ExplorerLink";
import { parseTxError } from "@/lib/error";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const [publicKey, setPublicKey] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [treeData, setTreeData] = useState<TreeNodeData>(treeDataPermissions);

  const toggleExpandCollapse = () => {
    setIsExpanded(!isExpanded);
  };
  const { glamClient, fund: fundPDA } = useGlam();

  const handleAddKey = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    console.log("Add key with permissions:", treeData);
    const permissions = treeData.children
      ?.filter((node) => node.checked)
      .map((node) => node.id);

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

    console.log(permissions.map((p) => ({ [p]: {} })));

    const delegateAcls = [
      { pubkey, permissions: permissions.map((p) => ({ [p]: {} })) },
    ];
    try {
      const txSig = await glamClient.upsertDelegateAcls(fundPDA!, delegateAcls);
      toast({
        title: "A new delegate key was added",
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });
    } catch (e) {
      toast({
        title: "A new delegate key was added",
        description: parseTxError(e),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="default" size="sm" className="h-8">
              <PlusIcon className="mr-2" />
              Add Key
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-12 sm:max-w-none w-1/2">
            <SheetHeader>
              <SheetTitle>Add Key</SheetTitle>
              <SheetDescription>
                Add a new key with access rights.
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
                <Label htmlFor="pubkey" className="text-right">
                  Public key
                </Label>
                <Input
                  id="pubkey"
                  placeholder="Publ1cK3y4cc355R1gh75KqM7VxWzeA9cUjfP2y"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="col-span-3"
                />
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
                  setTreeData={setTreeData}
                  onCheckedItemsChange={() => {}}
                />
              </div>
            </div>
            <SheetFooter className="mt-4">
              <SheetClose asChild>
                <Button type="submit" onClick={handleAddKey}>
                  Add Key
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Input
          placeholder="Filter keys..."
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
            options={mintPermissions}
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
