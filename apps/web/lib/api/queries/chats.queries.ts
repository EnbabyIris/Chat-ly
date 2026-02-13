/**
 * Chat Query Hooks
 *
 * TanStack Query hooks for chat-related data fetching and mutations.
 * Handles chat lists, chat details, chat creation, updates, and deletion.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "./query-keys";
import type {
  Chat,
  ChatListItem,
  CreateChatDTO,
  UpdateChatDTO,
} from "../../../lib/shared/types";

/**
 * Query hook to get all chats for current user
 *
 * @param filters - Optional filters (search, type)
 * @param options - TanStack Query options for customization
 * @returns Query result with chat list
 */
export function useChats(
  filters?: { search?: string; type?: "all" | "group" | "direct" },
  options?: Omit<
    UseQueryOptions<ChatListItem[], Error, ChatListItem[], readonly unknown[]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: queryKeys.chats.list(filters),
    queryFn: async () => {
      return await apiClient.getChats(filters);
    },
    staleTime: 30 * 1000, // 30 seconds - keep data fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    // Refetch on reconnect to ensure fresh data after network issues
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    ...options,
  });
}

/**
 * Query hook to get chat by ID
 *
 * @param chatId - Chat ID to fetch
 * @param options - TanStack Query options for customization
 * @returns Query result with chat details
 */
export function useChat(
  chatId: string,
  options?: Omit<
    UseQueryOptions<Chat, Error, Chat, readonly unknown[]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: queryKeys.chats.detail(chatId),
    queryFn: async () => {
      // TODO: Replace with apiClient.getChatById(chatId) when implemented
      throw new Error("getChatById API method not implemented yet");
    },
    enabled: !!chatId, // Only run if chatId exists
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}

/**
 * Mutation hook to create a new chat
 *
 * @param options - TanStack Query mutation options
 * @returns Mutation object with create function
 */
export function useCreateChat(
  options?: Omit<
    UseMutationOptions<
      Chat,
      Error,
      CreateChatDTO,
      { previousChats: ChatListItem[] | undefined }
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChatDTO) => {
      return await apiClient.createChat(data);
    },
    onMutate: async (
      newChatData,
    ): Promise<{ previousChats: ChatListItem[] | undefined }> => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.chats.lists() });

      // Snapshot previous value
      const previousChats = queryClient.getQueryData<ChatListItem[]>(
        queryKeys.chats.lists(),
      );

      // Optimistically add chat to list (will be replaced by server response)
      if (previousChats) {
        const optimisticChat: ChatListItem = {
          id: `temp-${Date.now()}`,
          name: newChatData.name || null,
          isGroupChat: newChatData.isGroupChat || false,
          avatar: newChatData.avatar || null,
          participants: [], // Will be populated by server
          unreadCount: 0,
          updatedAt: new Date(),
        };

        queryClient.setQueryData<ChatListItem[]>(queryKeys.chats.lists(), [
          ...previousChats,
          optimisticChat,
        ]);
      }

      return { previousChats: previousChats ?? undefined };
    },
    onError: (err, newChatData, context) => {
      // Rollback on error
      if (context?.previousChats) {
        queryClient.setQueryData(
          queryKeys.chats.lists(),
          context.previousChats,
        );
      }
    },
    onSuccess: (newChat) => {
      // Invalidate all chat-related queries to refetch with server response
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });

      // Set the new chat in cache
      queryClient.setQueryData(queryKeys.chats.detail(newChat.id), newChat);
    },
    ...options,
  });
}

/**
 * Mutation hook to update a chat
 *
 * @param options - TanStack Query mutation options
 * @returns Mutation object with update function
 */
export function useUpdateChat(
  options?: Omit<
    UseMutationOptions<
      Chat,
      Error,
      { chatId: string; data: UpdateChatDTO },
      unknown
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      data,
    }: {
      chatId: string;
      data: UpdateChatDTO;
    }) => {
      // TODO: Replace with apiClient.updateChat(chatId, data) when implemented
      throw new Error("updateChat API method not implemented yet");
    },
    onSuccess: (updatedChat, variables) => {
      // Update cache with new data
      queryClient.setQueryData(
        queryKeys.chats.detail(variables.chatId),
        updatedChat,
      );
      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
    },
    ...options,
  });
}

/**
 * Mutation hook to delete a chat
 *
 * @param options - TanStack Query mutation options
 * @returns Mutation object with delete function
 */
export function useDeleteChat(
  options?: Omit<
    UseMutationOptions<void, Error, string, unknown>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      return await apiClient.deleteChat(chatId);
    },
    onSuccess: (_, chatId) => {
      // Remove chat from cache
      queryClient.removeQueries({ queryKey: queryKeys.chats.detail(chatId) });
      // Invalidate list to refetch without deleted chat
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
    },
    ...options,
  });
}
