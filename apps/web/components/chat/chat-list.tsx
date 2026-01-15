import { MessageCircle } from 'lucide-react';
import { ChatListItem } from '@/components/chat/chat-list-item';
import type { ChatListItem as ChatType, ChatUser } from '@repo/shared';

interface ChatListProps {
  chats: ChatType[];
  currentUser: ChatUser;
  selectedChat: ChatType | null;
  onlinePeople: string[];
  onChatSelect: (chat: ChatType) => void;
}

export const ChatList = ({
  chats,
  currentUser,
  selectedChat,
  onlinePeople,
  onChatSelect,
}: ChatListProps) => {
  // Safety check: ensure chats is an array
  const safeChats = Array.isArray(chats) ? chats : [];
  
  if (safeChats.length === 0) {
    return (
      <div className="text-center text-neutral-500 mt-12">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
        <p className="text-sm">No chats found</p>
        <p className="text-xs text-neutral-400 mt-1">
          Start a conversation with someone
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {safeChats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat as ChatType}
          loggedUser={currentUser}
          user={currentUser}
          selectedChat={selectedChat as ChatType | null}
          onlinepeople={onlinePeople}
          setSelectedChat={onChatSelect as (chat: ChatType) => void}
        />
      ))}
    </div>
  );
};