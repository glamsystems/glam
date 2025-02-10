import * as anchor from "@coral-xyz/anchor";
import { BlockhashWithExpiryBlockHeight } from "@solana/web3.js";

const BROWSER_CACHE_NAME = "glam-gui";

type CachedBlockhash = {
  blockhash: BlockhashWithExpiryBlockHeight;
  expiresAt: number; // in milliseconds
};

export class BlockhashWithCache {
  provider: anchor.Provider;
  isBrowser: boolean;
  nodeCache: Map<string, any>;
  cacheKey: string;
  ttl: number;

  constructor(
    provider: anchor.Provider,
    isBrowser: boolean,
    ttl: number = 5_000,
  ) {
    this.provider = provider;
    this.isBrowser = isBrowser;
    this.nodeCache = new Map(); // Use a simple Map
    this.cacheKey = "/glam/blockhash/get";
    this.ttl = ttl; // ttl in milliseconds
  }

  async get(): Promise<BlockhashWithExpiryBlockHeight> {
    let data: CachedBlockhash | undefined;
    if (this.isBrowser) {
      data = await this._getFromBrowserCache();
    } else {
      data = this._getFromNodeCache();
    }

    if (data) {
      const { blockhash, expiresAt } = data;
      if (expiresAt > Date.now()) {
        return blockhash;
      }
    }

    const latestBlockhash = await this.provider.connection.getLatestBlockhash();
    await this.set({
      blockhash: latestBlockhash,
      expiresAt: Date.now() + this.ttl,
    });

    return latestBlockhash;
  }

  async set(data: CachedBlockhash) {
    if (this.isBrowser) {
      await this._setBrowserCache(data);
    } else {
      this._setNodeCache(data);
    }
  }

  async _getFromBrowserCache(): Promise<CachedBlockhash | undefined> {
    try {
      const glamCache = await window.caches.open(BROWSER_CACHE_NAME);
      const response = await glamCache.match(this.cacheKey);
      if (response) {
        const data = await response.json();
        return data as CachedBlockhash;
      }
    } catch (e) {
      console.error("Error fetching blockhash from browser cache:", e);
    }
  }

  _getFromNodeCache(): CachedBlockhash | undefined {
    const data = this.nodeCache.get(this.cacheKey);
    if (data) {
      return data as CachedBlockhash;
    }
  }

  async _setBrowserCache(data: CachedBlockhash) {
    const glamCache = await window.caches.open(BROWSER_CACHE_NAME);
    await glamCache.put(
      this.cacheKey,
      new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  _setNodeCache(data: CachedBlockhash) {
    this.nodeCache.set(this.cacheKey, data);
  }
}
