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

export interface Asset {
  name: string;
  symbol: string;
  address?: string;
  decimals?: number;
  balance: number;
}

interface AssetInputProps {
  name: string;
  label: string;
  balance: number;
  assets?: Asset[];
  selectedAsset?: string;
  onSelectAsset?: (value: string) => void;
  className?: string;
  disableAssetChange?: boolean;
  disableAmountInput?: boolean;
  useMaxAmount?: boolean;
  hideBalance?: boolean;
}

export const AssetInput: React.FC<AssetInputProps> = ({
  name,
  label,
  balance,
  assets = [],
  selectedAsset,
  onSelectAsset = () => {},
  className,
  disableAssetChange = false,
  disableAmountInput = false,
  useMaxAmount = false,
  hideBalance = false,
}) => {
  const { control, getValues, setValue, reset } = useFormContext();
  // const [displayValue, setDisplayValue] = useState<string>("0");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (value: string) => {
    onSelectAsset(value);
    setOpen(false);
  };

  const handleBalanceClick = () => {
    // const balanceValue = balance.toString();
    // setDisplayValue(balanceValue);
    setValue(name, balance);
  };

  const resetAssetInput = () => {
    setValue(name, 0);
  };

  useEffect(() => {
    resetAssetInput();
  }, [reset]);

  useEffect(() => {
    if (useMaxAmount) {
      // const balanceValue = balance.toString();
      // setDisplayValue(balanceValue);
      setValue(name, balance);
    } else {
      setValue(name, 0);
      // setDisplayValue("0");
    }
  }, [useMaxAmount, balance, name, setValue]);

  useEffect(() => {
    if (!useMaxAmount) {
      setValue(name, 0);
      // setDisplayValue("0");
    }
  }, [selectedAsset, setValue, name, useMaxAmount]);

  const formattedBalance = new Intl.NumberFormat("en-US").format(
    assets.find((asset) => asset.symbol === selectedAsset)?.balance ||
      balance ||
      0
  );

  const handleInputChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      // setDisplayValue(value);
      const numericValue = parseFloat(value.replace(/,/g, ""));
      if (!isNaN(numericValue)) {
        setValue(name, numericValue);
      } else {
        setValue(name, "");
      }
    }
  };

  const formatDisplayValue = (value: string) => {
    const [integerPart, decimalPart] = value.split(".");
    const formattedIntegerPart = new Intl.NumberFormat("en-US").format(
      parseInt(integerPart || "0")
    );
    return decimalPart
      ? `${formattedIntegerPart}.${decimalPart}`
      : formattedIntegerPart;
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
                step="any"
                ref={inputRef}
                value={
                  disableAmountInput
                    ? getValues()[name] || ""
                    : getValues()[name]
                }
                className="pr-20"
                placeholder=""
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={disableAmountInput}
              />
              {!disableAssetChange && (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="secondary"
                      className="absolute pr-2 pl-2 h-6 inset-y-0 top-2 right-2 border-l-0"
                    >
                      {selectedAsset || "Asset"}
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
                              onSelect={() => handleSelect(asset.symbol)}
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
                  {selectedAsset || "Asset"}
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
                onClick={!disableAmountInput ? handleBalanceClick : undefined}
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
