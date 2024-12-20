"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Option {
  value: string
  label: string
  symbol: string
  name: string
  address: string
  logoURI?: string
  [key: string]: any // Allow for additional token properties
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  renderOption?: (option: Option) => React.ReactNode
  renderBadge?: (option: Option) => React.ReactNode
  filterOption?: (option: Option, search: string) => boolean
}

export function MultiSelect({
                              options = [],
                              selected = [],
                              onChange,
                              placeholder = "Select items...",
                              searchPlaceholder = "Search items...",
                              emptyText = "No items found.",
                              renderOption,
                              renderBadge,
                              filterOption,
                            }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const parentRef = React.useRef<HTMLDivElement>(null)

  const defaultFilterOption = React.useCallback((option: Option, search: string) => {
    return option.label.toLowerCase().includes(search.toLowerCase())
  }, [])

  const filteredOptions = React.useMemo(() => {
    const search = inputValue.toLowerCase()
    return options.filter(option =>
      !selected.includes(option.value) &&
      (filterOption ? filterOption(option, search) : defaultFilterOption(option, search))
    )
  }, [options, selected, inputValue, filterOption, defaultFilterOption])

  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  })

  const handleSelect = React.useCallback((value: string) => {
    onChange([...selected, value])
    setInputValue("")
  }, [onChange, selected])

  const handleRemove = React.useCallback((value: string) => {
    onChange(selected.filter(item => item !== value))
  }, [onChange, selected])

  const defaultRenderOption = (option: Option) => (
    <div className="flex items-center w-full">
      <div className="flex items-center gap-2 flex-1">
        {option.logoURI && (
          <img
            src={option.logoURI}
            alt={option.symbol}
            className="w-5 h-5 rounded-full"
          />
        )}
        <span className="font-medium">{option.symbol}</span>
      </div>
    </div>
  )

  const defaultRenderBadge = (option: Option) => (
    <div className="flex items-center gap-2">
      {option.logoURI && (
        <img
          src={option.logoURI}
          alt={option.symbol}
          className="w-4 h-4 rounded-full"
        />
      )}
      <span className="font-medium">{option.symbol}</span>
    </div>
  )

  return (
    <div className="flex flex-col space-y-4">
      <ScrollArea className="h-20 w-full rounded-md border border-input bg-background px-3 py-2">
        <div className="flex flex-wrap gap-2">
          {selected.map((value) => {
            const option = options?.find((opt) => opt.value === value)
            if (!option) return null
            return (
              <Badge key={value} variant="secondary" className="text-sm rounded-none">
                {renderBadge ? renderBadge(option) : defaultRenderBadge(option)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemove(value)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </Button>
              </Badge>
            )
          })}
        </div>
      </ScrollArea>
      <Popover open={open} onOpenChange={setOpen}>
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
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={inputValue}
              onValueChange={setInputValue}
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
                        width: '100%',
                        position: 'relative'
                      }}
                    >
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const option = filteredOptions[virtualRow.index]
                        return (
                          <div
                            key={option.value}
                            className="absolute top-0 left-0 w-full"
                            style={{
                              height: `${virtualRow.size}px`,
                              transform: `translateY(${virtualRow.start}px)`
                            }}
                          >
                            <CommandItem
                              value={option.value}
                              onSelect={() => handleSelect(option.value)}
                              className="w-full"
                            >
                              <Check
                                className="mr-2 h-4 w-4 opacity-0"
                                aria-hidden="true"
                              />
                              {renderOption ? renderOption(option) : defaultRenderOption(option)}
                            </CommandItem>
                          </div>
                        )
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
  )
}
