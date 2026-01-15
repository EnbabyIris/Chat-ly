import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/socket-context';
import { useNetworkStatus } from './use-network-status';
import { queryKeys } from '@/lib/api/queries/query-keys';
import { SOCKET_EVENTS } from '@repo/shared';
import type { Message } from '@repo/shared';

interface MessageListData {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

interface UseRealTimeMessagesOptions {
  chatId?: string;
  enabled?: boolean;
}

export function useRealTimeMessages(options: UseRealTimeMessagesOptions = {}) {
  const { chatId, enabled = true } = options;
  const { socket, isConnected } = useSocket();
  const { isOffline } = useNetworkStatus();
  const queryClient = useQueryClient();
  
  // Track processed events to prevent duplicates
  const processedEventsRef = useRef<Set<string>>(new Set());

  // Helper function to sort messages chronologically
  const sortMessagesByTimestamp = (messages: Message[]): Message[] => {
    return messages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

  // Helper function to validate message data
  const isValidMessage = (data: any): data is Message => {
    return data && 
           typeof data.id === 'string' && 
           typeof data.chatId === 'string' && 
           typeof data.content === 'string' && 
           typeof data.senderId === 'string' &&
           data.createdAt;
  };

  // Helper function to create unique event key
  const getEventKey = (eventType: string, messageId: string): string => {
    return `${eventType}:${messageId}:${Date.now()}`;
  };

  useEffect(() => {
    if (!socket || !isConnected || !enabled || isOffline) return;

    // Handle new messages
    const handleMessageNew = (data: Message) => {
      try {
        // Validate message data structure
        if (!isValidMessage(data)) {
          console.warn('Invalid MESSAGE_NEW data structure:', data);
          return;
        }

        // Prevent duplicate processing
        const eventKey = getEventKey('NEW', data.id);
        if (processedEventsRef.current.has(eventKey)) {
          console.debug('Duplicate MESSAGE_NEW event ignored:', data.id);
          return;
        }
        processedEventsRef.current.add(eventKey);

        // Only process messages for active chat (if specified)
        if (chatId && data.chatId !== chatId) return;

        // Update message list cache
        const messageListKey = queryKeys.messages.list(data.chatId);
        const currentData = queryClient.getQueryData<MessageListData>(messageListKey);
        
        if (currentData?.messages) {
          // Check for duplicates to prevent double-processing
          const exists = currentData.messages.some((msg: Message) => msg.id === data.id);
          if (!exists) {
            // Add new message and maintain chronological order
            const updatedMessages = sortMessagesByTimestamp([...currentData.messages, data]);
            
            queryClient.setQueryData<MessageListData>(messageListKey, {
              ...currentData,
              messages: updatedMessages,
            });
            
            console.debug('Added new message to cache:', data.id);
          } else {
            console.debug('Message already exists in cache:', data.id);
          }
        } else {
          // Handle messages for chats not currently loaded
          console.debug('Message received for unloaded chat:', data.chatId);
          // Optionally invalidate chat list to show unread count
          queryClient.invalidateQueries({ queryKey: queryKeys.chats.all });
        }
      } catch (error) {
        console.error('Error handling MESSAGE_NEW:', error);
      }
    };

    // Handle message updates
    const handleMessageUpdated = (data: Message) => {
      try {
        // Validate message data structure
        if (!isValidMessage(data)) {
          console.warn('Invalid MESSAGE_UPDATED data structure:', data);
          return;
        }

        // Prevent duplicate processing
        const eventKey = getEventKey('UPDATED', data.id);
        if (processedEventsRef.current.has(eventKey)) {
          console.debug('Duplicate MESSAGE_UPDATED event ignored:', data.id);
          return;
        }
        processedEventsRef.current.add(eventKey);

        // Only process messages for active chat (if specified)
        if (chatId && data.chatId !== chatId) return;

        // Update message list cache
        const messageListKey = queryKeys.messages.list(data.chatId);
        const currentData = queryClient.getQueryData<MessageListData>(messageListKey);
        
        if (currentData?.messages) {
          const updatedMessages = currentData.messages.map((msg: Message) =>
            msg.id === data.id ? { ...msg, ...data } : msg
          );
          
          // Re-sort to maintain order after update
          const sortedMessages = sortMessagesByTimestamp(updatedMessages);
          
          queryClient.setQueryData<MessageListData>(messageListKey, {
            ...currentData,
            messages: sortedMessages,
          });
        }

        // Update individual message cache if it exists
        const messageDetailKey = queryKeys.messages.detail(data.id);
        queryClient.setQueryData<Message>(messageDetailKey, data);
        
        console.debug('Updated message in cache:', data.id);
      } catch (error) {
        console.error('Error handling MESSAGE_UPDATED:', error);
      }
    };

    // Handle message deletion
    const handleMessageDeleted = (data: { messageId: string; chatId: string }) => {
      try {
        // Validate deletion data structure
        if (!data || typeof data.messageId !== 'string' || typeof data.chatId !== 'string') {
          console.warn('Invalid MESSAGE_DELETED data structure:', data);
          return;
        }

        // Prevent duplicate processing
        const eventKey = getEventKey('DELETED', data.messageId);
        if (processedEventsRef.current.has(eventKey)) {
          console.debug('Duplicate MESSAGE_DELETED event ignored:', data.messageId);
          return;
        }
        processedEventsRef.current.add(eventKey);

        // Only process messages for active chat (if specified)
        if (chatId && data.chatId !== chatId) return;

        // Update message list cache
        const messageListKey = queryKeys.messages.list(data.chatId);
        const currentData = queryClient.getQueryData<MessageListData>(messageListKey);
        
        if (currentData?.messages) {
          const updatedMessages = currentData.messages.filter((msg: Message) =>
            msg.id !== data.messageId
          );
          
          queryClient.setQueryData<MessageListData>(messageListKey, {
            ...currentData,
            messages: updatedMessages, // No need to re-sort after deletion
          });
        }

        // Remove individual message cache
        const messageDetailKey = queryKeys.messages.detail(data.messageId);
        queryClient.removeQueries({ queryKey: messageDetailKey });
        
        console.debug('Deleted message from cache:', data.messageId);
      } catch (error) {
        console.error('Error handling MESSAGE_DELETED:', error);
      }
    };

    // Register event listeners
    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);
    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);

    // Cleanup
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleMessageNew);
      socket.off(SOCKET_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      
      // Clear processed events when disconnecting
      processedEventsRef.current.clear();
    };
  }, [socket, isConnected, enabled, isOffline, queryClient, chatId]);

  // Clean up old processed events periodically to prevent memory leaks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Keep only recent events (last 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const currentEvents = Array.from(processedEventsRef.current);
      
      processedEventsRef.current = new Set(
        currentEvents.filter(eventKey => {
          const parts = eventKey.split(':');
          const timestamp = parts[2] ? parseInt(parts[2]) : 0;
          return timestamp > fiveMinutesAgo;
        })
      );
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    isConnected,
    enabled,
  };
}