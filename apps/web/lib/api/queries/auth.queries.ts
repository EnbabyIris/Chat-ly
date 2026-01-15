/**
 * Authentication Query Hooks
 * 
 * TanStack Query hooks for authentication-related data fetching.
 * Handles current user data, token validation, and auth state.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from './query-keys';
import type { User } from '@repo/shared/types';

/**
 * Query hook to get current authenticated user
 * 
 * @param options - TanStack Query options for customization
 * @returns Query result with current user data
 */
export function useCurrentUser(
  options?: Omit<UseQueryOptions<User, Error, User, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: async () => {
      return await apiClient.getCurrentUser();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - user data doesn't change frequently
    ...options,
  });
}
