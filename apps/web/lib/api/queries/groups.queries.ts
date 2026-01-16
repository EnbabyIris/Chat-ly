/**
 * Group Query Hooks
 *
 * TanStack Query hooks for group-related data fetching and mutations.
 * Handles group creation, participant management, admin transfer, and archiving.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from './query-keys';
import type {
  CreateGroupChatDTO,
  GroupChatCreationResponse,
  ParticipantOperationResponse,
  ArchiveOperationResponse
} from '@repo/shared/types';

/**
 * Mutation hook to create a new group chat
 *
 * @param options - TanStack Query mutation options
 * @returns Mutation object with create function
 */
export function useCreateGroupChat(
  options?: Omit<import('@tanstack/react-query').UseMutationOptions<GroupChatCreationResponse, Error, CreateGroupChatDTO>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGroupChatDTO) => {
      return await apiClient.createGroupChat(data);
    },
    onSuccess: (data) => {
      // Invalidate all chat-related queries to refetch with new group
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });

      // Set the new group in cache
      if (data.chat) {
        queryClient.setQueryData(queryKeys.chats.detail(data.chat.id), data.chat);
      }
    },
    ...options,
  });
}

/**
 * Mutation hook to add participants to a group
 *
 * @param options - TanStack Query mutation options
 * @returns Mutation object with add participants function
 */
export function useAddGroupParticipants(
  options?: Omit<import('@tanstack/react-query').UseMutationOptions<ParticipantOperationResponse, Error, { chatId: string; participantIds: string[] }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, participantIds }: { chatId: string; participantIds: string[] }) => {
      return await apiClient.addGroupParticipants(chatId, participantIds);
    },
    onSuccess: (_, variables) => {
      // Update the chat in cache to include new participants
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.detail(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
    },
    ...options,
  });
}

/**
 * Mutation hook to remove a participant from a group
 *
 * @param options - TanStack Query mutation options
 * @returns Mutation object with remove participant function
 */
export function useRemoveGroupParticipant(
  options?: Omit<import('@tanstack/react-query').UseMutationOptions<ParticipantOperationResponse, Error, { chatId: string; participantId: string }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, participantId }: { chatId: string; participantId: string }) => {
      return await apiClient.removeGroupParticipant(chatId, participantId);
    },
    onSuccess: (_, variables) => {
      // Update the chat in cache to reflect participant removal
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.detail(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
    },
    ...options,
  });
}

/**
 * Mutation hook to transfer admin role
 *
 * @param options - TanStack Query mutation options
 * @returns Mutation object with transfer admin function
 */
export function useTransferGroupAdmin(
  options?: Omit<import('@tanstack/react-query').UseMutationOptions<ParticipantOperationResponse, Error, { chatId: string; newAdminId: string }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, newAdminId }: { chatId: string; newAdminId: string }) => {
      return await apiClient.transferGroupAdmin(chatId, newAdminId);
    },
    onSuccess: (_, variables) => {
      // Update the chat in cache to reflect admin change
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.detail(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
    },
    ...options,
  });
}

/**
 * Mutation hook to archive a group chat
 *
 * @param options - TanStack Query mutation options
 * @returns Mutation object with archive function
 */
export function useArchiveGroupChat(
  options?: Omit<import('@tanstack/react-query').UseMutationOptions<ArchiveOperationResponse, Error, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      return await apiClient.archiveGroupChat(chatId);
    },
    onSuccess: (_, chatId) => {
      // Update the chat in cache to reflect archived status
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
    },
    ...options,
  });
}

/**
 * Mutation hook to delete a group chat
 *
 * @param options - TanStack Query mutation options
 * @returns Mutation object with delete function
 */
export function useDeleteGroupChat(
  options?: Omit<import('@tanstack/react-query').UseMutationOptions<ArchiveOperationResponse, Error, { chatId: string; hardDelete?: boolean }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, hardDelete }: { chatId: string; hardDelete?: boolean }) => {
      return await apiClient.deleteGroupChat(chatId, hardDelete);
    },
    onSuccess: (_, variables) => {
      // Remove the chat from cache
      queryClient.removeQueries({ queryKey: queryKeys.chats.detail(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.lists() });
    },
    ...options,
  });
}