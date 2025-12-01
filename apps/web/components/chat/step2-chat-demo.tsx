'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthPage } from '@/hooks/use-auth-page';
import { useCursorPosition } from '@/hooks/use-cursor-position';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { ChatListItem } from '@/components/ui/chat-list-item';
import { cn } from '@/lib/utils';
import { TIMING } from '@/lib/constants/timing';
import { SIZES } from '@/lib/constants/sizes';

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

interface Chat {
  _id: string;
  isGroupChat: boolean;
  chatName?: string;
  users: User[];
  latestMessage?: LatestMessage;
}

const dummyChats: Chat[] = [
  {
    _id: 'dummy1',
    isGroupChat: false,
    users: [
      {
        _id: 'user1',
        name: 'John Doe',
        pic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      },
      {
        _id: 'user2',
        name: 'Jane Smith',
        pic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
      },
    ],
    latestMessage: {
      content: 'Hey, how are you doing?',
      sender: { name: 'John Doe' },
    },
  },
  {
    _id: 'dummy2',
    isGroupChat: true,
    chatName: 'Project Team',
    users: [
      {
        _id: 'user1',
        name: 'Alice Johnson',
        pic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      },
      {
        _id: 'user3',
        name: 'Bob Wilson',
        pic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
      },
      {
        _id: 'user4',
        name: 'Carol Brown',
        pic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
      },
    ],
    latestMessage: {
      content: 'Meeting at 3 PM today',
      sender: { name: 'Alice Johnson' },
    },
  },
  {
    _id: 'dummy3',
    isGroupChat: false,
    users: [
      {
        _id: 'user1',
        name: 'Mike Davis',
        pic: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
      {
        _id: 'user5',
        name: 'Sarah Connor',
        pic: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      },
    ],
    latestMessage: {
      content: 'Thanks for the help!',
      sender: { name: 'Sarah Connor' },
    },
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

  const dummyUser = useMemo(() => ({ _id: 'user1', name: 'Current User' }), []);
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
          key={chat._id}
          ref={(el) => {
            chatRefs.current[index] = el;
          }}
          className="relative"
        >
          <ChatListItem
            chat={chat}
            loggedUser={dummyUser}
            user={dummyUser}
            selectedChat={index === activeChatIndex ? chat : null}
            onlinepeople={dummyOnlinePeople}
            setSelectedChat={handleSetSelectedChat}
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
