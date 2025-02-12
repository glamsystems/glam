"use client";

import { createContext, useContext, useMemo } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { FatcatGlamClient } from "@/lib/client";

interface ClientProviderContext {
  glamClient: FatcatGlamClient;
}

const ClientContext = createContext<ClientProviderContext>(
  {} as ClientProviderContext,
);

export function ClientProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const glamClient = useMemo(() => {
    const client = new FatcatGlamClient(connection, wallet!);
    return client;
  }, [connection, wallet]);

  const value: ClientProviderContext = { glamClient };

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
}

export const useGlamClient = () => useContext(ClientContext);
