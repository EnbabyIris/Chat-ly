'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthPage } from '@/hooks/use-auth-page';
import { useCursorPosition } from '@/hooks/use-cursor-position';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { ChatListItem } from '@/components/chat/chat-list-item';
import { cn } from '@/lib/utils';
import { TIMING } from '@/lib/constants/timing';
import { SIZES } from '@/lib/constants/sizes';
import type { ChatListItem as SharedChatListItem } from '@repo/shared';

interface User {
  _id: string;
  name: string;
  pic?: string;
}

interface LatestMessage {
  content: string;
  sender: {
    name: string;
  };
}

const dummyChats: SharedChatListItem[] = [
  {
    id: 'dummy1',
    name: null,
    isGroupChat: false,
    avatar: null,
    participants: [
      {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        isOnline: true,
        lastSeen: null,
      },
      {
        id: 'user2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
        isOnline: false,
        lastSeen: new Date(),
      },
    ],
    latestMessage: {
      id: 'msg0',
      content: 'Hey, how are you doing?',
      senderId: 'user1',
      senderName: 'John Doe',
      messageType: 'text',
      createdAt: new Date(),
    },
    unreadCount: 1,
    updatedAt: new Date(),
  },
  {
    id: 'dummy2',
    name: 'Project Team',
    isGroupChat: true,
    avatar: null,
    participants: [
      {
        id: 'user1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
        isOnline: true,
        lastSeen: null,
      },
      {
        id: 'user3',
        name: 'Bob Wilson',
        email: 'bob@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
        isOnline: false,
        lastSeen: new Date(),
      },
      {
        id: 'user4',
        name: 'Carol Brown',
        email: 'carol@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
        isOnline: true,
        lastSeen: null,
      },
    ],
    latestMessage: {
      id: 'msg1',
      content: 'Meeting at 3 PM today',
      senderId: 'user1',
      senderName: 'Alice Johnson',
      messageType: 'text',
      createdAt: new Date(),
    },
    unreadCount: 2,
    updatedAt: new Date(),
  },
  {
    id: 'dummy3',
    name: null,
    isGroupChat: false,
    avatar: null,
    participants: [
      {
        id: 'user1',
        name: 'Mike Davis',
        email: 'mike@example.com',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        isOnline: false,
        lastSeen: new Date(),
      },
      {
        id: 'user5',
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        isOnline: true,
        lastSeen: null,
      },
    ],
    latestMessage: {
      id: 'msg2',
      content: 'Thanks for the help!',
      senderId: 'user5',
      senderName: 'Sarah Connor',
      messageType: 'text',
      createdAt: new Date(),
    },
    unreadCount: 0,
    updatedAt: new Date(),
  },
];

export const Step2ChatDemo = () => {
  const [activeChatIndex, setActiveChatIndex] = useState(0);
  const chatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAuthPage = useAuthPage();
  const { cursorPosition, setCursorPosition, positionCursorAtCenter } =
    useCursorPosition();
  const { spring } = useAnimationConfig();

  const dummyUser = useMemo(() => ({ _id: 'user1', name: 'Current User', pic: '' }), []);
  const dummyOnlinePeople = useMemo(() => ['user2', 'user3'], []);

  const handleSetSelectedChat = useCallback(() => {}, []);

  useEffect(() => {
    const activeRef = chatRefs.current[activeChatIndex];
    if (activeRef && containerRef.current) {
      const rect = activeRef.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setCursorPosition({
        top: rect.top - containerRect.top + rect.height / 2 - 14,
        left: rect.left / 6,
      });
    }
  }, [activeChatIndex, setCursorPosition]);

  const containerClassName = useMemo(
    () => cn(
      'space-y-2 overflow-y-auto flex-1 relative scrollbar-none',
      isAuthPage ? 'px-0' : 'px-8'
    ),
    [isAuthPage]
  );

  useEffect(() => {
    if (chatRefs.current.length === 0) return;

    const interval = setInterval(() => {
      setActiveChatIndex((prev) => (prev + 1) % dummyChats.length);
    }, TIMING.chatCycle);

    return () => clearInterval(interval);
  }, [dummyChats.length]);

  const selectedChat = useMemo(
    () => dummyChats[activeChatIndex] || null,
    [activeChatIndex]
  );

  return (
    <div ref={containerRef} className={containerClassName}>
      {dummyChats.map((chat, index) => (
        <div
          key={chat.id}
          ref={(el) => {
            chatRefs.current[index] = el;
          }}
          className="relative"
        >
          <ChatListItem
            chat={chat}
            loggedUser={{ ...dummyUser, pic: dummyUser.pic || '' } as import('@repo/shared').ChatUser}
            user={{ ...dummyUser, pic: dummyUser.pic || '' } as import('@repo/shared').ChatUser}
            selectedChat={index === activeChatIndex ? chat : null}
            onlinepeople={dummyOnlinePeople}
            setSelectedChat={handleSetSelectedChat as (chat: SharedChatListItem) => void}
          />
        </div>
      ))}
      {chatRefs.current.length > 0 && (
        <motion.div
          layoutId="cursor"
          className="absolute pointer-events-none z-50 left-1/2"
          initial={false}
          animate={cursorPosition as { top: number; left: number }}
          transition={spring}
        >
          <img
            src="/assets/svg/cursor.svg"
            alt="cursor"
            width={SIZES.cursor.width}
            height={SIZES.cursor.height}
            className={SIZES.cursor.className}
          />
        </motion.div>
      )}
    </div>
  );
};
