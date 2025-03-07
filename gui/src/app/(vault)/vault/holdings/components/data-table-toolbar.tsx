"use client";

import {
  Cross2Icon,
  MixerHorizontalIcon,
  OpenInNewWindowIcon,
  ExternalLinkIcon,
  LoopIcon,
} from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableRefresh } from "./data-table-refresh";

import { useGlam } from "@glamsystems/glam-sdk/react";
import { Label } from "@/components/ui/label";
import { QrCodeIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import React from "react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  showZeroBalances: boolean;
  setShowZeroBalances: (showZeroBalances: boolean) => void;
  onOpenDetailsSheet: () => void;
  onOpenDepositSheet: () => void;
  onOpenWithdrawSheet: () => void;
  onOpenTransferSheet: () => void;
}

export function DataTableToolbar<TData>({
  table,
  showZeroBalances,
  setShowZeroBalances,
  onOpenDetailsSheet,
  onOpenDepositSheet,
  onOpenWithdrawSheet,
  onOpenTransferSheet,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const { refresh } = useGlam();

  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex flex-1 items-center space-x-2">
        <Button
          variant="default"
          size="sm"
          className="h-8 space-x-2"
          onClick={onOpenDetailsSheet}
        >
          <QrCodeIcon className="w-4 h-4" />
          <span className="hidden xl:block">Details</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          className="h-8 space-x-2"
          onClick={onOpenDepositSheet}
        >
          <OpenInNewWindowIcon className="w-4 h-4 transform rotate-90" />
          <span className="hidden xl:block">Deposit</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          className="h-8 space-x-2"
          onClick={onOpenWithdrawSheet}
        >
          <ExternalLinkIcon className="w-4 h-4" />
          <span className="hidden xl:block">Withdraw</span>
        </Button>
        <Button
          size="sm"
          className="h-8 space-x-2"
          onClick={onOpenTransferSheet}
        >
          <LoopIcon className="w-4 h-4" />
          <span className="hidden xl:block">Transfer</span>
        </Button>

        <Input
          placeholder="Search holdings..."
          value={(table.getColumn("symbol")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("symbol")?.setFilterValue(event.target.value)
          }
          className="h-8"
        />

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 space-x-2"
          >
            <span>Reset</span>
            <Cross2Icon className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 flex">
            <MixerHorizontalIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className={"mr-2"} align={"end"}>
          <div className="flex items-center space-x-2">
            <Switch
              defaultChecked={showZeroBalances}
              id="zero-balances"
              onCheckedChange={(checked: boolean) => {
                setShowZeroBalances(checked);
              }}
            />
            <Label htmlFor="zero-balances">Show Zero Balances</Label>
          </div>
        </PopoverContent>
      </Popover>

      <DataTableRefresh onClick={async () => await refresh()} table={table} />
    </div>
  );
}
