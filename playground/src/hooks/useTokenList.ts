import { useEffect, useState, useCallback, useMemo } from "react";
import { useGlam } from "@glam/anchor/react";

export interface TokenData {
  value: string;
  label: string;
  symbol: string;
  name: string;
  address: string;
  logoURI?: string;
  [key: string]: any;
}

const CACHE_KEY = "tokenListCache";
const CACHE_VERSION = 1;

export function useTokenList() {
  const { jupTokenList } = useGlam();
  const [isLoading, setIsLoading] = useState(true);
  const [processedTokens, setProcessedTokens] = useState<TokenData[]>([]);

  const getCachedTokens = useCallback(() => {
    if (typeof window === "undefined") return null;
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { version, data } = JSON.parse(cached);
    return version === CACHE_VERSION ? data : null;
  }, []);

  const setCachedTokens = useCallback((tokens: TokenData[]) => {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: CACHE_VERSION, data: tokens }),
    );
  }, []);

  const processTokens = useCallback((tokens: any[]): TokenData[] => {
    return tokens.map((token) => ({
      value: token.address,
      label: token.symbol,
      ...token,
    }));
  }, []);

  useEffect(() => {
    const loadTokens = async () => {
      const cachedTokens = getCachedTokens();

      if (cachedTokens) {
        setProcessedTokens(cachedTokens);
        setIsLoading(false);
      } else if (jupTokenList && jupTokenList.length > 0) {
        const processed = processTokens(jupTokenList);
        setProcessedTokens(processed);
        setCachedTokens(processed);
        setIsLoading(false);
      }
    };

    loadTokens();
  }, [jupTokenList, getCachedTokens, setCachedTokens, processTokens]);

  const tokens = useMemo(() => processedTokens, [processedTokens]);

  return {
    tokens,
    isLoaded: !isLoading,
  };
}
