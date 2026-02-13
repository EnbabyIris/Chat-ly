/**
 * Hook for managing online/offline status via Socket.IO
 *
 * Attaches listeners as soon as the socket exists (not waiting for isConnected)
 * to avoid missing early events like online_users_init that fire immediately on connect.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/contexts/socket-context";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queries";
import { SOCKET_EVENTS } from "../lib/shared/constants";

interface OnlineStatus {
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
}

export function useOnlineStatus(): OnlineStatus {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const listenersAttachedRef = useRef(false);

  // Attach listeners as soon as socket exists — don't wait for isConnected
  // because online_users_init fires immediately on connection, before React
  // propagates the isConnected state update.
  useEffect(() => {
    if (!socket || listenersAttachedRef.current) return;
    listenersAttachedRef.current = true;

    const handleUserStatus = (data: {
      userId: string;
      isOnline: boolean;
      lastSeen?: Date;
    }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        if (data.isOnline) {
          updated.add(data.userId);
        } else {
          updated.delete(data.userId);
        }
        return updated;
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(data.userId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    };

    const handleOnlineUsersInit = (data: {
      onlineUsers: { userId: string; isOnline: boolean }[];
    }) => {
      const onlineUserIds = data.onlineUsers.map((user) => user.userId);
      setOnlineUsers(new Set(onlineUserIds));
    };

    socket.on(SOCKET_EVENTS.USER_STATUS, handleUserStatus);
    (socket as any).on("online_users_init" as any, handleOnlineUsersInit);

    // If socket is already connected when we mount, request the online list
    if (socket.connected) {
      (socket as any).emit(SOCKET_EVENTS.USER_ONLINE);
    }

    // Also re-request on reconnect
    const handleReconnect = () => {
      (socket as any).emit(SOCKET_EVENTS.USER_ONLINE);
    };
    socket.on("connect", handleReconnect);

    return () => {
      socket.off(SOCKET_EVENTS.USER_STATUS, handleUserStatus);
      socket.off("online_users_init" as any, handleOnlineUsersInit);
      socket.off("connect", handleReconnect);
      listenersAttachedRef.current = false;
    };
  }, [socket, queryClient]);

  const isUserOnline = useCallback(
    (userId: string) => {
      return onlineUsers.has(userId);
    },
    [onlineUsers],
  );

  return {
    onlineUsers,
    isUserOnline,
  };
}
