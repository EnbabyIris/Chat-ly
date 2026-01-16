/**
 * Message Query Hooks
 * 
 * TanStack Query hooks for message-related data fetching and mutations.
 * Handles message lists, message sending, updates, and deletion.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from './query-keys';
import type { Message, SendMessageDTO, UpdateMessageDTO } from '../../../lib/shared/types';

/**
 * Query hook to get messages for a chat
 * 
 * @param chatId - Chat ID to fetch messages for
 * @param filters - Optional filters (pagination, before cursor)
 * @param options - TanStack Query options for customization
 * @returns Query result with message list
 */
export function useMessages(
  chatId: string,
  filters?: { before?: string; limit?: number },
  options?: Omit<UseQueryOptions<{ messages: Message[]; hasMore: boolean; nextCursor?: string }, Error, { messages: Message[]; hasMore: boolean; nextCursor?: string }, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.messages.list(chatId, filters),
    queryFn: async () => {
      return await apiClient.getChatMessages(chatId, filters);
    },
    enabled: !!chatId, // Only run if chatId exists
    staleTime: 5 * 60 * 1000, // 5 minutes - messages come via Socket.IO, not refetch
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    // REMOVED: refetchInterval - messages come via Socket.IO only
    refetchOnWindowFocus: false, // Don't refetch on focus - Socket.IO handles real-time
    refetchOnReconnect: false, // Don't refetch on reconnect - Socket.IO handles this
    ...options,
  });
}

/**
 * Query hook to get a single message by ID
 * 
 * @param messageId - Message ID to fetch
 * @param options - TanStack Query options for customization
 * @returns Query result with message details
 */
export function useMessage(
  messageId: string,
  options?: Omit<UseQueryOptions<Message, Error, Message, readonly unknown[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.messages.detail(messageId),
    queryFn: async () => {
      // TODO: Replace with apiClient.getMessageById(messageId) when implemented
      throw new Error('getMessageById API method not implemented yet');
    },
    enabled: !!messageId, // Only run if messageId exists
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
}

/**
 * Mutation hook to send a message
 * 
 * @param options - TanStack Query mutation options
 * @returns Mutation object with send function
 */
type MessageListData = { messages: Message[]; hasMore: boolean; nextCursor?: string };

export function useSendMessage(
  options?: Omit<UseMutationOptions<Message, Error, SendMessageDTO, { previousMessages: MessageListData | undefined }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendMessageDTO) => {
      return await apiClient.sendMessage(data);
    },
    onMutate: async (newMessage): Promise<{ previousMessages: MessageListData | undefined }> => {
      // Optimistic update: add message to cache immediately
      await queryClient.cancelQueries({ queryKey: queryKeys.messages.list(newMessage.chatId) });
      
      // Snapshot previous value for rollback
      const previousMessages = queryClient.getQueryData<MessageListData>(
        queryKeys.messages.list(newMessage.chatId)
      );

      // Optimistically add message (will be replaced by server response)
      if (previousMessages) {
        const optimisticMessage: Message = {
          id: `temp-${Date.now()}`,
          chatId: newMessage.chatId,
          senderId: null, // Will be set by server
          content: newMessage.content,
          messageType: newMessage.messageType || 'text',
          attachmentUrl: newMessage.attachmentUrl || null,
          attachmentName: newMessage.attachmentName || null,
          attachmentSize: newMessage.attachmentSize || null,
          isEdited: false,
          isDeleted: false,
          editedAt: null,
          replyToId: newMessage.replyToId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        queryClient.setQueryData<MessageListData>(
          queryKeys.messages.list(newMessage.chatId),
          {
            ...previousMessages,
            messages: [...previousMessages.messages, optimisticMessage],
          }
        );
      }

      return { previousMessages: previousMessages ?? undefined };
    },
    onError: (err, newMessage, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.list(newMessage.chatId),
          context.previousMessages
        );
      }
    },
    onSuccess: (sentMessage, variables) => {
      // Don't invalidate - messages come via Socket.IO now
      // Only update the optimistic update with real server response
      const messageListKey = queryKeys.messages.list(variables.chatId);
      const currentData = queryClient.getQueryData<MessageListData>(messageListKey);

      if (currentData) {
        // Replace optimistic message with server response
        const updatedMessages = currentData.messages.map(msg => 
          msg.id.startsWith('temp-') && msg.chatId === sentMessage.chatId
            ? sentMessage 
            : msg
        );

        queryClient.setQueryData<MessageListData>(messageListKey, {
          ...currentData,
          messages: updatedMessages,
        });
      }
    },
    ...options,
  });
}

/**
 * Mutation hook to update a message
 * 
 * @param options - TanStack Query mutation options
 * @returns Mutation object with update function
 */
export function useUpdateMessage(
  options?: Omit<UseMutationOptions<Message, Error, { messageId: string; data: UpdateMessageDTO }, unknown>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, data }: { messageId: string; data: UpdateMessageDTO }) => {
      return await apiClient.updateMessage(messageId, data);
    },
    onSuccess: (updatedMessage, variables) => {
      // Update message in cache
      queryClient.setQueryData(queryKeys.messages.detail(variables.messageId), updatedMessage);
      // Invalidate message lists that might contain this message
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.lists() });
    },
    ...options,
  });
}

/**
 * Mutation hook to delete a message
 * 
 * @param options - TanStack Query mutation options
 * @returns Mutation object with delete function
 */
export function useDeleteMessage(
  options?: Omit<UseMutationOptions<void, Error, { messageId: string; chatId: string }, unknown>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId }: { messageId: string; chatId: string }) => {
      return await apiClient.deleteMessage(messageId);
    },
    onSuccess: (_, variables) => {
      // Remove message from cache
      queryClient.removeQueries({ queryKey: queryKeys.messages.detail(variables.messageId) });
      // Invalidate message list to refetch without deleted message
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.list(variables.chatId) });
    },
    ...options,
  });
}

/**
 * Mutation hook to mark a message as read
 * 
 * @param options - TanStack Query mutation options
 * @returns Mutation object with mark as read function
 */
export function useMarkMessageRead(
  options?: Omit<UseMutationOptions<void, Error, string, unknown>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      return await apiClient.markMessageRead(messageId);
    },
    onSuccess: (_, messageId) => {
      // Invalidate message queries to refetch with updated read receipts
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.detail(messageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.lists() });
    },
    ...options,
  });
}
