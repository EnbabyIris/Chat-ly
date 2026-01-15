import type { ChatListItem, ChatUser } from '@repo/shared';
import { useOnlineStatus } from '@/hooks/use-online-status';

interface ChatHeaderProps {
  selectedChat: ChatListItem;
  currentUser: ChatUser;
  onlinePeople: string[];
}

export const ChatHeader = ({
  selectedChat,
  currentUser,
  onlinePeople,
}: ChatHeaderProps) => {
  const { isUserOnline } = useOnlineStatus();

  const otherUser = selectedChat.participants
    .map(p => p.user)
    .find(u => u && u.id !== currentUser._id);
  const isOnline = otherUser && (onlinePeople.includes(otherUser.id) || isUserOnline(otherUser.id));

  return (
    <div className="bg-white/5 backdrop-blur-md border top-1 right-1  absolute  border-neutral-200 p-2 rounded-lg ">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-linear-to-br from-neutral-200 to-neutral-300 rounded-full flex items-center justify-center mr-3">
          {selectedChat.isGroupChat ? (
            <span className="text-sm font-medium text-neutral-600">
              {selectedChat.name?.charAt(0).toUpperCase() || 'G'}
            </span>
          ) : (
            <span className="text-sm font-medium text-neutral-600">
              {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div>
          <h2 className="font-semibold text-neutral-900">
            {selectedChat.isGroupChat 
              ? selectedChat.name || 'Group Chat'
              : otherUser?.name || 'Unknown'
            }
          </h2>
          <p className="text-sm text-neutral-500">
            {selectedChat.isGroupChat 
              ? `${selectedChat.participants.length} members`
              : isOnline 
                ? 'Online' 
                : 'Offline'
            }
          </p>
        </div>
      </div>
    </div>
  );
};