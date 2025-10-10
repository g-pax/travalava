"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
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
          staleTime: 0, // Always consider data stale
          gcTime: 0, // Don't cache data after component unmount
          // retry: (failureCount, error) => {
          //   // Don't retry on 4xx errors except 429 (rate limiting)
          //   if (error && typeof error === "object" && "status" in error) {
          //     const status = (error as Record<string, unknown>).status;
          //     if (
          //       typeof status === "number" &&
          //       status >= 400 &&
          //       status < 500 &&
          //       status !== 429
          //     ) {
          //       return false;
          //     }
          //   }
          //   return failureCount < 2;
          // },
          // retryDelay: (attemptIndex) =>
          //   Math.min(1000 * 2 ** attemptIndex, 30000),
          refetchOnWindowFocus: true, // Always refetch when window gains focus
          refetchOnReconnect: true,
          refetchOnMount: true,
        },
        // mutations: {
        //   retry: (failureCount, error) => {
        //     // Don't retry mutations on client errors (4xx)
        //     if (error && typeof error === "object" && "status" in error) {
        //       const status = (error as Record<string, unknown>).status;
        //       if (typeof status === "number" && status >= 400 && status < 500) {
        //         return false;
        //       }
        //     }
        //     return failureCount < 1;
        //   },
        //   retryDelay: 1000,
        // },
      },
    });

    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
