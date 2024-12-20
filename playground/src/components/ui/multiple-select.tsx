"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from 'lucide-react'

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
}

interface MultiSelectProps<T extends Option> {
  options: T[]
  selected: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  renderOption?: (option: T) => React.ReactNode
  renderBadge?: (option: T) => React.ReactNode
  filterOption?: (option: T, search: string) => boolean
}

export function MultiSelect<T extends Option>({
                                                options = [],
                                                selected = [],
                                                onChange,
                                                placeholder = "Select items...",
                                                searchPlaceholder = "Search items...",
                                                emptyText = "No items found.",
                                                renderOption,
                                                renderBadge,
                                                filterOption,
                                              }: MultiSelectProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const defaultFilterOption = React.useCallback((option: T, search: string) => {
    return option.label.toLowerCase().includes(search.toLowerCase())
  }, [])

  const filteredOptions = React.useMemo(() => {
    const search = inputValue.toLowerCase()
    return options.filter(option =>
      !selected.includes(option.value) &&
      (filterOption ? filterOption(option, search) : defaultFilterOption(option, search))
    )
  }, [options, selected, inputValue, filterOption, defaultFilterOption])

  const handleSelect = React.useCallback((value: string) => {
    onChange([...selected, value])
    setInputValue("")
  }, [onChange, selected])

  const handleRemove = React.useCallback((value: string) => {
    onChange(selected.filter(item => item !== value))
  }, [onChange, selected])

  const defaultRenderOption = (option: T) => (
    <span className="font-medium">{option.label}</span>
  )

  const defaultRenderBadge = (option: T) => (
    <span className="font-medium">{option.label}</span>
  )

  return (
    <div className="flex flex-col space-y-4">
      <ScrollArea className="h-20 w-full rounded-md border border-input bg-background px-3 py-2">
        <div className="flex flex-wrap gap-2">
          {selected.map((value) => {
            const option = options.find((opt) => opt.value === value)
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
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-72">
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className="mr-2 h-4 w-4 opacity-0"
                        aria-hidden="true"
                      />
                      {renderOption ? renderOption(option) : defaultRenderOption(option)}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
