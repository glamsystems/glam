"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React from "react";

interface Props {
  name: string;
  label: string;
  pubkeys: { value: string; label: string }[];
  className?: string;
}

export const PubkeySelector: React.FC<Props> = ({
  name,
  label,
  pubkeys,
  className,
}) => {
  const { control, setValue } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <div className="relative">
                  <Button
                    variant="outline"
                    role="combobox"
                    type="button"
                    className="w-full justify-between"
                  >
                    {field.value
                      ? pubkeys.find((pubkey) => pubkey.value === field.value)
                          ?.value
                      : "Select token holder public key"}
                    <ChevronsUpDown className="w-4 h-4 opacity-50" />
                  </Button>
                </div>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent
              style={{
                width: "var(--radix-popover-trigger-width)",
              }}
              className="w-max p-0"
            >
              <Command>
                <CommandInput
                  placeholder="Search token holder ..."
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>No token holder found.</CommandEmpty>
                  <CommandGroup>
                    {pubkeys.map((pubkey) => (
                      <CommandItem
                        value={pubkey.label}
                        key={pubkey.value}
                        onSelect={() => {
                          setValue(name, pubkey.value);
                        }}
                      >
                        {pubkey.value}
                        <Check
                          className={cn(
                            "ml-auto",
                            pubkey.value === field.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </FormItem>
      )}
    />
  );
};
