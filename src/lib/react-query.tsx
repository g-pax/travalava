"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 0,
          retry: 2,
        },
        mutations: {
          retry: 1,
        },
      },
    });

    // // Set up persistence
    // if (typeof window !== "undefined") {
    //   const persister = createSyncStoragePersister({
    //     // storage: window.localStorage,
    //     // key: "travalava-query-cache",
    //   });

    //   persistQueryClient({
    //     queryClient: client,
    //     persister,
    //     maxAge: 1000 * 60 * 60 * 24, // 24 hours
    //   });
    // }

    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
