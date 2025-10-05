"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
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
          staleTime: 1000 * 60 * 5, // 5 minutes
          gcTime: 1000 * 60 * 60 * 24, // 24 hours (was cacheTime)
          retry: (failureCount, error) => {
            // Don't retry on 4xx errors except 429 (rate limiting)
            if (error && typeof error === "object" && "status" in error) {
              const status = (error as Record<string, unknown>).status;
              if (
                typeof status === "number" &&
                status >= 400 &&
                status < 500 &&
                status !== 429
              ) {
                return false;
              }
            }
            return failureCount < 2;
          },
          retryDelay: (attemptIndex) =>
            Math.min(1000 * 2 ** attemptIndex, 30000),
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
          refetchOnMount: true,
        },
        mutations: {
          retry: (failureCount, error) => {
            // Don't retry mutations on client errors (4xx)
            if (error && typeof error === "object" && "status" in error) {
              const status = (error as Record<string, unknown>).status;
              if (typeof status === "number" && status >= 400 && status < 500) {
                return false;
              }
            }
            return failureCount < 1;
          },
          retryDelay: 1000,
        },
      },
    });

    return client;
  });

  const [persister] = useState(() => {
    if (typeof window === "undefined") return undefined;

    return createSyncStoragePersister({
      storage: window.localStorage,
      key: "travalava-query-cache",
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    });
  });

  // Use PersistQueryClientProvider if we have a persister, otherwise regular provider
  if (persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          buster: "", // Change this to clear cache when schema changes
        }}
      >
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
