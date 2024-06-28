"use client";

import { ResetIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ticketSchema } from "../data/ticketSchema";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const ticket = ticketSchema.parse(row.original);
  const isClaimable = ticket.status === "claimable";

  return (
    <Button
      variant={isClaimable ? "default" : "secondary"}
      disabled={!isClaimable}
      className="flex h-8 w-8 p-0"
    >
      <ResetIcon className="h-4 w-4" />
      <span className="sr-only">Claim</span>
    </Button>
  );
}
