"use client";

import { CaretRightIcon, EnterIcon, MixerHorizontalIcon, Pencil1Icon, TrashIcon, TriangleRightIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { keySchema } from "../data/keySchema";
import { toast } from "@/components/ui/use-toast";

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({
                                             row,
                                           }: DataTableRowActionsProps<TData>) {
  const holding = keySchema.parse(row.original);

  // Handler for edit button click
  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevents the default navigation behavior
    event.stopPropagation(); // Prevents the event from bubbling up
    toast({
      title: "Edit button clicked",
      description: `You are editing: ${holding.label}`,
    });
  };

  // Handler for delete button click
  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevents the default navigation behavior
    event.stopPropagation(); // Prevents the event from bubbling up
    toast({
      title: "Delete button clicked",
      description: `You are deleting: ${holding.label}`,
      variant: "destructive",
    });
  };

  return (
    <span className="flex gap-2">
      <Button
        variant="ghost"
        className="flex h-8 w-8 p-0 text-muted-foreground pointer-events-none"
      >
        <MixerHorizontalIcon className="h-4 w-4" />
      </Button>
      {/*<Button*/}
      {/*  variant="ghost"*/}
      {/*  className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"*/}
      {/*  onClick={handleDeleteClick} // Attach the delete handler*/}
      {/*>*/}
      {/*  <TrashIcon className="h-4 w-4" />*/}
      {/*</Button>*/}
    </span>
  );
}
