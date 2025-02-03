"use client";

import { ResetIcon } from "@radix-ui/react-icons"; // You can use a different icon if preferred
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

interface TicketsClaimProps {
  selectedRows?: Array<{ type: string; status: string }>;
}

export function TicketsClaim({ selectedRows = [] }: TicketsClaimProps) {
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    // Filter rows that are of type "ticket" and have status "claimable"
    const eligibleRows = selectedRows.filter(
      (row) => row.type === "ticket" && row.status === "claimable",
    );

    // The button should be enabled only if all selected rows are eligible tickets
    const allAreEligibleTickets =
      eligibleRows.length === selectedRows.length && eligibleRows.length >= 2;

    // Enable the button only if the condition is met
    setIsDisabled(!allAreEligibleTickets);
  }, [selectedRows]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="ml-auto mr-2 hidden h-8 lg:flex"
            disabled={isDisabled}
          >
            <ResetIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>
            {isDisabled
              ? "Select at least two claimable tickets."
              : "Claim Tickets"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
