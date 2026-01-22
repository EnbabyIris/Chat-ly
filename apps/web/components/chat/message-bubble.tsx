import { cn } from '@/lib/utils';
import type { Message, ChatUser } from '../../lib/shared';
import { CldImage } from 'next-cloudinary';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Copy, Languages } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useDeleteMessage } from '@/lib/api/queries/messages.queries';
import { useMessageTranslation } from '@/hooks/use-message-translation';

const MessageActions = ({
  isOwn,
  showLanguages,
  onMouseEnter,
  onMouseLeave,
  onCopy,
  onDelete,
  onTranslate,
  onLanguageSelect,
  isTranslating
}: {
  isOwn: boolean;
  showLanguages: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onTranslate: () => void;
  onLanguageSelect: (language: string) => void;
  isTranslating: boolean;
}) => (
  <motion.div
  layout
  initial={{ opacity: 0, scale: 0.8, x: isOwn ? 10 : -10, filter: 'blur(10px)'}}
  animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
  exit={{ opacity: 0, scale: 0.8, x: isOwn ? 10 : -10, filter: 'blur(10px)' }}
  transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
  className={cn(
    'bg-white rounded-md border p-1 border-neutral-200 flex items-center justify-center gap-1 h-fit ',
    isOwn ? 'mr-2' : 'ml-2'
  )}
  onMouseEnter={onMouseEnter}
  onMouseLeave={onMouseLeave}>
    <AnimatePresence mode="wait" initial={false}>
      {showLanguages ? (
        <motion.div
          key="languages"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0.0, 0.2, 1]
          }}
          className="flex items-center"
        >
          <button
            className='px-2 py-0.5 hover:bg-gray-100 rounded transition-colors text-xs text-neutral-500 disabled:opacity-50'
            onClick={() => onLanguageSelect('en')}
            disabled={isTranslating}
          >
            En
          </button>
          <div className='w-px h-4 bg-gray-300 mx-1' />
          <button
            className='px-2 py-0.5 hover:bg-gray-100 rounded transition-colors text-xs text-neutral-500 disabled:opacity-50'
            onClick={() => onLanguageSelect('hn')}
            disabled={isTranslating}
          >
            Hn
          </button>
          <div className='w-px h-4 bg-gray-300 mx-1' />
          <button
            className='px-2 py-0.5 hover:bg-gray-100 rounded transition-colors text-xs text-neutral-500 disabled:opacity-50'
            onClick={() => onLanguageSelect('fr')}
            disabled={isTranslating}
          >
            Fr
          </button>
          <div className='w-px h-4 bg-gray-300 mx-1' />
          <button
            className='px-2 py-0.5 hover:bg-gray-100 rounded transition-colors text-xs text-neutral-500 disabled:opacity-50'
            onClick={() => onLanguageSelect('es')}
            disabled={isTranslating}
          >
            Es
          </button>
          <div className='w-px h-4 bg-gray-300 mx-1' />
          <button
            className='px-2 py-0.5 hover:bg-gray-100 rounded transition-colors text-xs text-neutral-500 disabled:opacity-50'
            onClick={() => onLanguageSelect('de')}
            disabled={isTranslating}
          >
            De
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="actions"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0.0, 0.2, 1]
          }}
          className="flex items-center"
        >
          {isOwn && (
            <>
              <button
                className='p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50'
                onClick={onDelete}
                disabled={false}
              >
                <Trash2 size={14} className='text-red-300' />
              </button>
              <div className='w-px h-4 bg-gray-300 mx-1' />
            </>
          )}
          <button
            className='p-1 hover:bg-gray-100 rounded transition-colors'
            onClick={onCopy}
          >
            <Copy size={14} className='text-gray-600' />
          </button>
          <div className='w-px h-4 bg-gray-300 mx-1' />
          <button
            className='p-1 hover:bg-gray-100 rounded transition-colors'
            onClick={onTranslate}
          >
            <Languages size={14} className='text-gray-600' />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

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
  chatId: string;
}

