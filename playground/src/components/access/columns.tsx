"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { ExplorerLink } from "@/components/ExplorerLink";
import { Badge } from "../ui/badge";

// const tagColors: Record<string, string> = {
//   stake:
//     "bg-emerald-100 text-emerald-800 border-emerald-800 dark:bg-emerald-900 dark:text-emerald-400 dark:border-emerald-400",
//   swap: "bg-teal-100 text-teal-800 border-teal-800 dark:bg-teal-900 dark:text-teal-400 dark:border-teal-400",
//   trade:
//     "bg-sky-100 text-sky-800 border-teal-800 dark:bg-sky-900 dark:text-sky-400 dark:border-sky-400",
//   lend: "bg-purple-100 text-purple-800 border-purple-800 dark:bg-purple-900 dark:text-purple-400 dark:border-purple-400",
//   admin:
//     "bg-rose-100 text-rose-800 border-rose-800 dark:bg-rose-900 dark:text-rose-400 dark:border-rose-400",
// };

export type KeyData = {
  pubkey: string;
  label: string;
  tags: string[];
};

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
      <div className="w-[100px]">
        <ExplorerLink
          path={`/account/${row.getValue("pubkey")}`}
          label={row.getValue("pubkey")}
        />
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
    filterFn: (row, id, filterValue) => {
      // filterValue is an array of tags
      // row.getValue("tags") is also an array of strings
      // return true of filterValue is a subset of row.getValue("tags")
      const selectedTags = Array.isArray(filterValue)
        ? (filterValue as string[])
        : [];
      const tags = row.getValue("tags") as KeyData["tags"];
      return selectedTags.every((tag: string) => tags.includes(tag));
    },
    cell: ({ row }) => {
      const tags = row.getValue("tags") as KeyData["tags"];
      return (
        <div className="">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="default"
              className={`mr-2 my-1 pointer-events-none capitalize font-normal rounded-none dark:bg-opacity-25`}
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
