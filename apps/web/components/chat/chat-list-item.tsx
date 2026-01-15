'use client';

import { memo, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/api/queries';
import { apiClient } from '@/lib/api/client';
import type { ChatListItem as ChatType, ChatUser } from '@repo/shared';

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
  // Handle both new structure (participants) and old structure (users)
  const participants = 'participants' in chat ? chat.participants : [];
  const users = 'users' in chat ? (chat as { users: Array<{ _id: string; name: string; pic?: string }> }).users : participants.map(p => p.user).filter(Boolean) as Array<{ id?: string; _id?: string; name: string; pic?: string; avatar?: string | null }>;
  
  const otherUser = useMemo(() => {
    if (users.length === 0) return null;
    const firstUser = users[0];
    if (!firstUser) return null;
    
    if ('id' in firstUser && firstUser.id) {
      // New structure with UserListItem
      return users.find((u) => 'id' in u && u.id && u.id !== loggedUser._id) || users[0];
    } else if ('_id' in firstUser && firstUser._id) {
      // Old structure with _id
      return users.find((u) => '_id' in u && u._id && u._id !== loggedUser._id) || users[0];
    }
    return users[0];
  }, [users, loggedUser._id]);

  const userId = otherUser ? ('id' in otherUser ? otherUser.id : ('_id' in otherUser ? otherUser._id : undefined)) : undefined;
  const userName = otherUser ? ('name' in otherUser ? otherUser.name : 'Unknown') : 'Unknown';
  const userPic = otherUser ? ('pic' in otherUser ? otherUser.pic : ('avatar' in otherUser ? otherUser.avatar : undefined)) : undefined;

  const isOnline = useMemo(
    () => userId ? onlinepeople.includes(userId) : false,
    [onlinepeople, userId]
  );

  const chatId = 'id' in chat ? chat.id : chat._id;
  const isSelected = useMemo(
    () => selectedChat && (('id' in selectedChat ? selectedChat.id : selectedChat._id) === chatId),
    [selectedChat, chatId]
  );

  const chatName = 'name' in chat ? chat.name : ('chatName' in chat ? (chat as { chatName?: string }).chatName : null);
  const displayName = useMemo(
    () => (chat.isGroupChat ? (chatName || 'Group Chat') : (userName || 'Unknown')),
    [chat.isGroupChat, chatName, userName]
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
    <div
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
              {'senderName' in chat.latestMessage 
                ? `${chat.latestMessage.senderName}: ${chat.latestMessage.content}`
                : ('sender' in chat.latestMessage && chat.latestMessage.sender
                  ? `${chat.latestMessage.sender.name}: ${chat.latestMessage.content}`
                  : chat.latestMessage.content)
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

ChatListItem.displayName = 'ChatListItem';
