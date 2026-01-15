/**
 * Query Hooks Barrel Export
 * 
 * Central export point for all query hooks.
 * Provides clean imports: import { useUsers, useChats } from '@/lib/api/queries'
 */

// Query keys
export { queryKeys } from './query-keys';

// Auth queries
export { useCurrentUser } from './auth.queries';

// User queries
export { useUsers, useSearchUsers, useUser, useUpdateProfile } from './users.queries';

// Chat queries
export { useChats, useChat, useCreateChat, useUpdateChat, useDeleteChat } from './chats.queries';

// Message queries
export { useMessages, useMessage, useSendMessage, useUpdateMessage, useDeleteMessage, useMarkMessageRead } from './messages.queries';
export { useInfiniteMessages } from './messages-infinite.queries';
