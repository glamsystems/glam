"use client";

import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { keySchema } from "./data/keySchema";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  return (
    <span className="flex gap-2">
      <Button
        variant="ghost"
        className="flex h-8 w-8 p-0 text-muted-foreground pointer-events-none"
      >
        <MixerHorizontalIcon className="h-4 w-4" />
      </Button>
    </span>
  );
}
