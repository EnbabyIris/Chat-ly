import { useMemo } from 'react';
import { useUsers, useChats, useCurrentUser } from '@/lib/api/queries';
import type { UserListItem, ChatListItem, ChatUser, Message } from '@repo/shared';

interface UseChatDataReturn {
  users: UserListItem[];
  chats: ChatListItem[];
  messages: Message[];
  currentUser: ChatUser | null;
  onlinePeople: string[];
  isLoading: boolean;
  error: string | null;
}

export const useChatData = (): UseChatDataReturn => {
  // Use real query hooks instead of mock data
  const { data: usersData, isLoading: usersLoading, error: usersError } = useUsers();
  const { data: chatsData, isLoading: chatsLoading, error: chatsError } = useChats();
  const { data: currentUserData, isLoading: currentUserLoading, error: currentUserError } = useCurrentUser();

  // Messages will be loaded per-chat when a chat is selected
  const messages: Message[] = [];
  
  // Online people will be populated by real-time presence system
  const onlinePeople: string[] = [];

  // Combine loading states
  const isLoading = usersLoading || chatsLoading || currentUserLoading;
  
  // Combine error states
  const error = usersError?.message || chatsError?.message || currentUserError?.message || null;

  return useMemo(() => ({
    users: usersData?.users || [],
    chats: chatsData || [],
    messages,
    currentUser: currentUserData ? {
      _id: currentUserData.id,
      name: currentUserData.name,
      pic: currentUserData.avatar || '',
      email: currentUserData.email,
      isOnline: currentUserData.isOnline,
    } : null,
    onlinePeople,
    isLoading,
    error,
  }), [usersData, chatsData, currentUserData, isLoading, error]);
};