import { useEffect, useMemo } from 'react';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { EmptyChatState } from './empty-chat-state';
import { TypingIndicator } from './typing-indicator';
import MessageInput from '@/components/features/message-input';
import { useMessageReadReceipts } from '@/hooks/use-message-read-receipts';
import { useAutoMarkRead } from '@/hooks/use-auto-mark-read';
import { useRealTimeMessages } from '@/hooks/use-real-time-messages';
import { useTypingIndicator } from '@/hooks/use-typing-indicator';
import type { ChatListItem, Message, ChatUser } from '@repo/shared';

interface ChatAreaProps {
  selectedChat: ChatListItem | null;
  messages: Message[];
  currentUser: ChatUser;
  onlinePeople: string[];
  onSendMessage: (message: string) => void;
  onSendFile: (file: File) => void;
}

export const ChatArea = ({
  selectedChat,
  messages,
  currentUser,
  onlinePeople,
  onSendMessage,
  onSendFile,
}: ChatAreaProps) => {
  // Initialize real-time hooks
  useMessageReadReceipts(); // Listen for real-time read receipt updates
  const { isConnected } = useRealTimeMessages({
    chatId: selectedChat?.id,
    enabled: !!selectedChat
  }); // Listen for real-time message updates

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(selectedChat?.id);

  const { markChatAsRead } = useAutoMarkRead({
    chatId: selectedChat?.id,
    enabled: !!selectedChat,
  });

  // Memoize unread message calculation for performance
  const unreadMessageIds = useMemo(() => {
    if (!selectedChat || !messages.length) return [];

    // Get unread messages from other users (don't mark own messages)
    return messages
      .filter((message) => message.senderId !== currentUser._id)
      .map((msg) => msg.id);
  }, [selectedChat?.id, messages, currentUser._id]);

  // Auto-mark messages as read when chat is opened or messages change
  useEffect(() => {
    // Early return if no unread messages
    if (unreadMessageIds.length === 0) return;

    markChatAsRead(unreadMessageIds);
  }, [unreadMessageIds, markChatAsRead]);
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

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <p className="text-sm text-yellow-700">
            ⚠️ Reconnecting to chat... Some messages may be delayed.
          </p>
        </div>
      )}

      <MessageList messages={messages} currentUser={currentUser} />

      <TypingIndicator
        typingUsers={typingUsers}
        currentUserId={currentUser._id}
      />

      <MessageInput
        selectedChat={selectedChat}
        sendMessage={onSendMessage}
        sendFile={onSendFile}
        onTypingStart={() => startTyping(selectedChat!.id)}
        onTypingStop={() => stopTyping(selectedChat!.id)}
      />
    </div>
  );
};