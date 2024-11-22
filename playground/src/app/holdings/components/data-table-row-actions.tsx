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
import TruncateAddress from "../../../utils/TruncateAddress";
import { useState } from "react";
import { ArrowLeftRight, CheckIcon, CopyIcon, X } from "lucide-react";
import { MSOL, useGlam } from "@glam/anchor/react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "@/components/ui/use-toast";
import { ExplorerLink } from "@/components/ExplorerLink";
import { parseTxError } from "@/lib/error";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const holding = holdingSchema.parse(row.original);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const { glamClient, fund, refresh } = useGlam();

  const copyToClipboard = (
    e: React.MouseEvent,
    address: string,
    type: string
  ) => {
    console.log("row:", holding);
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(address).then(() => {
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2000);
    });
  };

  const closeAta = async (ata: string) => {
    if (!fund) {
      return;
    }

    try {
      const txId = await glamClient.fund.closeTokenAccounts(fund, [
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

  const marinadeDelayedUnstake = async (amount: number) => {
    if (!fund) {
      return;
    }

    console.log("fund", fund.toBase58(), "delayed unstake amount", amount);

    try {
      const txId = await glamClient.marinade.delayedUnstake(
        fund,
        new BN(amount)
      );
      toast({
        title: `Unstake success`,
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
      await refresh();
    } catch (error: any) {
      toast({
        title: "Failed to unstake (marinade)",
        description: parseTxError(error),
        variant: "destructive",
      });
    }
  };

  const unstake = async (mint: string, amount: number) => {
    const assetMeta = glamClient.getAssetMeta(mint);

    if (!fund || !assetMeta || !assetMeta.stateAccount) {
      return;
    }

    console.log(
      "fund",
      fund.toBase58(),
      "pool",
      assetMeta.stateAccount.toBase58(),
      "unstake amount",
      amount
    );

    try {
      const txId = await glamClient.staking.stakePoolWithdrawStake(
        fund,
        assetMeta.stateAccount,
        new BN(amount)
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          disabled={holding.symbol === "SOL" || holding.location === "drift"}
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

        {holding.location === "vault" && holding.balance > 0 && (
          <>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={async (e) => {
                // TODO: redirect to trade page
                console.log("Swapping token:", holding.mint);
              }}
            >
              Swap
              <DropdownMenuShortcut>
                <ArrowLeftRight className="h-4 w-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={async (e) => {
                if (holding.mint === MSOL.toBase58()) {
                  await marinadeDelayedUnstake(
                    holding.balance * 10 ** holding.decimals
                  );
                } else {
                  await unstake(
                    holding.mint,
                    holding.balance * 10 ** holding.decimals
                  );
                }
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
              console.log("Closing token:", holding.mint);
              await closeAta(holding.ata);
            }}
          >
            Close
            <DropdownMenuShortcut>
              <X className="h-4 w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
