"use client";
import { EffectiveTheme } from "@/utils/EffectiveTheme";
import * as React from "react";
import {
  GearIcon, CheckIcon, ChevronDownIcon, PlusCircledIcon, PlusIcon, UpdateIcon, EnvelopeClosedIcon, ChatBubbleIcon
} from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { ProductNameGen } from "@/utils/ProductNameGen";
import { toast } from "@/components/ui/use-toast";
import { z } from "zod";
import Sparkle from "@/utils/Sparkle";
import TruncateAddress from "@/utils/TruncateAddress";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useGlam } from "@glam/anchor/react";
import Link from "next/link";

const groups = [
  {
    label: "Products",
    products: [
      {
        label: "SpaciousSchnorrSafe",
        value: "GLAM9W754xTYpKsgZgRJ3yiyQgkpa4Zei1f6VVWohvjr",
      },
      {
        label: "YummyTestVehicle",
        value: "GLAM29gaAdXMPPxyKqGtQhyTViQzWDhiNwDSsbZPbLWz",
      },
      {
        label: "TopGammaBag",
        value: "GLAM8NJQt5bpHPqLnF4VPHKR2vnjEunfKewMEBR4eTnT",
      },
    ],
  },
  {
    label: "Connected Account",
    products: [],
  },
];

type Product = (typeof groups)[number]["products"][number];

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverTrigger
>;

interface ProductSwitcherProps extends PopoverTriggerProps {}

const createSchema = z.object({
  productName: z.string().min(3, {
    message: "Product name must be at least 3 characters.",
  }),
});

type CreateSchema = z.infer<typeof createSchema>;

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
          className={cn("w-full pl-2", className)}
        >
          <span className="mr-2">
            {activeFund?.fund ? (
              <Sparkle address={activeFund?.imageKey} size={24} />
            ) : null}
          </span>
          <span className="mr-2 min-w-0 text-ellipsis whitespace-nowrap truncate">
            {activeFund ? (
              activeFund.name ? (
                <span>{activeFund.name}</span>
              ) : (
                <TruncateAddress address={activeFund?.addressStr || ""} />
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
          {/*<CommandInput placeholder="Search product..." />*/}
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
