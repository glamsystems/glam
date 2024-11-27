"use client";

import {
  CaretRightIcon,
  EnterIcon,
  MixerHorizontalIcon,
  Pencil1Icon,
  TrashIcon,
  TriangleRightIcon,
} from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { holdersSchema } from "../data/holdersSchema";
import { toast } from "@/components/ui/use-toast";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const holder = holdersSchema.parse(row.original);

  return (
    <span className="flex gap-2 justify-end">
      <Button
        variant="ghost"
        className="flex h-8 w-8 p-0 text-muted-foreground pointer-events-none"
      >
        <MixerHorizontalIcon className="h-4 w-4" />
      </Button>
    </span>
  );
}
