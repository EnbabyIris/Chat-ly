/**
 * Real-time Messages Hook
 * 
 * Handles Socket.IO events for real-time message functionality including:
 * - Receiving new messages and updating cache
 * - Message updates (edits) and deletions
 * - Typing indicators for active users
 * - Read receipts and chat room management
 * - Automatic chat list synchronization
 */

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



interface TypingUpdateData {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
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
  sendTypingStart: () => void;
  sendTypingStop: () => void;
  isConnected: boolean;
}

export const useRealTimeMessages = ({ 
  selectedChatId, 
  currentUserId 
}: UseRealTimeMessagesParams): UseRealTimeMessagesReturn => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  // Handle new message received (instant delivery)
  const handleNewMessage = useCallback((message: Message) => {
    console.log('⚡ INSTANT message received:', message);

    // Update message list for the chat (only if data exists)
    const messageListKey = queryKeys.messages.list(message.chatId);
    const currentData = queryClient.getQueryData<MessageListData>(messageListKey);

    if (currentData) {
      // O(1) duplicate check using Set for better performance
      const existingIds = new Set(currentData.messages.map(msg => msg.id));
      const messageExists = existingIds.has(message.id);

      if (!messageExists) {
        // Add new message to the list INSTANTLY
        queryClient.setQueryData<MessageListData>(messageListKey, {
          ...currentData,
          messages: [...currentData.messages, message],
        });
      } else {
        console.log('⚠️ Duplicate message ignored:', message.id);
      }
    }

    // ALWAYS update chat list preview + ordering (regardless of message list state)
    queryClient.setQueriesData(
      { queryKey: queryKeys.chats.lists() },
      (existing: unknown) => {
        const existingChats = (Array.isArray(existing) ? existing : []) as ChatListItem[];
        if (existingChats.length === 0) return existing;

        const idx = existingChats.findIndex((c) => c.id === message.chatId);
        if (idx === -1) return existing;

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

        // Move updated chat to top (sorting by latest activity)
        return [updatedChat, ...existingChats.filter((c) => c.id !== message.chatId)];
      }
    );

  }, [queryClient]);

  // Handle message DB save confirmation
  const handleMessageDbSaved = useCallback((data: { tempId: string; realMessage: Message }) => {
    console.log('💾 Message saved to DB, updating temp message:', data.tempId, '→', data.realMessage.id);

    // Update message list to replace temp message with real DB message
    const messageListKey = queryKeys.messages.list(data.realMessage.chatId);
    const currentData = queryClient.getQueryData<MessageListData>(messageListKey);

    if (currentData) {
      // Optimized: Find and replace temp message efficiently
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

  // Handle message save failure
  const handleMessageSaveFailed = useCallback((data: { tempId: string; error: string }) => {
    console.error('❌ Message save failed:', data.tempId, data.error);

    // Mark temp message as failed (could show retry option)
    // For now, just log the error - message remains in UI but marked as unsent
    // TODO: Add visual indicator for failed messages
  }, []);

  // Handle message updated (edited)
  const handleMessageUpdated = useCallback((updatedMessage: Message) => {
    console.log('✏️ Message updated:', updatedMessage);

    // Update message in the list
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

    // Update individual message cache
    queryClient.setQueryData(queryKeys.messages.detail(updatedMessage.id), updatedMessage);
  }, [queryClient]);

  // Handle message deleted
  const handleMessageDeleted = useCallback((data: MessageDeletedData) => {
    console.log('🗑️ Message deleted:', data);

    // Update message list to mark as deleted or remove
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

    // Remove from individual message cache
    queryClient.removeQueries({ queryKey: queryKeys.messages.detail(data.messageId) });
  }, [queryClient]);

  // Handle typing indicators
  const handleTypingUpdate = useCallback((data: TypingUpdateData) => {
    console.log('⌨️ User typing status updated:', data);
    // TODO: Update typing state for the chat
  }, []);

  // Handle read receipts
  const handleMessageRead = useCallback((data: MessageReadData) => {
    console.log('👁️ Message read:', data);
    // TODO: Update read receipts for the message
  }, []);

  // Handle chat created
  const handleChatCreated = useCallback((chat: any) => {
    console.log('🆕 Chat created:', chat);
    // Invalidate chat list to include new chat
    queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
  }, [queryClient]);

  // Handle chat updated
  const handleChatUpdated = useCallback((chat: any) => {
    console.log('✏️ Chat updated:', chat);
    // Update chat in the list
    queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
  }, [queryClient]);

  // Handle chat deleted
  const handleChatDeleted = useCallback((data: ChatDeletedData) => {
    console.log('🗑️ Chat deleted:', data);
    // Remove chat from list
    queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
  }, [queryClient]);

  // Join chat room when selected chat changes
  useEffect(() => {
    if (!socket || !isConnected || !selectedChatId) return;

    console.log('🏠 Joining chat room:', selectedChatId);
    // Cast to avoid type mismatch until shared socket event typings are rebuilt
    (socket as any).emit(SOCKET_EVENTS.CHAT_JOIN, { chatId: selectedChatId });

    return () => {
      console.log('🚪 Leaving chat room:', selectedChatId);
      (socket as any).emit(SOCKET_EVENTS.CHAT_LEAVE, { chatId: selectedChatId });
    };
  }, [socket, isConnected, selectedChatId]);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Message events
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);

    // New instant delivery events
    (socket as any).on('message:db_saved', handleMessageDbSaved);
    (socket as any).on('message:save_failed', handleMessageSaveFailed);

    // Typing events
    socket.on('message:typing:update', handleTypingUpdate);

    // Read receipt events
    socket.on('message:read:update', handleMessageRead);

    // Chat events
    socket.on(SOCKET_EVENTS.CHAT_CREATED, handleChatCreated);
    socket.on(SOCKET_EVENTS.CHAT_UPDATED, handleChatUpdated);

    return () => {
      // Cleanup listeners
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      (socket as any).off('message:db_saved', handleMessageDbSaved);
      (socket as any).off('message:save_failed', handleMessageSaveFailed);
      socket.off('message:typing:update', handleTypingUpdate);
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
    handleTypingUpdate,
    handleMessageRead,
    handleChatCreated,
    handleChatUpdated,
    handleChatDeleted
  ]);

  // Send typing indicators
  const sendTypingStart = useCallback(() => {
    if (socket && isConnected && selectedChatId && currentUserId) {
      socket.emit(SOCKET_EVENTS.MESSAGE_TYPING, { 
        chatId: selectedChatId,
        userId: currentUserId,
        isTyping: true
      });
    }
  }, [socket, isConnected, selectedChatId, currentUserId]);

  const sendTypingStop = useCallback(() => {
    if (socket && isConnected && selectedChatId && currentUserId) {
      socket.emit(SOCKET_EVENTS.MESSAGE_TYPING, { 
        chatId: selectedChatId,
        userId: currentUserId,
        isTyping: false
      });
    }
  }, [socket, isConnected, selectedChatId, currentUserId]);

  return {
    sendTypingStart,
    sendTypingStop,
    isConnected,
  };
}