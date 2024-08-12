"use client";

import { ResetIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PublicKey } from "@solana/web3.js";
import { ticketSchema } from "../data/ticketSchema";
import { useGlam } from "@glam/anchor";
import { testFund } from "../../testFund";
import { toast } from "@/components/ui/use-toast";
import { ExplorerLink } from "@/components/ExplorerLink";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const ticket = ticketSchema.parse(row.original);
  const isClaimable = ticket.status === "claimable";

  const { glamClient } = useGlam();

  const handleClaim = async () => {
    try {
      const ticketPublicKey = new PublicKey(ticket.publicKey);
      console.log("Test Claim Button");

      const txId = await glamClient.marinade.claimTickets(testFund.fundPDA, [
        ticketPublicKey,
      ]);
      console.log("Claim successful");

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
