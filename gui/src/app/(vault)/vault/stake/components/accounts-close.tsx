"use client";

import { CardStackMinusIcon, UploadIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

interface AccountsWithdrawProps {
  selectedRows?: Array<{ type: string; status: string; validator?: string }>;
}

export function AccountsClose({ selectedRows = [] }: AccountsWithdrawProps) {
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    // Ensure there is at least one row selected
    if (selectedRows.length === 0) {
      setIsDisabled(true);
      return;
    }

    // Check if all selected rows are of type "account"
    const allAreAccounts = selectedRows.every((row) => row.type === "account");

    if (!allAreAccounts) {
      setIsDisabled(true);
      return;
    }

    // Filter rows that are of type "account" and have status "inactive"
    const eligibleRows = selectedRows.filter(
      (row) => row.status === "inactive",
    );

    // Ensure all eligible rows have the same validator value
    const hasSameValidator = eligibleRows.every(
      (row, _, array) => row.validator && row.validator === array[0].validator,
    );

    // The button should be enabled only if there are at least two eligible rows with the same validator
    setIsDisabled(!(eligibleRows.length >= 2 && hasSameValidator));
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
            <CardStackMinusIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>
            {isDisabled
              ? "Select at least two inactive accounts to close."
              : "Close Accounts"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
