/**
 * Real-time Notifications Hook
 *
 * Handles Socket.IO events for real-time notification functionality including:
 * - Receiving new notifications and updating cache
 * - Notification read status updates
 * - Automatic notification list synchronization
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/socket-context';
import { SOCKET_EVENTS } from '@repo/shared/constants';
import { queryKeys } from '@/lib/api/queries';
import type { Notification, NotificationSummary } from '@repo/shared/types';

interface UseRealTimeNotificationsParams {
  currentUserId?: string;
}

interface UseRealTimeNotificationsReturn {
  isConnected: boolean;
}

/**
 * Hook to handle real-time notification events via Socket.IO
 */
export const useRealTimeNotifications = ({
  currentUserId
}: UseRealTimeNotificationsParams): UseRealTimeNotificationsReturn => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  // Handle new notification received (instant delivery)
  const handleNewNotification = useCallback((notification: Notification) => {
    console.log('🔔 INSTANT notification received:', notification);

    // Only process notifications for current user
    if (notification.userId !== currentUserId) {
      return;
    }

    // Update notification list cache (if it exists)
    const notificationListKey = queryKeys.notifications.list();
    const currentData = queryClient.getQueryData<NotificationSummary>(notificationListKey);

    if (currentData) {
      // Add new notification to the beginning of the list
      const updatedData: NotificationSummary = {
        ...currentData,
        notifications: [notification, ...currentData.notifications],
        unreadCount: currentData.unreadCount + (notification.isRead ? 0 : 1),
      };

      queryClient.setQueryData<NotificationSummary>(notificationListKey, updatedData);
    }

    // Update unread count cache
    const unreadCountKey = queryKeys.notifications.unreadCount();
    const currentUnreadCount = queryClient.getQueryData<number>(unreadCountKey) || 0;

    if (!notification.isRead) {
      queryClient.setQueryData<number>(unreadCountKey, currentUnreadCount + 1);
    }

    console.log('✅ Notification cache updated');
  }, [currentUserId, queryClient]);

  // Handle notification updated (e.g., marked as read)
  const handleNotificationUpdated = useCallback((notification: Notification) => {
    console.log('📝 Notification updated:', notification);

    // Only process notifications for current user
    if (notification.userId !== currentUserId) {
      return;
    }

    // Update notification list cache
    const notificationListKey = queryKeys.notifications.list();
    const currentData = queryClient.getQueryData<NotificationSummary>(notificationListKey);

    if (currentData) {
      const updatedNotifications = currentData.notifications.map(n =>
        n.id === notification.id ? notification : n
      );

      const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length;

      const updatedData: NotificationSummary = {
        ...currentData,
        notifications: updatedNotifications,
        unreadCount: newUnreadCount,
      };

      queryClient.setQueryData<NotificationSummary>(notificationListKey, updatedData);
    }

    // Update unread count cache
    const unreadCountKey = queryKeys.notifications.unreadCount();
    queryClient.invalidateQueries({ queryKey: unreadCountKey });

    console.log('✅ Notification updated in cache');
  }, [currentUserId, queryClient]);

  // Setup socket event listeners
  useCallback(() => {
    if (!socket || !isConnected) return;

    // Notification events
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, handleNewNotification);
    socket.on('notification:updated', handleNotificationUpdated);

    return () => {
      // Cleanup listeners
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, handleNewNotification);
      socket.off('notification:updated', handleNotificationUpdated);
    };
  }, [
    socket,
    isConnected,
    handleNewNotification,
    handleNotificationUpdated
  ])();

  return {
    isConnected,
  };
};