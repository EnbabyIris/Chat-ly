import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/socket-context';
import { SOCKET_EVENTS } from '../lib/shared/constants';
import { queryKeys } from '@/lib/api/queries';
import type { ChatListItem, Message } from '../lib/shared/types';

interface UseRealTimeMessagesParams {
  selectedChatId?: string;
  currentUserId?: string;
}

interface MessageListData {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

interface MessageReadData {
  messageId: string;
  userId: string;
  userName: string;
  readAt: Date;
}

interface MessageDeletedData {
  messageId: string;
  chatId: string;
}

interface ChatDeletedData {
  chatId: string;
}

interface UseRealTimeMessagesReturn {
  isConnected: boolean;
}

export const useRealTimeMessages = ({ 
  selectedChatId, 
  currentUserId 
}: UseRealTimeMessagesParams): UseRealTimeMessagesReturn => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  const handleNewMessage = useCallback((message: Message) => {
    console.log('⚡ INSTANT message received:', message);

    const messageListKey = queryKeys.messages.list(message.chatId);
    const currentData = queryClient.getQueryData<MessageListData>(messageListKey);

    if (currentData) {
      const existingIds = new Set(currentData.messages.map(msg => msg.id));
      const messageExists = existingIds.has(message.id);

      if (!messageExists) {
        queryClient.setQueryData<MessageListData>(messageListKey, {
          ...currentData,
          messages: [...currentData.messages, message],
        });
      } else {
        console.log('⚠️ Duplicate message ignored:', message.id);
      }
    }

    queryClient.setQueriesData(
      { queryKey: queryKeys.chats.lists() },
      (existing: unknown) => {
        const existingChats = (Array.isArray(existing) ? existing : []) as ChatListItem[];
        if (existingChats.length === 0) return existing;

        const idx = existingChats.findIndex((c) => c.id === message.chatId);
        if (idx === -1) {
          console.log('📢 Message received for unknown chat, invalidating chats query:', message.chatId);
          queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
          return existing;
        }

        const chat = existingChats[idx];
        if (!chat) return existing;
        const updatedChat: ChatListItem = {
          ...chat,
          latestMessage: {
            id: message.id,
            content: message.content,
            senderId: message.senderId ?? '',
            senderName: message.sender?.name ?? (chat.latestMessage?.senderName || 'User'),
            messageType: message.messageType || 'text',
            createdAt: new Date(message.createdAt),
          },
          updatedAt: new Date(message.createdAt),
        };

        return [updatedChat, ...existingChats.filter((c) => c.id !== message.chatId)];
      }
    );

  }, [queryClient]);

  const handleMessageDbSaved = useCallback((data: { tempId: string; realMessage: Message }) => {
    console.log('💾 Message saved to DB, updating temp message:', data.tempId, '→', data.realMessage.id);

    const messageListKey = queryKeys.messages.list(data.realMessage.chatId);
    const currentData = queryClient.getQueryData<MessageListData>(messageListKey);

    if (currentData) {
      const messageIndex = currentData.messages.findIndex(msg => msg.id === data.tempId);
      
      if (messageIndex !== -1) {
        const updatedMessages = [...currentData.messages];
        updatedMessages[messageIndex] = data.realMessage;

        queryClient.setQueryData<MessageListData>(messageListKey, {
          ...currentData,
          messages: updatedMessages,
        });
      }
    }
  }, [queryClient]);

  const handleMessageSaveFailed = useCallback((data: { tempId: string; error: string }) => {
    console.error('❌ Message save failed:', data.tempId, data.error);
  }, []);

  const handleMessageUpdated = useCallback((updatedMessage: Message) => {
    console.log('✏️ Message updated:', updatedMessage);

    const messageListKey = queryKeys.messages.list(updatedMessage.chatId);
    const currentData = queryClient.getQueryData<MessageListData>(messageListKey);

    if (currentData) {
      const updatedMessages = currentData.messages.map(msg => 
        msg.id === updatedMessage.id ? updatedMessage : msg
      );

      queryClient.setQueryData<MessageListData>(messageListKey, {
        ...currentData,
        messages: updatedMessages,
      });
    }

    queryClient.setQueryData(queryKeys.messages.detail(updatedMessage.id), updatedMessage);
  }, [queryClient]);

  const handleMessageDeleted = useCallback((data: MessageDeletedData) => {
    console.log('🗑️ Message deleted:', data);

    const messageListKey = queryKeys.messages.list(data.chatId);
    const currentData = queryClient.getQueryData<MessageListData>(messageListKey);

    if (currentData) {
      const updatedMessages = currentData.messages.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, isDeleted: true, content: 'This message has been deleted' }
          : msg
      );

      queryClient.setQueryData<MessageListData>(messageListKey, {
        ...currentData,
        messages: updatedMessages,
      });
    }

    queryClient.removeQueries({ queryKey: queryKeys.messages.detail(data.messageId) });
  }, [queryClient]);

  const handleMessageRead = useCallback((data: MessageReadData) => {
    console.log('👁️ Message read:', data);
  }, []);

  const handleChatCreated = useCallback((chat: any) => {
    console.log('🆕 Chat created:', chat);
    queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
  }, [queryClient]);

  const handleChatUpdated = useCallback((chat: any) => {
    console.log('✏️ Chat updated:', chat);
    queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
  }, [queryClient]);

  const handleChatDeleted = useCallback((data: ChatDeletedData) => {
    console.log('🗑️ Chat deleted:', data);
    queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
  }, [queryClient]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);

    (socket as any).on('message:db_saved', handleMessageDbSaved);
    (socket as any).on('message:save_failed', handleMessageSaveFailed);

    socket.on('message:read:update', handleMessageRead);

    socket.on(SOCKET_EVENTS.CHAT_CREATED, handleChatCreated);
    socket.on(SOCKET_EVENTS.CHAT_UPDATED, handleChatUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      (socket as any).off('message:db_saved', handleMessageDbSaved);
      (socket as any).off('message:save_failed', handleMessageSaveFailed);
      socket.off('message:read:update', handleMessageRead);
      socket.off(SOCKET_EVENTS.CHAT_CREATED, handleChatCreated);
      socket.off(SOCKET_EVENTS.CHAT_UPDATED, handleChatUpdated);
    };
  }, [
    socket,
    isConnected,
    handleNewMessage,
    handleMessageUpdated,
    handleMessageDeleted,
    handleMessageDbSaved,
    handleMessageSaveFailed,
    handleMessageRead,
    handleChatCreated,
    handleChatUpdated,
    handleChatDeleted
  ]);

  return {
    isConnected,
  };
}