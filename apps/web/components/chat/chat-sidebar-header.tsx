import { Users, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveTab } from '@repo/shared';

interface ChatSidebarHeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const ChatSidebarHeader = ({
  activeTab,
  onTabChange,
}: ChatSidebarHeaderProps) => {

  return (
    <div className="p-4 border-b border-neutral-200">

      {/* Tabs */}
      <div className="flex space-x-1 border border-gray-200 bg-neutral-100 rounded-lg p-1">
        <button
          onClick={() => onTabChange('chats')}
          className={cn(
            'flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2',
            activeTab === 'chats'
              ? 'bg-white text-neutral-900 shadow-chat-sidebar-header'
              : 'text-neutral-600 hover:text-neutral-900'
          )}
        >
          <MessageCircle className="w-4 h-4" />
          Chats
        </button>
        
        {/* Divider */}
        <div className="w-px h-6 bg-neutral-300 self-center"></div>
        
        <button
          onClick={() => onTabChange('users')}
          className={cn(
            'flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2',
            activeTab === 'users'
              ? 'bg-white text-neutral-900 shadow-chat-sidebar-header'
              : 'text-neutral-600 hover:text-neutral-900'
          )}
        >
          <Users className="w-4 h-4" />
          Users
        </button>
      </div>
    </div>
  );
};