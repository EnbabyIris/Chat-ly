/**
 * Hook for managing online/offline status via Socket.IO
 */

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/contexts/socket-context';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queries';
import { SOCKET_EVENTS } from '@repo/shared/constants';

interface OnlineStatus {
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
}

export function useOnlineStatus(): OnlineStatus {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Listen for user online/offline events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUserStatus = (data: { userId: string; isOnline: boolean; lastSeen?: Date }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        if (data.isOnline) {
          updated.add(data.userId);
        } else {
          updated.delete(data.userId);
        }
        return updated;
      });

      // Invalidate user queries to update online status
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(data.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    };

    const handleOnlineUsersInit = (data: { onlineUsers: { userId: string; isOnline: boolean }[] }) => {
      const onlineUserIds = data.onlineUsers.map(user => user.userId);
      setOnlineUsers(new Set(onlineUserIds));
    };

    socket.on(SOCKET_EVENTS.USER_STATUS, handleUserStatus);
    (socket as any).on('online_users_init' as any, handleOnlineUsersInit);

    return () => {
      socket.off(SOCKET_EVENTS.USER_STATUS, handleUserStatus);
      socket.off('online_users_init' as any, handleOnlineUsersInit);
    };
  }, [socket, isConnected, queryClient]);

  const isUserOnline = useCallback(
    (userId: string) => {
      return onlineUsers.has(userId);
    },
    [onlineUsers]
  );

  return {
    onlineUsers,
    isUserOnline,
  };
}
