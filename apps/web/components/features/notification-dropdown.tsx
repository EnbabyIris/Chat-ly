import { useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { NotificationItem } from './notification-item';
import { useNotifications, useMarkAllNotificationsAsRead } from '@/lib/api/queries/notifications.queries';
import type { Notification } from '@repo/shared/types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick: (notification: Notification) => void;
}

export const NotificationDropdown = ({
  isOpen,
  onClose,
  onNotificationClick
}: NotificationDropdownProps) => {
  const [showAll, setShowAll] = useState(false);

  // Fetch notifications (limit to 10 for dropdown, show first 5 by default)
  const { data: notificationData, isLoading, error } = useNotifications(
    { limit: 10, unreadOnly: false },
    { enabled: isOpen }
  );

  const markAllAsRead = useMarkAllNotificationsAsRead({
    onSuccess: () => {
      console.log('✅ All notifications marked as read');
    },
    onError: (error) => {
      console.error('❌ Failed to mark all notifications as read:', error);
    },
  });

  const handleMarkAllAsRead = () => {
    if (notificationData && notificationData.unreadCount > 0) {
      markAllAsRead.mutate();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    onNotificationClick(notification);
    onClose();
  };

  const displayedNotifications = showAll
    ? notificationData?.notifications || []
    : (notificationData?.notifications || []).slice(0, 5);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-neutral-200 z-50 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-neutral-600" />
            <h3 className="font-semibold text-neutral-900">Notifications</h3>
            {notificationData?.unreadCount && notificationData.unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {notificationData.unreadCount}
              </span>
            )}
          </div>

          {notificationData && notificationData.unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              Mark all read
            </button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              <span className="ml-2 text-sm text-neutral-500">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-sm text-neutral-600 text-center">
                Failed to load notifications
              </p>
            </div>
          ) : !notificationData || notificationData.notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <Bell className="w-8 h-8 text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-500 text-center">
                No notifications yet
              </p>
              <p className="text-xs text-neutral-400 text-center mt-1">
                New messages will appear here
              </p>
            </div>
          ) : (
            <>
              {displayedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              ))}

              {/* Show more/less button */}
              {notificationData.notifications.length > 5 && (
                <div className="p-3 border-t border-neutral-100">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showAll ? 'Show less' : `Show all (${notificationData.notifications.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};