import { useMemo } from 'react';
import type { UserListItem, ChatListItem, ChatUser } from '@repo/shared';

interface UseChatFiltersParams {
  users: UserListItem[];
  chats: ChatListItem[];
  searchQuery: string;
  currentUser: ChatUser;
}

interface UseChatFiltersReturn {
  filteredUsers: UserListItem[];
  filteredChats: ChatListItem[];
}

export const useChatFilters = ({
  users,
  chats,
  searchQuery,
  currentUser,
}: UseChatFiltersParams): UseChatFiltersReturn => {
  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    
    return chats.filter(chat => {
      const otherUser = chat.users.find(u => u._id !== currentUser._id);
      const searchName = chat.isGroupChat ? chat.chatName : otherUser?.name;
      return searchName?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [chats, searchQuery, currentUser._id]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    
    return users.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  return {
    filteredUsers,
    filteredChats,
  };
};