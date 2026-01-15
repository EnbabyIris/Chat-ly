import { cn } from '@/lib/utils';
import type { Message, ChatUser } from '@repo/shared';

interface MessageBubbleProps {
  message: Message;
  currentUser: ChatUser;
}

export const MessageBubble = ({ message, currentUser }: MessageBubbleProps) => {
  const isOwn = message.sender?.id === currentUser._id;

  return (
    <div
      className={cn(
        'flex',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm',
          isOwn
            ? 'bg-blue-500 text-white'
            : 'bg-white text-neutral-900 border border-neutral-200'
        )}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        <p className={cn(
          'text-xs mt-2',
          isOwn ? 'text-blue-100' : 'text-neutral-500'
        )}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};