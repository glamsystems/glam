"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Key } from "../data/keySchema"; // Ensure correct import path
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import Sparkle from "../../../utils/Sparkle";
import TruncateAddress from "@/utils/TruncateAddress";

const tagColors: Record<string, string> = {
  stake: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-400",
  swap: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-400",
  trade: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-400",
  lend: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-400",
  admin: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-400",
};

// Define the type for your row data
interface KeyData {
  pubkey: string;
  label: string;
  tags: ("stake" | "swap" | "trade" | "lend" | "admin")[];
}

// Use the defined type in ColumnDef
export const columns: ColumnDef<KeyData>[] = [
  {
    accessorKey: "label",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Label" />
    ),
    cell: ({ row }) => (
      <div className="w-[100px] truncate">{row.getValue("label")}</div>
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
      <div className="w-[100px] truncate">
        <TruncateAddress address={row.getValue("pubkey")} />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "tags",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Access" />
    ),
    cell: ({ row }) => {
      const tags = row.getValue("tags") as KeyData["tags"];
      return (
        <div className="flex space-x-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="default"
              className={`pointer-events-none capitalize font-light rounded-none dark:bg-opacity-25 ${tagColors[tag]}`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];