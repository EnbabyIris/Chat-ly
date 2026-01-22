import type { ChatListItem, ChatUser } from '../../lib/shared';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useUserStatusesById } from '@/lib/api/queries/status.queries';
import { format, formatDistanceStrict } from 'date-fns';
import { motion } from 'framer-motion';

interface ChatHeaderProps {
  selectedChat: ChatListItem;
  currentUser: ChatUser;
  onlinePeople: string[];
  isCollapsed?: boolean;
  onStatusClick?: () => void;
}

// Constants for styling
const AVATAR_CLASSES = "w-8 h-8 bg-linear-to-br from-neutral-200 to-neutral-300 rounded-full flex items-center justify-center mr-3 overflow-hidden";
const ONLINE_RING = "ring-2 ring-green-400";
const SPRING_CONFIG = { type: "spring" as const, stiffness: 300, damping: 25 };

export const ChatHeader = ({
  selectedChat,
  currentUser,
  onlinePeople,
  isCollapsed = false,
  onStatusClick,
}: ChatHeaderProps) => {
  const { isUserOnline } = useOnlineStatus();
  const otherUser = selectedChat.participants?.find(u => u && u.id !== currentUser._id);
  const { data: userStatuses } = useUserStatusesById(otherUser?.id || '');

  const hasStatuses = userStatuses && userStatuses.statuses.length > 0;

  const isOnline = otherUser && (onlinePeople.includes(otherUser.id) || isUserOnline(otherUser.id));
  const lastSeenDate = new Date(otherUser?.lastSeen || Date.now());

  const imageUrl = selectedChat.isGroupChat ? selectedChat.avatar : otherUser?.avatar;
  const displayName = selectedChat.isGroupChat
    ? selectedChat.name || 'Group Chat'
    : otherUser?.name || 'User';

  // Time abbreviations mapping for cleaner code
  const TIME_ABBREVIATIONS = {
    ' hours': 'hrs', ' hour': 'hr',
    ' minutes': 'mins', ' minute': 'min',
    ' seconds': 'secs', ' second': 'sec',
    ' days': 'days', ' day': 'day',
    ' weeks': 'wks', ' week': 'wk',
    ' months': 'mos', ' month': 'mo',
    ' years': 'yrs', ' year': 'yr',
  } as const;

  const getAbbreviatedTime = (date: Date) => {
    const distance = formatDistanceStrict(date, new Date());
    return Object.entries(TIME_ABBREVIATIONS).reduce(
      (result, [full, abbr]) => result.replace(full, abbr),
      distance
    );
  };

  return (
    <motion.div
      className="bg-white left-1/2 -translate-x-1/2 backdrop-blur-md border top-1 z-5 absolute border-neutral-200 rounded-lg overflow-hidden"
      animate={{
        padding: isCollapsed ? '4px 8px' : '4px 8px',
      }}
      transition={SPRING_CONFIG}
    >
      <div className="flex items-center">
        <div className={`${AVATAR_CLASSES} ${!selectedChat.isGroupChat && isOnline ? ONLINE_RING : ''}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<span class="text-sm font-medium text-neutral-600">${displayName.charAt(0).toUpperCase()}</span>`;
                }
              }}
            />
          ) : (
            <span className="text-sm font-medium text-neutral-600">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <h2 className="font-semibold text-neutral-600">{displayName}</h2>

        <motion.div
          className="flex items-center"
          animate={{
            opacity: isCollapsed ? 0 : 1,
            width: isCollapsed ? 0 : 'auto',
            marginLeft: isCollapsed ? 0 : '12px',
          }}
          transition={SPRING_CONFIG}
        >
          <div className="mx-3 h-4 w-px bg-neutral-300" />
          <div className="text-xs text-neutral-500 cursor-pointer overflow-hidden">
            {isOnline ? (
              'Online'
            ) : (
              <motion.button
                className="flex items-center gap-0.5 overflow-hidden bg-transparent border-none p-0 m-0 text-xs text-neutral-500 cursor-pointer"
                whileHover="hover"
                initial="initial"
              >
                <motion.span
                  className="whitespace-nowrap"
                  variants={{
                    initial: { width: 0, opacity: 0 },
                    hover: { width: "auto", opacity: 1 }
                  }}
                  transition={SPRING_CONFIG}
                >
                  Last online
                </motion.span>
                <motion.span
                  className="whitespace-nowrap"
                  variants={{
                    initial: { width: "auto", opacity: 1 },
                    hover: { width: 0, opacity: 0 }
                  }}
                  transition={SPRING_CONFIG}
                >
                  {getAbbreviatedTime(lastSeenDate)} ago
                </motion.span>
                <motion.span
                  className="whitespace-nowrap"
                  variants={{
                    initial: { width: 0, opacity: 0 },
                    hover: { width: "auto", opacity: 1 }
                  }}
                  transition={SPRING_CONFIG}
                >
                  {formatDistanceStrict(lastSeenDate, new Date())}
                </motion.span>
              </motion.button>
            )}
          </div>
          <div className="mx-3 h-4 w-px bg-neutral-300" />
          <button
            onClick={hasStatuses ? onStatusClick : undefined}
            disabled={!hasStatuses}
            className={`text-xs py-1 px-2 rounded-sm transition-colors ${
              hasStatuses
                ? 'bg-gray-100 text-neutral-400 hover:bg-gray-200 cursor-pointer'
                : 'bg-gray-50 text-neutral-300 cursor-not-allowed'
            }`}
          >
            moment
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};