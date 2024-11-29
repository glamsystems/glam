"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import TruncateAddress from "@/utils/TruncateAddress";
import { Badge } from "@/components/ui/badge";
import NumberFormatter from "@/utils/NumberFormatter";

interface HoldersData {
  pubkey: string;
  label: string;
  frozen: boolean;
  quantity: number;
}

export const columns: ColumnDef<HoldersData>[] = [
  {
    accessorKey: "label",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Label" />
    ),
    cell: ({ row }) => (
      <div className="truncate font-medium">{row.getValue("label")}</div>
    ),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "pubkey",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Key" />
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        <TruncateAddress address={row.getValue("pubkey")} />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "frozen",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      return row.getValue("frozen") ? (
        <Badge variant="destructive">Frozen</Badge>
      ) : (
        <Badge variant="outline">Active</Badge>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Quantity" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        <NumberFormatter
          value={row.getValue("quantity")}
          addCommas={true}
          maxDecimalPlaces={4}
        />
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
