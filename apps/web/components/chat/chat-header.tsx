import type { ChatListItem, ChatUser } from '@repo/shared';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSocket } from '@/contexts/socket-context';

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
  const { isConnected, isConnecting } = useSocket();

  const otherUser = selectedChat.participants?.find(u => u && u.id !== currentUser._id);
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
        <div className="flex-1">
          <h2 className="font-semibold text-neutral-900">
            {selectedChat.isGroupChat 
              ? selectedChat.name || 'Group Chat'
              : otherUser?.name || 'User'
            }
          </h2>
          <p className="text-sm text-neutral-500">
            {selectedChat.isGroupChat
              ? `${selectedChat.participants?.length || 0} members`
              : isOnline
                ? 'Online'
                : 'Offline'
            }
          </p>
        </div>
        
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${
            isConnecting 
              ? 'bg-yellow-500 animate-pulse' 
              : isConnected 
                ? 'bg-green-500' 
                : 'bg-red-500'
          }`}></div>
          <span className="text-xs text-neutral-400">
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  );
};