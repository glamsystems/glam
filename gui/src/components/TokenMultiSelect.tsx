"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MultiSelect } from "@/components/ui/multiple-select";
import TruncateAddress from "@/utils/TruncateAddress";
import { JupTokenListItem, useGlam } from "@glam/anchor/react";

interface TokenData {
  value: string; // same as mint address
  label: string; // same as token symbol
  symbol: string;
  name: string;
  address: string;
  logoURI?: string;
  [key: string]: any;
}

interface TokenMultiSelectProps {
  selected: string[];
  onChange: (value: string[]) => void;
}

export function TokenMultiSelect({
  selected,
  onChange,
}: TokenMultiSelectProps) {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const { jupTokenList } = useGlam();

  const processTokens = useCallback(
    (tokens: JupTokenListItem[]): TokenData[] => {
      return tokens.map((token) => ({
        value: token.address,
        label: token.symbol,
        ...token,
      }));
    },
    [],
  );
  useEffect(() => {
    if (jupTokenList && jupTokenList.length > 0) {
      const processed = processTokens(jupTokenList);
      setTokens(processed);
    }
  }, [jupTokenList]);

  const renderOption = useCallback(
    (option: TokenData) => (
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
          <span className="font-medium text-nowrap">{option.symbol}</span>
          <span className="ml-1.5 truncate text-muted-foreground text-xs">
            {option.name}
          </span>
        </div>
        <span className="text-xs text-muted-foreground ml-auto pl-2">
          <TruncateAddress address={option.address} />
        </span>
      </div>
    ),
    [],
  );

  const renderBadge = useCallback(
    (option: TokenData) => (
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
    ),
    [],
  );

  const filterOption = useCallback((option: TokenData, search: string) => {
    const searchLower = search.toLowerCase();
    return (
      option.symbol.toLowerCase().includes(searchLower) ||
      option.name.toLowerCase().includes(searchLower) ||
      option.address.toLowerCase().includes(searchLower)
    );
  }, []);

  return tokens.length > 0 ? (
    <MultiSelect<TokenData>
      options={tokens}
      selected={selected}
      onChange={onChange}
      placeholder="Select tokens..."
      searchPlaceholder="Search tokens..."
      filterOption={filterOption}
      renderOption={renderOption}
      renderBadge={renderBadge}
    />
  ) : (
    <div>Loading tokens...</div>
  );
}