export const MessageBubble = ({ message, currentUser, chatId }: MessageBubbleProps) => {
  const isOwn = message.sender?.id === currentUser._id;
  const [showActions, setShowActions] = useState(false);
  const [isActionsHovered, setIsActionsHovered] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { translate, isTranslating } = useMessageTranslation();

  // Delete message mutation
  const deleteMessageMutation = useDeleteMessage({
    onSuccess: () => {
      console.log('Message deleted successfully');
      setShowActions(false); // Close action bar after successful deletion
    },
    onError: (error) => {
      console.error('Failed to delete message:', error);
      // TODO: Add proper toast notification system
      alert('Failed to delete message. Please try again.');
    },
  });

  const handleDoubleClick = () => {
    setShowActions(!showActions);
    
    // Start 2-second timer when showing actions
    if (!showActions) {
      startHideTimer();
    }
  };

  const startHideTimer = () => {
    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Start new timer
    timeoutRef.current = setTimeout(() => {
      if (!isActionsHovered) {
        setShowActions(false);
      }
    }, 2000);
  };

  const handleActionsMouseEnter = () => {
    setIsActionsHovered(true);
    // Clear timer when hovering actions
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleActionsMouseLeave = () => {
    setIsActionsHovered(false);
    // Restart timer when leaving actions
    startHideTimer();
  };

  const handleCopy = async () => {
    // Only copy if it's a text message
    if (message.messageType === 'text' || !message.messageType) {
      try {
        await navigator.clipboard.writeText(message.content);
        // Close the action bar after copying
        setShowActions(false);
        // Clear any existing timer
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      } catch (error) {
        console.error('Failed to copy text:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = message.content;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setShowActions(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  const handleDelete = () => {
    // Only allow deletion for own messages
    if (isOwn && !message.isDeleted) {
      deleteMessageMutation.mutate({ messageId: message.id, chatId });
    }
  };

  const handleLanguageSelect = async (languageCode: string) => {
    // Only translate text messages
    if (message.messageType !== 'text' && message.messageType !== undefined) {
      return;
    }

    try {
      const translatedText = await translate({
        text: message.content,
        targetLanguage: languageCode,
      });

      setTranslatedContent(translatedText);
      setShowLanguages(false); // Hide language buttons after translation
    } catch (error) {
      console.error('Translation failed:', error);
      // Keep original content on failure
    }
  };

  const handleTranslateClick = () => {
    setShowLanguages(!showLanguages);
  };

  // Close actions and language buttons when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowActions(false);
        setShowLanguages(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
              className="rounded-md max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
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
            {translatedContent || message.content}
          </p>
        );
    }
  };

  return (
    <motion.div
    ref={containerRef}
    initial={{ opacity: 0, x: isOwn ? 10 : -10, filter: 'blur(10px)'}}
    whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
    viewport={{ once: true, margin: "-10px" }}
    transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
    exit={{ opacity: 0, x: isOwn ? 10 : -10, filter: 'blur(10px)' }}
      className={cn(
        'flex  relative',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >

<AnimatePresence>
{isOwn && showActions && <MessageActions isOwn={isOwn} showLanguages={showLanguages} onMouseEnter={handleActionsMouseEnter} onMouseLeave={handleActionsMouseLeave} onCopy={handleCopy} onDelete={handleDelete} onTranslate={handleTranslateClick} onLanguageSelect={handleLanguageSelect} isTranslating={isTranslating} />}
</AnimatePresence>

      <div >

      <div
        className={cn(
          'min-w-24 lg:max-w-md px-4 py-1 rounded-t-md',
          isOwn ? 'rounded-bl-md' : 'rounded-br-md',
          isOwn ? 'bg-stone-200' : 'bg-white',
          'text-neutral-900 border border-neutral-200',
          // Adjust padding for image messages
          message.messageType === 'image' ? 'p-2' : 'px-4 py-1'
        )}
        onDoubleClick={handleDoubleClick}
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
          </div>
       <AnimatePresence>
{!isOwn && showActions && <MessageActions isOwn={isOwn} showLanguages={showLanguages} onMouseEnter={handleActionsMouseEnter} onMouseLeave={handleActionsMouseLeave} onCopy={handleCopy} onDelete={handleDelete} onTranslate={handleTranslateClick} onLanguageSelect={handleLanguageSelect} isTranslating={isTranslating} />}
</AnimatePresence>

    </motion.div>
  );
};