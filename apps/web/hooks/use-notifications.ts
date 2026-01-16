/**
 * Notification Manager Hook
 *
 * Centralized hook for all notification-related functionality including:
 * - Fetching notifications and unread counts
 * - Marking notifications as read
 * - Navigation logic for notification clicks
 * - Real-time notification updates
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useNotifications, useUnreadNotificationCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/lib/api/queries/notifications.queries';
import { useRealTimeNotifications } from './use-real-time-notifications';
import { queryKeys } from '@/lib/api/queries';
import type { Notification } from '@repo/shared/types';

interface UseNotificationsParams {
  currentUserId?: string;
  selectedChatId?: string;
  onChatSelect?: (chatId: string) => void;
  onTabChange?: (tab: 'chats' | 'users') => void;
}

interface UseNotificationsReturn {
  // Data
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  handleNotificationClick: (notification: Notification) => void;

  // Real-time status
  isConnected: boolean;
}

/**
 * Comprehensive notification management hook
 *
 * Provides all notification functionality with navigation logic
 */
export const useNotificationsManager = ({
  currentUserId,
  selectedChatId,
  onChatSelect,
  onTabChange,
}: UseNotificationsParams): UseNotificationsReturn => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch notification data
  const { data: notificationData, isLoading, error } = useNotifications(
    { limit: 20, unreadOnly: false },
    { enabled: true }
  );

  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  // Mutation hooks for actions
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  // Real-time notifications
  const { isConnected } = useRealTimeNotifications({
    currentUserId,
  });

  // Action handlers
  const markAsRead = useCallback((notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  // Navigation logic for notification clicks
  const handleNotificationClick = useCallback((notification: Notification) => {
    // Mark notification as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        if (notification.chatId) {
          // Switch to chats tab if not already there
          onTabChange?.('chats');

          // Select the chat
          onChatSelect?.(notification.chatId);

          // If we have a messageId, we could scroll to it (future enhancement)
          if (notification.messageId) {
            // TODO: Scroll to specific message in chat
            console.log('Navigate to message:', notification.messageId);
          }
        }
        break;

      case 'chat_created':
      case 'user_joined':
      case 'user_left':
        // For chat events, navigate to the chat
        if (notification.chatId) {
          onTabChange?.('chats');
          onChatSelect?.(notification.chatId);
        }
        break;

      default:
        console.warn('Unknown notification type:', notification.type);
        break;
    }
  }, [markAsRead, onTabChange, onChatSelect]);

  return {
    // Data
    notifications: notificationData?.notifications || [],
    unreadCount,
    isLoading,
    error: error?.message || null,

    // Actions
    markAsRead,
    markAllAsRead,
    handleNotificationClick,

    // Real-time status
    isConnected,
  };
};