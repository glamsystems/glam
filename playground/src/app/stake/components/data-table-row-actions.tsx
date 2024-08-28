"use client";

import { ResetIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PublicKey } from "@solana/web3.js";
import { ticketOrStakeSchema } from "../data/schema";
import { useGlam } from "@glam/anchor/react";
import { testFund } from "../../testFund";
import { toast } from "@/components/ui/use-toast";
import { ExplorerLink } from "@/components/ExplorerLink";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const ticketOrStake = ticketOrStakeSchema.parse(row.original);
  const isClaimable =
    ticketOrStake.status === "claimable" || ticketOrStake.status === "inactive";

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
}
