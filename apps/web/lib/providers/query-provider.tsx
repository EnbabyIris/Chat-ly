'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';
import { ClientApiError } from '../api/client';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Determine if an error should trigger a retry
 * Don't retry on 4xx errors (client errors) - these are usually permanent
 * Retry on 5xx errors (server errors) and network errors
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  // Don't retry if we've already tried 3 times
  if (failureCount >= 3) return false;

  // Don't retry on 4xx client errors (bad request, unauthorized, etc.)
  if (error instanceof ClientApiError) {
    const status = error.status;
    // Retry on 5xx server errors, but not on 4xx client errors
    return status >= 500;
  }

  // Retry on network errors and other unknown errors
  return true;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: shouldRetry,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: process.env.NODE_ENV === 'production',
            refetchOnReconnect: true,
            refetchOnMount: true,
            // Use cached data when offline
            networkMode: 'offlineFirst',
          },
          mutations: {
            retry: (failureCount, error) => {
              // Mutations: only retry on network errors, not on 4xx/5xx
              if (error instanceof ClientApiError) {
                return false; // Don't retry mutations on API errors
              }
              return failureCount < 1; // Retry once for network errors
            },
            retryDelay: 1000,
            networkMode: 'offlineFirst',
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
