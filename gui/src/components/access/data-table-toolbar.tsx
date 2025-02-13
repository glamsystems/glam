"use client";

import { BN } from "@coral-xyz/anchor";
import { Cross2Icon, PlusIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableRefresh } from "./data-table-refresh";
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
import { useState, useRef } from "react";
import { TreeNodeData } from "@/components/CustomTree";
import { toast } from "@/components/ui/use-toast";
import { PublicKey } from "@solana/web3.js";
import { DelegateAcl, useGlam } from "@glamsystems/glam-sdk/react";
import { ExplorerLink } from "@/components/ExplorerLink";
import { parseTxError } from "@/lib/error";
import { usePubkeyLabels } from "@/hooks/usePubkeyLabels";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  treeDataPermissions: TreeNodeData;
  onSuccess?: () => void;
}

export function DataTableToolbar<TData>({
  table,
  treeDataPermissions,
  onSuccess,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [publicKey, setPublicKey] = useState("");
  const [label, setLabel] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [treeData, setTreeData] = useState<TreeNodeData>(treeDataPermissions);

  const { updateLabel } = usePubkeyLabels();
  const { glamClient, activeGlamState, refresh } = useGlam();

  const toggleExpandCollapse = () => {
    setIsExpanded(!isExpanded);
  };

  const flatPermissions =
    treeDataPermissions.children?.flatMap(
      (lvl1: any) =>
        lvl1.children?.map((node: any) => ({
          label: node.id,
          value: node.id,
        })) || [],
    ) || [];

  const handleAddKey = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

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
      new DelegateAcl({
        pubkey,
        // @ts-ignore
        permissions: permissions.map((p) => ({ [p!]: {} })),
        expiresAt: new BN(0),
      }),
    ];

    try {
      const txSig = await glamClient.state.upsertDelegateAcls(
        activeGlamState!.pubkey,
        delegateAcls,
      );

      // Save the label if provided
      if (label) {
        updateLabel(publicKey, label);
      }

      toast({
        title: "A new delegate key was added",
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });

      // Reset form and close sheet
      setPublicKey("");
      setLabel("");
      setTreeData(treeDataPermissions);
      closeButtonRef.current?.click();

      onSuccess?.();
    } catch (e) {
      toast({
        title: "Failed to add delegate key",
        description: parseTxError(e),
        variant: "destructive",
      });
    }
  };

  const handleSheetClose = () => {
    setPublicKey("");
    setLabel("");
    setTreeData(treeDataPermissions);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Sheet onOpenChange={handleSheetClose}>
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
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Enter a label"
                  className="col-span-3"
                />
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
              <div className="col-span-3 max-h-[50vh] overflow-y-auto">
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
              <SheetClose ref={closeButtonRef} className="hidden" />
              <Button type="submit" onClick={handleAddKey}>
                Add Key
              </Button>
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
            options={flatPermissions}
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
      <DataTableRefresh onClick={refresh} table={table} />
    </div>
  );
}
