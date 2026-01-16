/**
 * Notification Query Hooks
 *
 * TanStack Query hooks for notification-related data fetching and mutations.
 * Handles notification lists, marking as read, and real-time updates.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from './query-keys';
import type { Notification, NotificationSummary, NotificationFilters } from '@repo/shared/types';

/**
 * Query hook to get notifications for current user
 *
 * @param filters - Optional filters (limit, unreadOnly)
 * @param options - TanStack Query options for customization
 * @returns Query result with notification summary
 */
export function useNotifications(
  filters?: NotificationFilters,
  options?: Omit<UseQueryOptions<NotificationSummary, Error, NotificationSummary, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: async () => {
      return await apiClient.getNotifications(filters);
    },
    staleTime: 30 * 1000, // 30 seconds - notifications change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Query hook to get unread notification count
 *
 * @param options - TanStack Query options for customization
 * @returns Query result with unread count number
 */
export function useUnreadNotificationCount(
  options?: Omit<UseQueryOptions<number, Error, number, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const summary = await apiClient.getNotifications({ unreadOnly: true, limit: 100 });
      return summary.unreadCount;
    },
    staleTime: 10 * 1000, // 10 seconds - count changes frequently
    gcTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

/**
 * Mutation hook to mark a notification as read
 *
 * @param options - TanStack Query mutation options
 * @returns Mutation result
 */
export function useMarkNotificationAsRead(
  options?: {
    onSuccess?: (notificationId: string) => void;
    onError?: (error: Error, notificationId: string) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.markNotificationAsRead(notificationId);
      return notificationId;
    },
    onSuccess: (notificationId) => {
      // Update notification list cache
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });

      // Update unread count cache
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });

      options?.onSuccess?.(notificationId);
    },
    onError: (error, notificationId) => {
      options?.onError?.(error, notificationId);
    },
  });
}

/**
 * Mutation hook to mark all notifications as read
 *
 * @param options - TanStack Query mutation options
 * @returns Mutation result
 */
export function useMarkAllNotificationsAsRead(
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.markAllNotificationsAsRead();
    },
    onSuccess: () => {
      // Update notification list cache
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });

      // Update unread count cache
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });

      options?.onSuccess?.();
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
}