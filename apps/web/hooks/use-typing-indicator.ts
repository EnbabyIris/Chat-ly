/**
 * Hook for managing typing indicators via Socket.IO
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '@/contexts/socket-context';
import { SOCKET_EVENTS } from '@repo/shared/constants';

interface TypingUsers {
  [chatId: string]: Set<string>; // chatId -> Set of userIds who are typing
}

export function useTypingIndicator(chatId?: string) {
  const { socket, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<TypingUsers>({});
  const typingTimeoutRef = useRef<{ [chatId: string]: NodeJS.Timeout }>({});

  // Listen for typing events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleTypingUpdate = (data: { chatId: string; userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        if (!updated[data.chatId]) {
          updated[data.chatId] = new Set();
        }
        
        if (data.isTyping) {
          updated[data.chatId].add(data.userId);
        } else {
          updated[data.chatId].delete(data.userId);
        }
        
        return updated;
      });
    };

    socket.on(SOCKET_EVENTS.MESSAGE_TYPING_UPDATE, handleTypingUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_TYPING_UPDATE, handleTypingUpdate);
    };
  }, [socket, isConnected]);

  // Get typing users for current chat
  const getTypingUsers = useCallback(
    (targetChatId: string) => {
      return Array.from(typingUsers[targetChatId] || []);
    },
    [typingUsers]
  );

  // Send typing start event
  const startTyping = useCallback(
    (targetChatId: string) => {
      if (!socket || !isConnected || !targetChatId) return;

      // Clear existing timeout
      if (typingTimeoutRef.current[targetChatId]) {
        clearTimeout(typingTimeoutRef.current[targetChatId]);
      }

      // Emit typing start
      socket.emit(SOCKET_EVENTS.MESSAGE_TYPING, {
        chatId: targetChatId,
        isTyping: true,
      });

      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current[targetChatId] = setTimeout(() => {
        stopTyping(targetChatId);
      }, 3000);
    },
    [socket, isConnected]
  );

  // Send typing stop event
  const stopTyping = useCallback(
    (targetChatId: string) => {
      if (!socket || !isConnected || !targetChatId) return;

      // Clear timeout
      if (typingTimeoutRef.current[targetChatId]) {
        clearTimeout(typingTimeoutRef.current[targetChatId]);
        delete typingTimeoutRef.current[targetChatId];
      }

      // Emit typing stop
      socket.emit(SOCKET_EVENTS.MESSAGE_TYPING, {
        chatId: targetChatId,
        isTyping: false,
      });
    },
    [socket, isConnected]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeoutRef.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    typingUsers: chatId ? getTypingUsers(chatId) : [],
    startTyping,
    stopTyping,
  };
}
