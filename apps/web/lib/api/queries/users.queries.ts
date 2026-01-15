/**
 * User Query Hooks
 * 
 * TanStack Query hooks for user-related data fetching and mutations.
 * Handles user lists, search, profile, and user details.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from './query-keys';
import type { User, UserListItem, UpdateProfileDTO } from '@repo/shared/types';

/**
 * Query hook to get all users
 * 
 * @param filters - Optional filters (search, pagination)
 * @param options - TanStack Query options for customization
 * @returns Query result with user list
 */
export function useUsers(
  filters?: { search?: string; page?: number; limit?: number },
  options?: Omit<UseQueryOptions<{ users: UserListItem[]; total: number; page: number; limit: number }, Error, { users: UserListItem[]; total: number; page: number; limit: number }, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      return await apiClient.getAllUsers(filters);
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - user lists don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    ...options,
  });
}

/**
 * Query hook to search users
 * 
 * @param query - Search query string
 * @param options - TanStack Query options for customization
 * @returns Query result with search results
 */
export function useSearchUsers(
  query: string,
  options?: Omit<UseQueryOptions<UserListItem[], Error, UserListItem[], readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.search(query),
    queryFn: async () => {
      return await apiClient.searchUsers(query);
    },
    enabled: !!query && query.length > 0, // Only run if query exists
    staleTime: 2 * 60 * 1000, // 2 minutes - search results can be cached briefly
    ...options,
  });
}

/**
 * Query hook to get user by ID
 * 
 * @param userId - User ID to fetch
 * @param options - TanStack Query options for customization
 * @returns Query result with user details
 */
export function useUser(
  userId: string,
  options?: Omit<UseQueryOptions<User, Error, User, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: async () => {
      return await apiClient.getUserById(userId);
    },
    enabled: !!userId, // Only run if userId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Mutation hook to update user profile
 * 
 * @param options - TanStack Query mutation options
 * @returns Mutation object with update function
 */
export function useUpdateProfile(
  options?: Omit<UseMutationOptions<User, Error, UpdateProfileDTO, unknown>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileDTO) => {
      return await apiClient.updateProfile(data);
    },
    onSuccess: (updatedUser) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
      queryClient.setQueryData(queryKeys.users.detail(updatedUser.id), updatedUser);
    },
    ...options,
  });
}
