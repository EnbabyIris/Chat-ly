import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import type { Notification } from '@repo/shared/types';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

export const NotificationItem = ({ notification, onClick }: NotificationItemProps) => {
  const handleClick = () => {
    onClick(notification);
  };

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'message':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'chat_created':
        return <div className="w-4 h-4 rounded-full bg-green-500" />;
      case 'user_joined':
        return <div className="w-4 h-4 rounded-full bg-purple-500" />;
      case 'user_left':
        return <div className="w-4 h-4 rounded-full bg-red-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        p-3 hover:bg-neutral-50 cursor-pointer transition-colors border-b border-neutral-100 last:border-b-0
        ${!notification.isRead ? 'bg-blue-50/50' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {notification.senderAvatar ? (
            <img
              src={notification.senderAvatar}
              alt={notification.senderName || 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
              <span className="text-xs font-medium text-neutral-600">
                {notification.senderName?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}

          {/* Unread indicator */}
          {!notification.isRead && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getNotificationIcon()}
            <h4 className="font-medium text-sm text-neutral-900 truncate">
              {notification.title}
            </h4>
            <span className="text-xs text-neutral-500 flex-shrink-0">
              {getTimeAgo(notification.createdAt)}
            </span>
          </div>

          <p className="text-sm text-neutral-600 line-clamp-2">
            {notification.message}
          </p>
        </div>
      </div>
    </div>
  );
};