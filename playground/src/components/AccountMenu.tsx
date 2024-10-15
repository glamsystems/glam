"use client";
import * as React from "react";
import {
  GearIcon, CheckIcon, ChevronDownIcon, EnvelopeClosedIcon
} from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Sparkle from "@/utils/Sparkle";
import TruncateAddress from "@/utils/TruncateAddress";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useGlam } from "@glam/anchor/react";
import Link from "next/link";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverTrigger
>;

interface ProductSwitcherProps extends PopoverTriggerProps {}

export default function ProductSwitcher({ className }: ProductSwitcherProps) {
  const { wallet, fundsList, activeFund, setActiveFund } = useGlam();
  const [open, setOpen] = React.useState(false);

  return !wallet ? (
    <span className="max-h-[40px]">
    <WalletMultiButton
      style={{
        backgroundColor: "transparent",
        color: "inherit",
        height: 40,
        flex: 1,
        width: "228px",
        justifyContent: "left",
      }}
    />
      </span>
  ) : !activeFund ? null : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select an account"
          className={cn("w-full pl-2 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0", className)}
        >
          <span className="mr-2">
            {activeFund?.fund ? (
              <Sparkle address={activeFund?.imageKey} size={24} />
            ) : <div className="border h-6 w-6"></div>}
          </span>
          <span className="mr-2 min-w-0 text-ellipsis whitespace-nowrap truncate">
            {activeFund ? (
              activeFund.name ? (
                <span>{activeFund.name}</span>
              ) : (
                <TruncateAddress address={activeFund?.addressStr || "Select"} />
              )
            ) : (
              "..."
            )}
          </span>
          <ChevronDownIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 transition-all" align="start">
        <Command>
          <CommandList>
            <CommandGroup key="Products" heading="Products">
              {fundsList.map((product) => (
                <CommandItem
                  key={product.name}
                  onSelect={() => {
                    setActiveFund(product);
                    setOpen(false);
                  }}
                  className="text-sm cursor-pointer"
                >
                  <span className="mr-2">
                    {product ? (
                      <Sparkle address={product.imageKey} size={24} />
                    ) : null}
                  </span>
                  {product ? (
                    product.name ? (
                      <p className="text-ellipsis mr-4">{product.name}</p>
                    ) : (
                      <TruncateAddress address={product.name} />
                    )
                  ) : null}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      activeFund?.addressStr === product.addressStr
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup>
              <CommandItem
                className="text-sm cursor-pointer data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <Link href="/settings" className="flex items-center w-full">
                  <GearIcon className="mr-3 ml-1 w-4 h-4" />
                  <p className="text-ellipsis mr-4">Settings</p>
                </Link>

              </CommandItem>
              <CommandItem
                className="text-sm cursor-pointer data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
                onSelect={() => {
                  setOpen(false);
                }}
              >
                <Link href="mailto:hello@glam.systems?subject=GLAM GUI Feedback" className="flex items-center w-full">
                  <EnvelopeClosedIcon className="mr-3 ml-1 w-4 h-4" />
                  <p className="text-ellipsis mr-4">Feedback</p>
                </Link>

              </CommandItem>

            </CommandGroup>

            <CommandSeparator />

            <CommandGroup
              className="overflow-visible"
              key="Connected Account"
              heading="Connected Account"
            >
              <WalletMultiButton
                style={{
                  width: 244,
                  color: "inherit",
                  padding: 0,
                  paddingLeft: 8,
                  paddingRight: 16,
                  height: 36,
                }}
              />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
