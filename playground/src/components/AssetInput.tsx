import React, { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
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
} from "@/components/ui/command";

const assets = ["SOL", "mSOL", "USDC"];

interface AssetInputProps {
  name: string;
  label: string;
  balance: number;
  selectedAsset: string;
  onSelectAsset: (value: string) => void;
  className?: string;
  disableAssetChange?: boolean;
}

export const AssetInput: React.FC<AssetInputProps> = ({
  name,
  label,
  balance,
  selectedAsset,
  onSelectAsset,
  className,
  disableAssetChange = false,
}) => {
  const { control, setValue, reset } = useFormContext();
  const [displayValue, setDisplayValue] = useState<string>("0");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (value: string) => {
    onSelectAsset(value);
    setOpen(false);
  };

  const handleBalanceClick = () => {
    const balanceValue = balance.toString();
    setDisplayValue(balanceValue);
    setValue(name, balance);
  };

  const resetAssetInput = () => {
    setDisplayValue("0");
  };

  useEffect(() => {
    resetAssetInput();
  }, [reset]);

  useEffect(() => {
    setValue(name, 0);
    setDisplayValue("0");
  }, [selectedAsset, setValue, name]);

  const formattedBalance = new Intl.NumberFormat("en-US").format(balance);

  const handleInputChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setDisplayValue(value);
      const numericValue = parseFloat(value.replace(/,/g, ""));
      if (!isNaN(numericValue)) {
        setValue(name, numericValue);
      } else {
        setValue(name, 0);
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
                ref={inputRef}
                value={displayValue}
                className="pr-20"
                placeholder="0"
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={(e) => {
                  if (field.value === 0) {
                    setDisplayValue("");
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "") {
                    setDisplayValue("0");
                    setValue(name, 0);
                  } else {
                    setDisplayValue(formatDisplayValue(e.target.value));
                  }
                }}
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
                          {assets.map((asset) => (
                            <CommandItem
                              key={asset}
                              value={asset}
                              onSelect={() => handleSelect(asset)}
                            >
                              <span>{asset}</span>
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
          <div className="flex justify-between text-sm">
            <FormDescription>Balance</FormDescription>
            <FormDescription
              className="cursor-pointer"
              onClick={handleBalanceClick}
            >
              {formattedBalance}
            </FormDescription>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
