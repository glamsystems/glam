"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Product } from "../data/productSchema";
import { useGlam } from "@glam/anchor/react";
import { PublicKey } from "@solana/web3.js";
import { toast } from "@/components/ui/use-toast";
import { parseTxError } from "@/lib/error";
import { ExplorerLink } from "@/components/ExplorerLink";

interface DataTableRowActionsProps<TData extends Product> {
  row: Row<TData>;
}

export function DataTableRowActions({
  row,
}: DataTableRowActionsProps<Product>) {
  const router = useRouter();
  const { glamClient } = useGlam();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const close = async (product: Product) => {
    console.log("Close product", product);
    try {
      const txSig = await glamClient.fund.closeFund(new PublicKey(product.id));
      toast({
        title: `Closed ${product.product}`,
        description: <ExplorerLink path={`tx/${txSig}`} label={txSig} />,
      });
    } catch (error) {
      toast({
        title: `Failed to closed ${product.product}`,
        description: parseTxError(error),
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem>Favorite</DropdownMenuItem>
        <DropdownMenuItem
          className="w-full flex justify-between"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const next =
              row.original.product === "Mint"
                ? "/mint/access"
                : "/vault/access";
            handleNavigation(next);
          }}
        >
          <span>Delegates</span>
          <ExternalLink className="h-4 w-4 ml-2" />
        </DropdownMenuItem>
        {["Vault", "Fund"].includes(row.original.product) ? (
          <DropdownMenuItem
            className="w-full flex justify-between"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNavigation("/vault/integrations");
            }}
          >
            <span>Integrations</span>
            <ExternalLink className="h-4 w-4 ml-2" />
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="w-full flex justify-between"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            close(row.original);
          }}
        >
          <span>Close</span>
          <XIcon className="h-4 w-4 ml-2" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
