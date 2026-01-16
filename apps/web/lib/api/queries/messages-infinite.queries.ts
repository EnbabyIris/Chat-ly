/**
 * Infinite Query Hooks for Messages
 * 
 * TanStack Query infinite queries for paginated message loading.
 * Supports infinite scrolling for chat messages.
 */

import { useInfiniteQuery, type UseInfiniteQueryOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from './query-keys';
import type { Message } from '../../../lib/shared/types';

interface MessageListData {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Infinite query hook to get messages for a chat with pagination
 * 
 * @param chatId - Chat ID to fetch messages for
 * @param options - TanStack Query infinite query options
 * @returns Infinite query result with messages
 */
export function useInfiniteMessages(
  chatId: string,
  options?: Omit<UseInfiniteQueryOptions<MessageListData, Error, MessageListData, MessageListData, readonly unknown[], string | undefined>, 'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'>
) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages.infinite(chatId),
    queryFn: async ({ pageParam }) => {
      return await apiClient.getChatMessages(chatId, {
        before: pageParam,
        limit: 20, // Load 20 messages per page
      });
    },
    getNextPageParam: (lastPage) => {
      // Return next cursor if there are more messages
      return lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined;
    },
    initialPageParam: undefined,
    enabled: !!chatId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}
