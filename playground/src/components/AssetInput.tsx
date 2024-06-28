'use client'

import React, { useState, useEffect } from "react"
import { useFormContext, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

const assets = ["SOL", "mSOL", "USDC"]

interface AssetInputProps {
    name: string
    label: string
    balance: number
    selectedAsset: string
    onSelectAsset: (value: string) => void
    className?: string
}

export const AssetInput: React.FC<AssetInputProps> = ({ name, label, balance, selectedAsset, onSelectAsset, className }) => {
    const { control, setValue } = useFormContext()
    const [open, setOpen] = useState(false)

    const handleSelect = (value: string) => {
        onSelectAsset(value)
        setOpen(false)
    }

    const handleBalanceClick = () => {
        setValue(name, balance)
    }

    useEffect(() => {
        setValue(name, 0)
    }, [selectedAsset, setValue, name]);

    const formattedBalance = new Intl.NumberFormat("en-US").format(balance);

    const formatInputValue = (value: number) => {
        return new Intl.NumberFormat("en-US").format(value);
    }

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
                                value={formatInputValue(field.value || 0)}
                                className="pr-20"
                                placeholder={formatInputValue(0)}
                            />
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
    )
}