/**
 * Hook for automatically marking messages as read when viewed
 * 
 * Tracks viewed messages and marks them as read via API.
 * Read receipt updates are broadcast via Socket.IO by the backend.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useMarkMessageRead } from '@/lib/api/queries';
import { useNetworkStatus } from './use-network-status';

interface UseAutoMarkReadOptions {
  chatId?: string;
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Hook to automatically mark messages as read when viewed
 * 
 * @param options - Configuration options
 * @returns Object with function to mark message as viewed
 */
export function useAutoMarkRead(options: UseAutoMarkReadOptions = {}) {
  const { chatId, enabled = true, debounceMs = 500 } = options;
  const { isOffline } = useNetworkStatus();
  const markMessageReadMutation = useMarkMessageRead();
  
  // Track messages that have been viewed but not yet marked as read
  const pendingReads = useRef<Set<string>>(new Set());
  const readMessages = useRef<Set<string>>(new Set()); // Track already-read messages
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentChatIdRef = useRef<string | undefined>(chatId);

  // Handle chat switching - cancel pending reads for old chat
  useEffect(() => {
    if (currentChatIdRef.current !== chatId) {
      // Clear pending reads when switching chats
      pendingReads.current.clear();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      currentChatIdRef.current = chatId;
    }
  }, [chatId]);

  /**
   * Mark a message as read (debounced for batch processing)
   */
  const markAsRead = useCallback(
    (messageId: string) => {
      if (!enabled || !messageId || isOffline) return;

      // Skip if already marked as read
      if (readMessages.current.has(messageId)) return;

      // Add to pending reads
      pendingReads.current.add(messageId);

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce to batch multiple reads
      debounceTimeoutRef.current = setTimeout(() => {
        const messageIds = Array.from(pendingReads.current);
        pendingReads.current.clear();

        // Early return if no messages to process
        if (messageIds.length === 0) return;

        // Mark each message as read with error handling
        messageIds.forEach((msgId) => {
          try {
            // Call API to mark as read
            markMessageReadMutation.mutate(msgId, {
              onSuccess: () => {
                // Track as successfully read
                readMessages.current.add(msgId);
              },
              onError: (error) => {
                console.error(`Failed to mark message ${msgId} as read:`, error);
                // Remove from pending so it can be retried
                pendingReads.current.delete(msgId);
              },
            });
          } catch (error) {
            console.error(`Error marking message ${msgId} as read:`, error);
          }
        });
      }, debounceMs);
    },
    [enabled, isOffline, markMessageReadMutation, debounceMs]
  );

  /**
   * Mark all messages in a chat as read (optimized with Set)
   */
  const markChatAsRead = useCallback(
    (messageIds: string[]) => {
      if (!enabled || !messageIds.length || isOffline) return;

      // Use Set for faster lookups
      const messageIdSet = new Set(messageIds);
      const unreadIds = Array.from(messageIdSet).filter(
        (id) => !readMessages.current.has(id)
      );

      // Early return if no unread messages
      if (unreadIds.length === 0) return;

      unreadIds.forEach((messageId) => {
        markAsRead(messageId);
      });
    },
    [enabled, isOffline, markAsRead]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    markAsRead,
    markChatAsRead,
    isMarking: markMessageReadMutation.isPending,
  };
}
