'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import { useSocket } from '@/contexts/socket-context';
import { SOCKET_EVENTS } from '@/lib/shared/constants';
import { useAuth } from '@/contexts/auth-context';

interface Notification {
  id: string;
  chatId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationBellProps {
  onNotificationClick?: (chatId: string) => void;
}

export const NotificationBell = ({ onNotificationClick }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      // Don't notify for own messages
      if (data.senderId === user?.id) return;

      const newNotification: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        chatId: data.chatId,
        senderName: data.senderName || data.sender?.name || 'Someone',
        content: data.content?.substring(0, 60) || 'Sent a message',
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev].slice(0, 50));

      // Browser notification
      if (typeof window !== 'undefined' && Notification.permission === 'granted') {
        new Notification(`${newNotification.senderName}`, {
          body: newNotification.content,
          icon: '/favicon.ico',
        });
      }
    };

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    };
  }, [socket, user?.id]);

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setIsOpen(false);
  }, []);

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    return `${Math.floor(diffHr / 24)}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllRead();
        }}
        className="relative bg-white rounded-xl border border-gray-200 p-2.5 cursor-pointer hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-neutral-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-800">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0 cursor-pointer"
                  onClick={() => {
                    onNotificationClick?.(notif.chatId);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center shrink-0 border border-neutral-200">
                      <span className="text-xs font-medium text-neutral-600">
                        {notif.senderName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-800">
                        <span className="font-medium">{notif.senderName}</span>
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{notif.content}</p>
                    </div>
                    <span className="text-[10px] text-neutral-400 shrink-0">
                      {getTimeAgo(notif.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};