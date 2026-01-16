'use client';

import { memo, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/api/queries';
import { apiClient } from '@/lib/api/client';
import type { ChatListItem as ChatType, ChatUser } from '../../lib/shared';
import { motion } from 'framer-motion';

interface ChatListItemProps {
  chat: ChatType;
  loggedUser: ChatUser;
  user: ChatUser;
  selectedChat: ChatType | null;
  onlinepeople: string[];
  setSelectedChat: (chat: ChatType) => void;
}

export const ChatListItem = memo(({
  chat,
  loggedUser,
  selectedChat,
  onlinepeople,
  setSelectedChat,
}: ChatListItemProps) => {
  const queryClient = useQueryClient();

  // Prefetch messages when hovering over chat item
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.messages.list(chat.id),
      queryFn: async () => {
        return await apiClient.getChatMessages(chat.id, { limit: 20 });
      },
      staleTime: 30 * 1000, // 30 seconds
    });
  };
  // Find the other user in the chat (not the logged-in user)
  const otherUser = useMemo(() => {
    if (!chat.participants || chat.participants.length === 0) return null;
    
    // For 1:1 chats, find the user that's not the logged-in user
    if (!chat.isGroupChat) {
      return chat.participants.find(participant => participant.id !== loggedUser._id) || chat.participants[0];
    }
    
    // For group chats, return the first participant for now
    return chat.participants[0];
  }, [chat.participants, chat.isGroupChat, loggedUser._id]);

  const userId = otherUser?.id;
  const userName = otherUser?.name || 'User';
  const userPic = otherUser?.avatar;

  const isOnline = useMemo(
    () => userId ? onlinepeople.includes(userId) : false,
    [onlinepeople, userId]
  );

  const isSelected = useMemo(
    () => selectedChat?.id === chat.id,
    [selectedChat, chat.id]
  );

  const displayName = useMemo(
    () => (chat.isGroupChat ? (chat.name || 'Group Chat') : userName),
    [chat.isGroupChat, chat.name, userName]
  );

  const displayPic = useMemo(
    () =>
      chat.isGroupChat
        ? (chat.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=6366f1&textColor=fff`)
        : userPic,
    [chat.isGroupChat, chat.avatar, displayName, userPic]
  );

  const handleClick = useMemo(() => () => setSelectedChat(chat), [chat, setSelectedChat]);

  return (
    <motion.div
    layout="position"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={cn(
        'cursor-pointer border group transition-all duration-100 px-3 py-2 rounded-lg relative font-light z-30 shadow-[0_2px_3px_0_rgba(0,0,0,0.15)]',
        isSelected
          ? 'bg-white border-neutral-300'
          : 'bg-neutral-100 hover:bg-white border-neutral-200'
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center shrink-0 relative">
          {displayPic ? (
            <img
              src={displayPic}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3)] object-cover border border-white w-10 h-10"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/2048px-Default_pfp.svg.png';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center text-xs font-medium text-neutral-600">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {!chat.isGroupChat && isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'font-medium',
              isSelected ? 'text-neutral-600' : 'group-hover:text-neutral-600 text-neutral-500'
            )}
          >
            {displayName}
          </p>
          {chat.latestMessage && (
            <p className="text-xs text-neutral-400 truncate">
              {chat.latestMessage.senderName 
                ? `${chat.latestMessage.senderName}: ${chat.latestMessage.content}`
                : chat.latestMessage.content
              }
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ChatListItem.displayName = 'ChatListItem';
