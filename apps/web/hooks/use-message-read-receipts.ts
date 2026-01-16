/**
 * Hook for managing message read receipts via Socket.IO
 * 
 * Listens for read receipt updates and updates message cache in real-time.
 */

import { useEffect } from 'react';
import { useSocket } from '@/contexts/socket-context';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queries';
import { SOCKET_EVENTS } from '../lib/shared/constants';
import type { Message, MessageReadReceipt } from '../lib/shared/types';

interface MessageListData {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Hook to handle real-time message read receipt updates
 * 
 * Listens for MESSAGE_READ_UPDATE events and updates message cache
 * with read receipt information.
 */
export function useMessageReadReceipts() {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleReadReceiptUpdate = (data: {
      messageId: string;
      userId: string;
      userName: string;
      readAt: Date;
    }) => {
      try {
        // Null safety: validate event data
        if (!data?.messageId || !data?.userId || !data?.userName) {
          console.warn('Invalid read receipt data received:', data);
          return;
        }
      // Find all message list queries that might contain this message
      // We need to search through all cached message lists
      queryClient.getQueryCache().findAll({
        queryKey: queryKeys.messages.lists(),
      }).forEach((query) => {
        const queryData = query.state.data as MessageListData | undefined;
        
        if (!queryData || !queryData.messages) return;

        // Find the message in this list
        const messageIndex = queryData.messages.findIndex(
          (msg) => msg.id === data.messageId
        );

        if (messageIndex === -1) return;

        // Update the message with new read receipt
        const updatedMessages = [...queryData.messages];
        const message = updatedMessages[messageIndex];

        // Null safety: skip if message is invalid
        if (!message || !message.id) return;

        // Initialize readReceipts array if it doesn't exist
        const readReceipts = message.readReceipts || [];

        // Check if read receipt already exists for this user
        const existingReceiptIndex = readReceipts.findIndex(
          (receipt) => receipt.userId === data.userId
        );

        const newReadReceipt: MessageReadReceipt = {
          id: `receipt-${data.messageId}-${data.userId}`,
          messageId: data.messageId,
          userId: data.userId,
          readAt: new Date(data.readAt),
          user: {
            id: data.userId,
            name: data.userName || 'Unknown User', // Handle deleted users
            avatar: null, // Avatar will be populated from user data if needed
          },
        };

        // Update or add read receipt
        if (existingReceiptIndex >= 0) {
          readReceipts[existingReceiptIndex] = newReadReceipt;
        } else {
          readReceipts.push(newReadReceipt);
        }

        // Update message with new read receipts
        updatedMessages[messageIndex] = {
          ...message,
          readReceipts: [...readReceipts],
        } as Message;

        // Update cache with modified message list
        queryClient.setQueryData<MessageListData>(query.queryKey, {
          ...queryData,
          messages: updatedMessages,
        });
      });

      // Also update individual message detail cache if it exists
      const messageDetailKey = queryKeys.messages.detail(data.messageId);
      const messageDetail = queryClient.getQueryData<Message>(messageDetailKey);
      
      if (messageDetail) {
        const readReceipts = messageDetail.readReceipts || [];
        const existingReceiptIndex = readReceipts.findIndex(
          (receipt) => receipt.userId === data.userId
        );

        const newReadReceipt: MessageReadReceipt = {
          id: `receipt-${data.messageId}-${data.userId}`,
          messageId: data.messageId,
          userId: data.userId,
          readAt: new Date(data.readAt),
          user: {
            id: data.userId,
            name: data.userName,
            avatar: null,
          },
        };

        if (existingReceiptIndex >= 0) {
          readReceipts[existingReceiptIndex] = newReadReceipt;
        } else {
          readReceipts.push(newReadReceipt);
        }

        queryClient.setQueryData<Message>(messageDetailKey, {
          ...messageDetail,
          readReceipts: [...readReceipts],
        });
      }
      } catch (error) {
        console.error('Error handling read receipt update:', error);
      }
    };

    socket.on(SOCKET_EVENTS.MESSAGE_READ_UPDATE, handleReadReceiptUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_READ_UPDATE, handleReadReceiptUpdate);
    };
  }, [socket, isConnected, queryClient]);
}
