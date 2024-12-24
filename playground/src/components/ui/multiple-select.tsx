"use client";

import * as React from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Option {
  value: string;
  label: string;
  [key: string]: any;
}

export interface MultiSelectProps<T extends Option> {
  options: T[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  renderOption?: (option: T) => React.ReactNode;
  renderBadge?: (option: T) => React.ReactNode;
  filterOption?: (option: T, search: string) => boolean;
}

function MultiSelect<T extends Option>({
  options,
  selected = [],
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search items...",
  emptyText = "No items found.",
  renderOption,
  renderBadge,
  filterOption,
}: MultiSelectProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [searchInputValue, setSearchInputValue] = React.useState("");

  const selectedSet = React.useMemo(() => new Set(selected), [selected]);

  const availableOptions = React.useMemo(
    () => options.filter((option) => !selectedSet.has(option.value)),
    [options, selectedSet],
  );

  const filteredOptions = React.useMemo(() => {
    if (!open) return [];
    if (!searchInputValue) return availableOptions;
    return availableOptions.filter((option) =>
      filterOption
        ? filterOption(option, searchInputValue)
        : option.label.toLowerCase().includes(searchInputValue.toLowerCase()),
    );
  }, [open, availableOptions, searchInputValue, filterOption]);

  const [batchSize, setBatchSize] = React.useState(100);

  React.useEffect(() => {
    if (batchSize < filteredOptions.length) {
      const timeout = setTimeout(() => {
        setBatchSize((prev) => Math.min(prev + 100, filteredOptions.length));
      }, 100); // Increment batch size every 100ms
      return () => clearTimeout(timeout);
    }
  }, [batchSize, filteredOptions.length]);

  const batchedFilteredOptions = filteredOptions.slice(0, batchSize);

  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: batchedFilteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const handleSelect = React.useCallback(
    (value: string) => {
      onChange([...selected, value]);
    },
    [onChange, selected],
  );

  const handleRemove = React.useCallback(
    (value: string) => {
      onChange(selected.filter((item) => item !== value));
    },
    [onChange, selected],
  );

  const renderSelectedBadges = React.useMemo(
    () => (
      <div className="flex flex-wrap gap-2">
        {options
          .filter((option) => (selected || []).includes(option.value))
          .map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="text-sm rounded-none"
            >
              {renderBadge ? renderBadge(option) : option.label}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => handleRemove(option.value)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove</span>
              </Button>
            </Badge>
          ))}
      </div>
    ),
    [selected, renderBadge, handleRemove],
  );

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchInputValue("");
    }
  }, []);

  return (
    <div className="flex flex-col space-y-4">
      <ScrollArea className="h-20 w-full rounded-md border border-input bg-background px-3 py-2">
        {renderSelectedBadges}
      </ScrollArea>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selected.length > 0 ? `${selected.length} selected` : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchInputValue}
              onValueChange={setSearchInputValue}
            />
            <CommandList>
              <CommandGroup>
                {filteredOptions.length === 0 ? (
                  <CommandEmpty>{emptyText}</CommandEmpty>
                ) : (
                  <div
                    ref={parentRef}
                    className="relative h-[320px] overflow-auto"
                  >
                    <div
                      style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: "100%",
                        position: "relative",
                      }}
                    >
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const option = filteredOptions[virtualRow.index];
                        return (
                          <div
                            key={option.value}
                            className="absolute top-0 left-0 w-full"
                            style={{
                              height: `${virtualRow.size}px`,
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                          >
                            <CommandItem
                              value={option.value}
                              onSelect={() => handleSelect(option.value)}
                              className="w-full"
                            >
                              {renderOption
                                ? renderOption(option)
                                : option.label}
                            </CommandItem>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { MultiSelect };
