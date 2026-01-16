'use client';

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useAuth } from './auth-context';
import { socketClient } from '@/lib/socket/client';
import type { Socket } from 'socket.io-client';
import type { SocketEvents } from '../lib/shared/types';

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

  // Connect socket when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsConnecting(true);
      const socket = socketClient.connect();

      if (socket) {
        socket.on('connect', () => {
          setIsConnected(true);
          setIsConnecting(false);
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
          setIsConnecting(false);
        });
      } else {
        setIsConnecting(false);
      }
    } else {
      // Disconnect when user logs out
      socketClient.disconnect();
      setIsConnected(false);
      setIsConnecting(false);
    }

    return () => {
      // Cleanup on unmount
      if (!isAuthenticated) {
        socketClient.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  const value: SocketContextType = {
    socket: socketClient.getSocket(),
    isConnected,
    isConnecting,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
}
