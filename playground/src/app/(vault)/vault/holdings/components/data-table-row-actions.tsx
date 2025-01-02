"use client";

import { BN } from "@coral-xyz/anchor";
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
import TruncateAddress from "@/utils/TruncateAddress";
import { useState } from "react";
import {
  ArrowLeftRight,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  X,
} from "lucide-react";
import { useGlam } from "@glam/anchor/react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "@/components/ui/use-toast";
import { ExplorerLink } from "@/components/ExplorerLink";
import { parseTxError } from "@/lib/error";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getPriorityFeeMicroLamports } from "@/app/(shared)/settings/priorityfee";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const holding = holdingSchema.parse(row.original);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const { glamClient, activeFund, treasury, refresh } = useGlam();

  const copyToClipboard = (
    e: React.MouseEvent,
    address: string,
    type: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(address).then(() => {
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2000);
    });
  };

  const closeAta = async (ata: string) => {
    if (!activeFund?.pubkey || !glamClient) {
      return;
    }

    try {
      const txId = await glamClient.fund.closeTokenAccounts(activeFund.pubkey, [
        new PublicKey(ata),
      ]);
      toast({
        title: `Closed token account`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
      await refresh();
    } catch (error: any) {
      toast({
        title: "Failed to close token account",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
  };

  const unstake = async (mint: string, amount: BN) => {
    if (!activeFund?.pubkey || !glamClient) {
      return;
    }

    try {
      const txId = await glamClient.staking.unstake(
        activeFund.pubkey,
        new PublicKey(mint),
        amount,
        { getPriorityFeeMicroLamports },
      );
      toast({
        title: `Unstake success`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
      await refresh();
    } catch (error: any) {
      toast({
        title: "Failed to unstake (stake pool)",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
  };

  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          hidden={holding.location === "drift"}
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {holding.location === "vault" && holding.symbol !== "SOL" && (
          <>
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
          </>
        )}

        {holding.location === "vault" && holding.balance > 0 && (
          <>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={async (e) => {
                router.push("/vault/trade");
              }}
            >
              Swap
              <DropdownMenuShortcut>
                <ArrowLeftRight className="h-4 w-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}

        {holding.location === "vault" && holding.balance > 0 && holding.lst && (
          <>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={async (e) => {
                await unstake(
                  holding.mint,
                  new BN(holding.balance * 10 ** holding.decimals),
                );
              }}
            >
              Unstake all
              <DropdownMenuShortcut>
                <ArrowLeftRight className="h-4 w-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}

        {holding.location === "vault" && holding.balance == 0 && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={async (e) => {
              await closeAta(holding.ata);
            }}
          >
            Close
            <DropdownMenuShortcut>
              <X className="h-4 w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}

        {holding.location === "drift" && (
          <Link
            href={`https://app.drift.trade/overview/balances?authority=${treasury?.pubkey}`}
            target="_blank"
          >
            <DropdownMenuItem className="cursor-pointer">
              View on Drift
              <DropdownMenuShortcut>
                <ExternalLinkIcon className="h-4 w-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
