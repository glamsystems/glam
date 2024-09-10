"use client";

import {
  DotsHorizontalIcon,
  ResetIcon,
  CardStackMinusIcon,
} from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const handleClaimTicket = async () => {
    if (!fundPDA) {
      console.error("No fund selected");
      return;
    }

    try {
      const ticketPublicKey = new PublicKey(ticketOrStake.publicKey);
      console.log("Claim marinade ticket:", ticketPublicKey.toBase58());

      const txId = await glamClient.marinade.claimTickets(fundPDA, [
        ticketPublicKey,
      ]);

      toast({
        title: "Marinade ticket claimed successfully",
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error) {
      console.error("Failed to claim marinade ticket:", error);

      toast({
        title: "Failed to claim marinade ticket",
        description: "An error occurred while claiming.",
        variant: "destructive",
      });
    }
  };

  const handlDeactivateStake = async () => {
    if (!fundPDA) {
      console.error("No fund selected");
      return;
    }

    try {
      const accountPublicKey = new PublicKey(ticketOrStake.publicKey);
      console.log("Deactivate stake account:", accountPublicKey.toBase58());

      const txId = await glamClient.staking.deactivateStakeAccounts(fundPDA, [
        accountPublicKey,
      ]);

      toast({
        title: "Stake deactivated successfully",
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error) {
      console.error("Failed to deactivate stake:", error);

      toast({
        title: "Failed to deactivate stake",
        description: "An error occurred while deactivating stake.",
        variant: "destructive",
      });
    }
  };

  const handleSplit = async () => {
    console.error("Not implemented, need additional input");
  };

  const handleAuthorize = async () => {
    console.error("Not implemented, need additional input");
  };

  const handleDepositStake = async () => {
    console.error("Not implemented, need additional input");
  };

  const handleWithdrawStake = async () => {
    if (!fundPDA) {
      console.error("No fund selected");
      return;
    }

    try {
      const accountPublicKey = new PublicKey(ticketOrStake.publicKey);
      console.log("Withdraw from stake account:", accountPublicKey.toBase58());

      const txId = await glamClient.staking.withdrawFromStakeAccounts(fundPDA, [
        accountPublicKey,
      ]);

      toast({
        title: "Stake withdrawn successfully",
        description: <ExplorerLink path={`tx/${txId}`} label={txId} />,
      });
    } catch (error) {
      console.error("Failed to withdraw stake:", error);

      toast({
        title: "Failed to withdraw stake",
        description: "An error occurred while withdrawing stake.",
        variant: "destructive",
      });
    }
  };

  //
  // Conditional rendering based on the type and status
  //

  // Actions for tickets
  if (ticketOrStake.type === "ticket") {
    return (
      <Button
        variant={isClaimable ? "default" : "secondary"}
        disabled={!isClaimable}
        onClick={handleClaimTicket}
        className="flex h-8 w-8 p-0"
      >
        <ResetIcon className="h-4 w-4" />
        <span className="sr-only">Claim</span>
      </Button>
    );
  }

  // Actions for closable (inactive) or deactivating accounts
  if (
    ticketOrStake.type === "account" &&
    (isClosable || isPendingOrDeactivating)
  ) {
    return (
      <Button
        variant={isClosable ? "default" : "secondary"}
        disabled={!isClosable}
        onClick={handleWithdrawStake}
        className="flex h-8 w-8 p-0"
      >
        <CardStackMinusIcon className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
    );
  }

  // Actions for active accounts
  if (ticketOrStake.type === "account") {
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
          <DropdownMenuItem onClick={handlDeactivateStake}>
            Deactivate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSplit}>Split</DropdownMenuItem>
          <DropdownMenuItem onClick={handleAuthorize}>
            Authorize Stake Authority
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDepositStake}>
            Stakepool Deposit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  // Handle other types or conditions as needed
  return <></>;
}
