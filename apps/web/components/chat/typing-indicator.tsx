import { useMemo } from 'react';

interface TypingIndicatorProps {
  typingUsers: string[];
  currentUserId: string;
}

export const TypingIndicator = ({ typingUsers, currentUserId }: TypingIndicatorProps) => {
  // Filter out current user and get display names
  const otherTypingUsers = useMemo(() => {
    return typingUsers.filter(userId => userId !== currentUserId);
  }, [typingUsers, currentUserId]);

  if (otherTypingUsers.length === 0) return null;

  // Create display text
  const getTypingText = () => {
    if (otherTypingUsers.length === 1) {
      return 'Someone is typing...';
    } else if (otherTypingUsers.length === 2) {
      return 'Two people are typing...';
    } else {
      return `${otherTypingUsers.length} people are typing...`;
    }
  };

  return (
    <div className="flex items-center space-x-2 px-6 py-2 text-sm text-gray-500">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="text-xs">{getTypingText()}</span>
    </div>
  );
};