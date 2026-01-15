/**
 * Centralized Query Keys Factory
 * 
 * Provides type-safe query keys for TanStack Query cache management.
 * Organized by domain (auth, users, chats, messages) for better cache organization.
 */

// Base query key prefixes
export const queryKeys = {
  // Authentication queries
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
    user: (userId: string) => [...queryKeys.auth.all, 'user', userId] as const,
  },

  // User queries
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: { search?: string; page?: number; limit?: number }) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (userId: string) => [...queryKeys.users.details(), userId] as const,
    search: (query: string) => [...queryKeys.users.all, 'search', query] as const,
    profile: () => [...queryKeys.users.all, 'profile'] as const,
  },

  // Chat queries
  chats: {
    all: ['chats'] as const,
    lists: () => [...queryKeys.chats.all, 'list'] as const,
    list: (filters?: { search?: string; type?: 'all' | 'group' | 'direct' }) =>
      [...queryKeys.chats.lists(), filters] as const,
    details: () => [...queryKeys.chats.all, 'detail'] as const,
    detail: (chatId: string) => [...queryKeys.chats.details(), chatId] as const,
    participants: (chatId: string) => [...queryKeys.chats.detail(chatId), 'participants'] as const,
  },

  // Message queries
  messages: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.messages.all, 'list'] as const,
    list: (chatId: string, filters?: { before?: string; limit?: number }) =>
      [...queryKeys.messages.lists(), chatId, filters] as const,
    infinite: (chatId: string) => [...queryKeys.messages.lists(), chatId, 'infinite'] as const,
    details: () => [...queryKeys.messages.all, 'detail'] as const,
    detail: (messageId: string) => [...queryKeys.messages.details(), messageId] as const,
  },
} as const;
