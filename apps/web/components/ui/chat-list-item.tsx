'use client';

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface User {
  _id: string;
  name: string;
  pic?: string;
}

interface LatestMessage {
  content: string;
  sender: {
    name: string;
  };
}

interface Chat {
  _id: string;
  isGroupChat: boolean;
  chatName?: string;
  users: User[];
  latestMessage?: LatestMessage;
}

interface ChatListItemProps {
  chat: Chat;
  loggedUser: User;
  user: User;
  selectedChat: Chat | null;
  onlinepeople: string[];
  setSelectedChat: (chat: Chat) => void;
}

export const ChatListItem = memo(({
  chat,
  loggedUser,
  selectedChat,
  onlinepeople,
  setSelectedChat,
}: ChatListItemProps) => {
  const otherUser = useMemo(
    () => chat.users.find((u) => u._id !== loggedUser._id) || chat.users[0],
    [chat.users, loggedUser._id]
  );

  const isOnline = useMemo(
    () => onlinepeople.includes(otherUser._id),
    [onlinepeople, otherUser._id]
  );

  const isSelected = useMemo(
    () => selectedChat?._id === chat._id,
    [selectedChat?._id, chat._id]
  );

  const displayName = useMemo(
    () => (chat.isGroupChat ? chat.chatName || 'Group Chat' : otherUser.name),
    [chat.isGroupChat, chat.chatName, otherUser.name]
  );

  const displayPic = useMemo(
    () =>
      chat.isGroupChat
        ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=6366f1&textColor=fff`
        : otherUser.pic,
    [chat.isGroupChat, displayName, otherUser.pic]
  );

  const handleClick = useMemo(() => () => setSelectedChat(chat), [chat, setSelectedChat]);

  return (
    <div
      onClick={handleClick}
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
              {chat.latestMessage.sender.name}: {chat.latestMessage.content}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

ChatListItem.displayName = 'ChatListItem';

