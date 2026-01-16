import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotificationDropdown } from './notification-dropdown';
import { useUnreadNotificationCount, useMarkNotificationAsRead } from '@/lib/api/queries/notifications.queries';
import type { Notification } from '@repo/shared/types';

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void;
}

export const NotificationBell = ({ onNotificationClick }: NotificationBellProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Fetch real notification count
  const { data: unreadCount = 0, isLoading } = useUnreadNotificationCount();

  const markAsRead = useMarkNotificationAsRead();

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark notification as read
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    // Call parent handler for navigation
    onNotificationClick?.(notification);
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen]);

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={handleBellClick}
        className={`
          relative bg-white rounded-xl border border-gray-200 p-2.5 cursor-pointer
          hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:ring-offset-1
          ${isDropdownOpen ? 'bg-neutral-50' : ''}
        `}
        aria-label={`${unreadCount} unread notifications`}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-600' : 'text-neutral-600'}`} />
        {unreadCount > 0 && !isLoading && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-xs font-medium text-white">
              {unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
        {isLoading && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-neutral-400 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        )}
      </button>

      <NotificationDropdown
        isOpen={isDropdownOpen}
        onClose={handleCloseDropdown}
        onNotificationClick={handleNotificationClick}
      />
    </div>
  );
};