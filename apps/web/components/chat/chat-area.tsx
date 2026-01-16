import { useEffect, useMemo } from 'react';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { EmptyChatState } from './empty-chat-state';
import MessageInput from '@/components/features/message-input';
import { useMessages } from '@/lib/api/queries';
import type { ChatListItem, Message, ChatUser } from '../../lib/shared';

interface ChatAreaProps {
  selectedChat: ChatListItem | null;
  messages?: Message[]; // Made optional since we fetch our own
  currentUser: ChatUser;
  onlinePeople: string[];
  onSendMessage: (message: string, chatId?: string, messageType?: 'text' | 'image' | 'file' | 'location', locationData?: { latitude: number; longitude: number; address?: string }) => void;
  onSendFile: (file: File) => void;
}

export const ChatArea = ({
  selectedChat,
  messages: _messages, // Ignore this prop, we'll fetch our own messages
  currentUser,
  onlinePeople,
  onSendMessage,
  onSendFile,
}: ChatAreaProps) => {
  // Fetch messages for the selected chat (only if chat is selected)
  const { data: messagesData, isLoading: messagesLoading } = useMessages(
    selectedChat?.id || '',
    undefined,
    { enabled: !!selectedChat?.id }
  );

  // Use fetched messages or empty array if loading/no chat selected
  const messages = messagesData?.messages || [];

  // Handle message sending with chat ID
  const handleSendMessage = (message: string, messageType?: 'text' | 'image' | 'file' | 'location', locationData?: { latitude: number; longitude: number; address?: string }) => {
    if (selectedChat?.id) {
      onSendMessage(message, selectedChat.id, messageType, locationData);
    }
  };
  if (!selectedChat) {
    return (
      <div className="flex-1 bg-neutral-100 flex items-center justify-center">
        <div className="w-full h-full">
          <EmptyChatState />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex relative flex-col">
      <ChatHeader
        selectedChat={selectedChat as any}
        currentUser={currentUser}
        onlinePeople={onlinePeople}
      />

      <MessageList messages={messages} currentUser={currentUser} />

      <MessageInput
        selectedChat={selectedChat}
        sendMessage={handleSendMessage}
        sendFile={onSendFile}
      />
    </div>
  );
};