"use client";

import { DotsHorizontalIcon, ResetIcon, CardStackMinusIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PublicKey } from "@solana/web3.js";
import { ticketOrStakeSchema } from "../data/schema";
import { useGlam } from "@glam/anchor/react";
import { toast } from "@/components/ui/use-toast";
import { ExplorerLink } from "@/components/ExplorerLink";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
                                             row,
                                           }: DataTableRowActionsProps<TData>) {
  const ticketOrStake = ticketOrStakeSchema.parse(row.original);

  // Determine the states for claimable and closable
  const isClaimable = ticketOrStake.status === "claimable";
  const isClosable = ticketOrStake.status === "inactive";
  const isPendingOrDeactivating = ticketOrStake.status === "deactivating";

  const { glamClient, fund: fundPDA } = useGlam();

  const handleClaim = async () => {
    if (!fundPDA) {
      console.error("No fund selected");
      return;
    }

    try {
      const ticketPublicKey = new PublicKey(ticketOrStake.publicKey);
      console.log("Deactivating stake account:", ticketPublicKey.toBase58());

      const txId = await glamClient.staking.deactivateStakeAccounts(fundPDA, [
        ticketPublicKey,
      ]);

      toast({
        title: "Claim Successful",
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error) {
      console.error("Failed to claim:", error);

      toast({
        title: "Claim Failed",
        description: "An error occurred while claiming.",
        variant: "destructive",
      });
    }
  };

  const handleClose = async () => {
    if (!fundPDA) {
      console.error("No fund selected");
      return;
    }

    try {
      const accountPublicKey = new PublicKey(ticketOrStake.publicKey);
      console.log("Closing stake account:", accountPublicKey.toBase58());

      const txId = await glamClient.staking.deactivateStakeAccounts(fundPDA, [
        accountPublicKey,
      ]);

      toast({
        title: "Close Successful",
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error) {
      console.error("Failed to close:", error);

      toast({
        title: "Close Failed",
        description: "An error occurred while closing.",
        variant: "destructive",
      });
    }
  };

  // Conditional rendering based on the type and status
  if (ticketOrStake.type === "ticket") {
    // Actions for tickets
    return (
      <Button
        variant={isClaimable ? "default" : "secondary"}
        disabled={!isClaimable}
        onClick={handleClaim}
        className="flex h-8 w-8 p-0"
      >
        <ResetIcon className="h-4 w-4" />
        <span className="sr-only">Claim</span>
      </Button>
    );
  } else if (ticketOrStake.type === "account" && (isClosable || isPendingOrDeactivating)) {
    // Actions for closable (inactive) or deactivating accounts
    return (
      <Button
        variant={isClosable ? "default" : "secondary"}
        disabled={!isClosable}
        onClick={handleClose}
        className="flex h-8 w-8 p-0"
      >
        <CardStackMinusIcon className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
    );
  } else if (ticketOrStake.type === "account") {
    // Actions for active accounts
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem>Deactivate</DropdownMenuItem>
          <DropdownMenuItem>Redelegate</DropdownMenuItem>
          <DropdownMenuItem>Split</DropdownMenuItem>
          <DropdownMenuItem>Authorize Stake Authority</DropdownMenuItem>
          <DropdownMenuItem>Stakepool Deposit</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  } else {
    return null; // Handle other types or conditions as needed
  }
}
