"use client";

import React, { ReactNode, useState } from "react";
import { ReactQueryStreamedHydration } from "@tanstack/react-query-next-experimental";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    new QueryClient({
      defaultOptions: {
        queries: {
          refetchInterval: 0,
          staleTime: 1000 * 60 * 5, // 5 minutes
        },
      },
    })
  );

  return (
    <QueryClientProvider client={client}>
      <ReactQueryStreamedHydration>{children}</ReactQueryStreamedHydration>
    </QueryClientProvider>
  );
}
