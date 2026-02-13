import { useEffect, useRef, useState, useCallback } from "react";
import { MessageBubble } from "./message-bubble";
import type { Message, ChatUser } from "../../lib/shared";

interface MessageListProps {
  messages: Message[];
  currentUser: ChatUser;
  chatId: string;
  onScrollChange?: (isScrolled: boolean) => void;
}

export const MessageList = ({
  messages,
  currentUser,
  chatId,
  onScrollChange,
}: MessageListProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(messages.length);
  const [isScrolledBeyondThreshold, setIsScrolledBeyondThreshold] =
    useState(false);

  // Scroll detection for header animation
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const shouldCollapse = scrollTop > 20;

    if (shouldCollapse !== isScrolledBeyondThreshold) {
      setIsScrolledBeyondThreshold(shouldCollapse);
      onScrollChange?.(shouldCollapse);
    }
  }, [isScrolledBeyondThreshold, onScrollChange]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Only auto-scroll if new messages were added (not on initial load)
    if (messages.length > previousMessageCountRef.current) {
      // Check if user was near bottom before scrolling
      const isNearBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 100;

      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }

    previousMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Add scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  console.log(messages);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-6 pt-14 space-y-5 bg-neutral-100 scrollbar-none"
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          currentUser={currentUser}
          chatId={chatId}
        />
      ))}
    </div>
  );
};
