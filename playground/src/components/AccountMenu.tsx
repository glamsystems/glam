"use client";
import * as React from "react";
import {
  GearIcon,
  CheckIcon,
  ChevronDownIcon,
  EnvelopeClosedIcon,
  EnterIcon,
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
import { useSidebar } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import Image from "next/image";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverTrigger
>;

interface ProductSwitcherProps extends PopoverTriggerProps {}

export default function ProductSwitcher({ className }: ProductSwitcherProps) {
  const { wallet, fundsList, activeFund, setActiveFund } = useGlam();
  const [open, setOpen] = React.useState(false);
  const { state } = useSidebar();
  const { theme, systemTheme } = useTheme();
  const [defaultSparkleImage, setDefaultSparkleImage] = React.useState(
    "/default-sparkle-light.svg"
  );

  React.useEffect(() => {
    const currentTheme = theme === "system" ? systemTheme : theme;
    setDefaultSparkleImage(
      currentTheme === "dark"
        ? "/default-sparkle-light.svg"
        : "/default-sparkle-dark.svg"
    );
  }, [theme, systemTheme]);

  const isCollapsed = state === "collapsed";

  if (!wallet) {
    return (
      <span className="max-h-[32px] focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 relative">
        <WalletMultiButton
          style={{
            backgroundColor: "transparent",
            color: "inherit",
            height: 32,
            flex: 1,
            width: isCollapsed ? "32px" : "228px",
            padding: 0,
            position: "relative",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-start focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0">
            <div className="h-full w-10 flex items-center justify-start z-10 ml-1.5 focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0">
              <EnterIcon className="h-5 w-5" />
            </div>
            <div
              className={cn(
                "flex-1 h-full flex items-center transition-all duration-200 ease-linear focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 relative",
                isCollapsed
                  ? "opacity-0 translate-x-[-100%]"
                  : "opacity-100 translate-x-0"
              )}
            >
              <span className="-ml-3">Connect</span>
            </div>
          </div>
        </WalletMultiButton>
      </span>
    );
  }

  if (!activeFund) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select an account"
          className={cn(
            "w-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 relative overflow-hidden",
            isCollapsed ? "h-8 p-0" : "h-8 pl-0 pr-2",
            className
          )}
        >
          <span className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
            {activeFund?.pubkey ? (
              <Sparkle address={activeFund?.imageKey} size={30} />
            ) : (
              <Image
                src={defaultSparkleImage}
                alt="Default Sparkle"
                width={30}
                height={30}
              />
            )}
          </span>
          <div
            className={cn(
              "flex items-center w-full transition-all duration-200 ease-linear",
              isCollapsed ? "opacity-0 pl-0" : "opacity-100 pl-9"
            )}
          >
            <span className="min-w-0 text-ellipsis whitespace-nowrap truncate">
              {activeFund.name ? (
                <span>{activeFund.name}</span>
              ) : (
                <TruncateAddress address={activeFund?.address || "Select"} />
              )}
            </span>
            <ChevronDownIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 transition-all" align="start">
        <Command>
          <CommandList className="overflow-hidden h-full">
            {fundsList.length > 0 && (
              <>
                <CommandGroup key="Products" heading="Products">
                  {fundsList.map((product) => (
                    <CommandItem
                      key={product.name}
                      onSelect={() => {
                        setActiveFund(product);
                        setOpen(false);
                      }}
                      className="text-sm cursor-pointer h-8"
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
                          activeFund?.address === product.address
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

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
                <Link
                  href="mailto:hello@glam.systems?subject=GLAM GUI Feedback"
                  className="flex items-center w-full"
                >
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
                  height: 32,
                }}
              />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
