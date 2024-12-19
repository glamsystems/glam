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

interface MultiSelectProps {
  options?: { label: string; value: string }[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function MultiSelect({
                              options = [],
                              onChange,
                              placeholder = "Select items..."
                            }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<string[]>([])
  const [inputValue, setInputValue] = React.useState("")

  const filteredOptions = React.useMemo(() => {
    return options.filter(option =>
      !selected.includes(option.value) &&
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    )
  }, [options, selected, inputValue])

  const handleSelect = React.useCallback((value: string) => {
    setSelected(prev => {
      const updatedSelected = [...prev, value]
      onChange(updatedSelected)
      return updatedSelected
    })
    // Don't close the popover after selection
    setInputValue("")
  }, [onChange])

  const handleRemove = React.useCallback((value: string) => {
    setSelected(prev => {
      const updatedSelected = prev.filter(item => item !== value)
      onChange(updatedSelected)
      return updatedSelected
    })
  }, [onChange])

  return (
    <div className="flex flex-col space-y-4">
      <ScrollArea className="h-20 w-full rounded-md border border-input bg-background px-3 py-2">
        <div className="flex flex-wrap gap-2">
          {selected.map((value) => {
            const option = options.find((opt) => opt.value === value)
            if (!option) return null
            return (
              <Badge key={value} variant="secondary" className="text-sm rounded-none">
                {option.label}
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
              placeholder="Search items..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>No items found.</CommandEmpty>
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
                      {option.label}
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
