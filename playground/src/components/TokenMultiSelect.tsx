"use client"

import React, { useMemo, useCallback } from 'react'
import { MultiSelect } from '@/components/ui/multiple-select'
import { useTokenList, TokenData } from '@/hooks/useTokenList'
import TruncateAddress from "@/utils/TruncateAddress"

interface TokenMultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function TokenMultiSelect({ value, onChange }: TokenMultiSelectProps) {
  const { tokens, isLoaded } = useTokenList()

  const selectedTokens = useMemo(() => {
    const selectedSet = new Set(value)
    return tokens.filter(token => selectedSet.has(token.value))
  }, [tokens, value])

  const renderOption = useCallback((option: TokenData) => (
    <div className="flex items-center w-full">
      <div className="flex items-center gap-2 flex-1">
        {option.logoURI && (
          <img
            src={option.logoURI}
            alt={option.symbol}
            className="w-5 h-5 rounded-full"
            loading="lazy"
            decoding="async"
          />
        )}
        <span className="font-medium text-nowrap">
          {option.symbol}
        </span>
        <span className="ml-1.5 truncate text-muted-foreground text-xs">
          {option.name}
        </span>
      </div>
      <span className="text-xs text-muted-foreground ml-auto pl-2">
        <TruncateAddress address={option.address} />
      </span>
    </div>
  ), [])

  const renderBadge = useCallback((option: TokenData) => (
    <div className="flex items-center gap-2">
      {option.logoURI && (
        <img
          src={option.logoURI}
          alt={option.symbol}
          className="w-4 h-4 rounded-full"
          loading="lazy"
          decoding="async"
        />
      )}
      <span className="font-medium">{option.symbol}</span>
    </div>
  ), [])

  const filterOption = useCallback((option: TokenData, search: string) => {
    const searchLower = search.toLowerCase()
    return option.symbol.toLowerCase().includes(searchLower) ||
      option.name.toLowerCase().includes(searchLower) ||
      option.address.toLowerCase().includes(searchLower)
  }, [])

  if (!isLoaded) {
    return <div>Loading tokens...</div>
  }

  return (
    <MultiSelect<TokenData>
      options={tokens}
      selected={value}
      onChange={onChange}
      placeholder="Select tokens..."
      searchPlaceholder="Search tokens..."
      filterOption={filterOption}
      renderOption={renderOption}
      renderBadge={renderBadge}
      selectedTokens={selectedTokens}
    />
  )
}
