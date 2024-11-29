"use client";

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
import * as React from "react";
import { useState } from "react";
import { useGlam } from "@glam/anchor/react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "@/components/ui/use-toast";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { ExplorerLink } from "@/components/ExplorerLink";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const [label, setLabel] = useState<string>("");
  const [publicKey, setPublicKey] = useState<string>("");

  const { glamClient, fund: fundPDA } = useGlam();

  const addHolderAccount = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();

    if (!fundPDA || !glamClient) {
      return;
    }

    let pubkey;
    try {
      pubkey = new PublicKey(publicKey);
    } catch (e) {
      console.log(e);
      toast({
        title: "Invalid public key",
        description: "Please enter a valid public key.",
        variant: "destructive",
      });
      return;
    }

    try {
      const shareClassMint = glamClient.getShareClassPDA(fundPDA, 0);
      const mintTo = glamClient.getShareClassAta(pubkey, shareClassMint);
      const ixCreateAta = createAssociatedTokenAccountIdempotentInstruction(
        glamClient.getManager(),
        mintTo,
        pubkey,
        shareClassMint,
        TOKEN_2022_PROGRAM_ID
      );
      const txSig = await glamClient.program.methods
        .setTokenAccountsStates(0, true)
        .accounts({
          shareClassMint,
          fund: fundPDA,
        })
        .remainingAccounts([
          { pubkey: mintTo, isSigner: false, isWritable: true },
        ])
        .preInstructions([ixCreateAta])
        .rpc();
      toast({
        title: "New share class holder added",
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });
    } catch (e) {
      console.log(e);
    }
  };

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
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="publicKey" className="text-right">
                  Public key
                </Label>
                <Input
                  id="publicKey"
                  placeholder="Publ1cK3y4cc355R1gh75KqM7VxWzeA9cUjfP2y"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <SheetFooter className="mt-4">
              <SheetClose asChild>
                <Button type="submit" onClick={addHolderAccount}>
                  Add Account
                </Button>
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
        {table.getColumn("label") && (
          <DataTableFacetedFilter
            column={table.getColumn("label")}
            title="Label"
            options={[]}
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
