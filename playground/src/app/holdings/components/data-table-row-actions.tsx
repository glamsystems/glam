"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { holdingSchema } from "../data/holdingSchema";
import TruncateAddress from "../../../utils/TruncateAddress";
import { useState } from "react";
import { ArrowLeftRight, CheckIcon, CopyIcon, X } from "lucide-react";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const holding = holdingSchema.parse(row.original);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const copyToClipboard = (
    e: React.MouseEvent,
    address: string,
    type: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(address).then(() => {
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2000);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          disabled={holding.symbol === "SOL"}
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>Info</DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(e) => e.preventDefault()}
          onClick={(e) => copyToClipboard(e, holding.mint, "mint")}
          onMouseEnter={() => setHoveredItem("mint")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <TruncateAddress address={holding.mint} />
          <DropdownMenuShortcut>
            {copiedAddress === "mint" ? (
              <CheckIcon className="h-4 w-4" />
            ) : hoveredItem === "mint" ? (
              <CopyIcon className="h-4 w-4" />
            ) : (
              "Mint"
            )}
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(e) => e.preventDefault()}
          onClick={(e) => copyToClipboard(e, holding.ata, "ata")}
          onMouseEnter={() => setHoveredItem("ata")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <TruncateAddress address={holding.ata} />
          <DropdownMenuShortcut>
            {copiedAddress === "ata" ? (
              <CheckIcon className="h-4 w-4" />
            ) : hoveredItem === "ata" ? (
              <CopyIcon className="h-4 w-4" />
            ) : (
              "ATA"
            )}
          </DropdownMenuShortcut>
        </DropdownMenuItem>

        {holding.location === "vault" && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={(e) => {
              if (holding.balance > 0) {
                console.log("Swapping token:", holding.mint);
              } else {
                console.log("Closing ata:", holding.ata);
              }
            }}
          >
            {holding.balance > 0 ? "Swap" : "Close"}
            <DropdownMenuShortcut>
              {holding.balance > 0 ? (
                <ArrowLeftRight className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
