import { cn } from '@/lib/utils';
import type { Message, ChatUser } from '../../lib/shared';
import { CldImage } from 'next-cloudinary';
import { motion } from 'framer-motion';

const getTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
};

interface MessageBubbleProps {
  message: Message;
  currentUser: ChatUser;
}

export const MessageBubble = ({ message, currentUser }: MessageBubbleProps) => {
  const isOwn = message.sender?.id === currentUser._id;

  // Render different content based on message type
  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'image': {
        return (
          <div className="max-w-xs">
            <CldImage
              src={message.content}
              alt="Shared image"
              width={400}
              height={300}
              className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.content, '_blank')}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality="auto"
              format="auto"
            />
          </div>
        );
      }

      case 'file':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">📎</span>
            <a
              href={message.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {message.attachmentName || 'Download file'}
            </a>
          </div>
        );

      case 'location':
        return (
          <div
            className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => {
              if (message.latitude && message.longitude) {
                const url = `https://www.google.com/maps?q=${message.latitude},${message.longitude}`;
                window.open(url, '_blank');
              }
            }}
          >
            <span className="text-lg">📍</span>
            <span className="font-medium">
              {message.locationAddress || 'Shared Location'}
            </span>
          </div>
        );

      default: // 'text' or other types
        return (
          <p 
          className="text-sm leading-relaxed wrap-break-word text-center">
            {message.content}
          </p>
        );
    }
  };

  return (
    <motion.div
    initial={{ opacity: 0, x: isOwn ? 10 : -10, filter: 'blur(10px)'}}
    whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
    exit={{ opacity: 0, x: isOwn ? 10 : -10, filter: 'blur(10px)' }}
      className={cn(
        'flex flex-col relative',
        isOwn ? 'items-end' : 'items-start'
      )}
    >
      <div
        className={cn(
          'min-w-24 lg:max-w-md px-4 py-1 rounded-t-md',
          isOwn ? 'rounded-bl-md' : 'rounded-br-md',
          isOwn ? 'bg-stone-200' : 'bg-white',
          'text-neutral-900 border border-neutral-200',
          // Adjust padding for image messages
          message.messageType === 'image' ? 'p-2' : 'px-4 py-1'
        )}
      >
        {renderMessageContent()}
      </div>
      
      {/* Time Box - Superellipse Shape */}
      <div
        className={cn(
          'w-fit px-2 pt-1    border border-t-0 border-neutral-200',
          isOwn ? 'bg-stone-200 text-neutral-500 ' : 'text-neutral-300  bg-white',
          '  z-10 text-[9px] absolute bottom-0 translate-y-[46%]',
          isOwn ? 'right-0' : 'left-0'
        )}
        style={{
          clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0% 100%)',
          borderRadius: '20px',
          // @ts-ignore - CSS property not in TypeScript definitions
          cornerShape: 'superellipse(0)'
        }}
      >
         <p className="mt-1 px-4">{getTimeAgo(new Date(message.createdAt))}</p>
      </div>
    </motion.div>
  );
};