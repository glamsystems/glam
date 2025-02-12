"use client";

import { createContext, useContext, useMemo } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Client } from "@/lib/client";

interface ClientProviderContext {
  client: Client;
}

const ClientContext = createContext<ClientProviderContext>(
  {} as ClientProviderContext,
);

export function ClientProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const client = useMemo(() => {
    const client = new Client(connection, wallet);
    return client;
  }, [connection, wallet]);

  const value: ClientProviderContext = {
    client,
  };

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
}

export const useClient = () => useContext(ClientContext);
