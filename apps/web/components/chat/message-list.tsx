import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import type { Message, ChatUser } from '@repo/shared';

interface MessageListProps {
  messages: Message[];
  currentUser: ChatUser;
}

export const MessageList = ({ messages, currentUser }: MessageListProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(messages.length);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Only auto-scroll if new messages were added (not on initial load)
    if (messages.length > previousMessageCountRef.current) {
      // Check if user was near bottom before scrolling
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
      
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
    
    previousMessageCountRef.current = messages.length;
  }, [messages.length]);

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-6 space-y-4 bg-neutral-50"
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          currentUser={currentUser}
        />
      ))}
    </div>
  );
};