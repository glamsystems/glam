import React, { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

import TruncateAddress from "../utils/TruncateAddress";
import { Skeleton } from "./ui/skeleton";

export interface Asset {
  name: string;
  symbol: string;
  address?: string;
  decimals?: number;
  balance: number; // ui amount
}

interface AssetInputProps {
  name: string;
  label: string;
  balance?: number;
  assets?: Asset[];
  selectedAsset?: string;
  onSelectAsset?: (asset: Asset) => void;
  className?: string;
  step?: string;
  disableAssetChange?: boolean;
  disableAmountInput?: boolean;
  useMaxAmount?: boolean;
  hideBalance?: boolean;
  isLoading?: boolean;
  disableSubmitOnEnter?: boolean;
}

export const AssetInput: React.FC<AssetInputProps> = ({
  name,
  label,
  balance,
  assets = [],
  selectedAsset,
  onSelectAsset = () => {},
  className,
  step = "1",
  disableAssetChange = false,
  disableAmountInput = false,
  useMaxAmount = false,
  hideBalance = false,
  isLoading = false,
  disableSubmitOnEnter = true,
}) => {
  const { control, getValues, setValue, reset } = useFormContext();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<string>(selectedAsset || "");

  const handleSelect = (value: Asset) => {
    onSelectAsset(value);
    setSelected(value.symbol);
    setOpen(false);
  };

  useEffect(() => {
    setValue(name, 0);
  }, [reset]);

  useEffect(() => {
    if (useMaxAmount) {
      setValue(name, balance);
    } else if (selected) {
      setValue(name, "");
    }
  }, [useMaxAmount, balance, selected, name, setValue]);

  const selectedAssetBalance = assets.find(
    (asset) => asset.symbol === selected,
  )?.balance;
  const formattedBalance = new Intl.NumberFormat("en-US").format(
    balance || selectedAssetBalance || 0,
  );

  const handleInputChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      const numericValue = parseFloat(value.replace(/,/g, ""));
      if (!isNaN(numericValue)) {
        setValue(name, numericValue);
      } else {
        setValue(name, "");
      }
    }
  };

  hideBalance = hideBalance || Number.isNaN(balance);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                type="number"
                step={step}
                ref={inputRef}
                onClick={() => setValue(name, "")}
                value={getValues()[name]}
                className="pr-20"
                placeholder="0"
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (disableSubmitOnEnter && e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                disabled={disableAmountInput}
              />
              {isLoading && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center pl-2">
                  <Skeleton className="w-3/5 h-4" />
                </div>
              )}
              {!disableAssetChange && (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="secondary"
                      className="absolute pr-2 pl-2 h-6 inset-y-0 top-2 right-2 border-l-0"
                    >
                      {selected || "Asset"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" side="right" align="start">
                    <Command>
                      <CommandInput placeholder="Search assets..." />
                      <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                          {assets?.map((asset) => (
                            <CommandItem
                              key={asset.address}
                              value={asset.symbol}
                              onSelect={() => handleSelect(asset)}
                            >
                              <span className="font-medium text-nowrap">
                                {asset.symbol}
                              </span>
                              <span className="ml-1.5 truncate text-muted-foreground text-xs">
                                {asset.name}
                              </span>
                              <CommandShortcut>
                                <TruncateAddress address={asset.address} />
                              </CommandShortcut>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              {disableAssetChange && (
                <Button
                  variant="secondary"
                  className="absolute pr-2 pl-2 h-6 inset-y-0 top-2 right-2 border-l-0"
                  disabled
                >
                  {selected || "Asset"}
                </Button>
              )}
            </div>
          </FormControl>
          {!hideBalance && (
            <div className="flex justify-between text-sm">
              <FormDescription>Balance</FormDescription>
              <FormDescription
                className={`select-none cursor-pointer ${
                  disableAmountInput ? "pointer-events-none text-gray-400" : ""
                }`}
                onClick={() => {
                  disableAmountInput || setValue(name, selectedAssetBalance);
                }}
              >
                {formattedBalance}
              </FormDescription>
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
