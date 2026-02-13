"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useAuth } from "./auth-context";
import { socketClient } from "@/lib/socket/client";
import type { Socket } from "socket.io-client";
import type { SocketEvents } from "../lib/shared/types";

interface SocketContextType {
  socket: Socket<SocketEvents> | null;
  isConnected: boolean;
  isConnecting: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [socketInstance, setSocketInstance] =
    useState<Socket<SocketEvents> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Connect socket when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsConnecting(true);
      const socket = socketClient.connect();

      if (socket) {
        setSocketInstance(socket);

        const onConnect = () => {
          setIsConnected(true);
          setIsConnecting(false);
          setSocketInstance(socketClient.getSocket());
          // Clear reconnect timer once connected
          if (reconnectTimerRef.current) {
            clearInterval(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
        };

        const onDisconnect = () => {
          setIsConnected(false);
          setIsConnecting(false);
        };

        const onConnectError = () => {
          setIsConnecting(false);
          // On auth error, try reconnecting with fresh token
          // The socket client now uses dynamic auth, so just retry
          if (!reconnectTimerRef.current) {
            reconnectTimerRef.current = setInterval(() => {
              if (!socketClient.isConnected()) {
                socketClient.reconnectWithNewToken();
                const newSocket = socketClient.getSocket();
                if (newSocket) {
                  setSocketInstance(newSocket);
                  newSocket.on("connect", onConnect);
                  newSocket.on("disconnect", onDisconnect);
                  newSocket.on("connect_error", onConnectError);
                }
              } else {
                if (reconnectTimerRef.current) {
                  clearInterval(reconnectTimerRef.current);
                  reconnectTimerRef.current = null;
                }
              }
            }, 10000); // retry every 10 seconds
          }
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", onConnectError);

        // If already connected (reconnect scenario)
        if (socket.connected) {
          setIsConnected(true);
          setIsConnecting(false);
        }
      } else {
        setIsConnecting(false);
      }
    } else {
      // Disconnect when user logs out
      socketClient.disconnect();
      setIsConnected(false);
      setIsConnecting(false);
      setSocketInstance(null);
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    return () => {
      if (!isAuthenticated) {
        socketClient.disconnect();
      }
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  const value: SocketContextType = {
    socket: socketInstance,
    isConnected,
    isConnecting,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);

  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return context;
}
