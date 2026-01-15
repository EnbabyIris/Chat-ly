import { ChatSidebarHeader } from './chat-sidebar-header';
import { ChatList } from './chat-list';
import { UserList } from './user-list';
import type { ChatListItem, UserListItem, ChatUser, ActiveTab } from '@repo/shared';

interface ChatSidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  filteredChats: ChatListItem[];
  filteredUsers: UserListItem[];
  currentUser: ChatUser;
  selectedChat: ChatListItem | null;
  onlinePeople: string[];
  onChatSelect: (chat: ChatListItem) => void;
  onUserSelect: (user: UserListItem) => void;
}

export const ChatSidebar = ({
  activeTab,
  onTabChange,
  filteredChats,
  filteredUsers,
  currentUser,
  selectedChat,
  onlinePeople,
  onChatSelect,
  onUserSelect,
}: ChatSidebarProps) => {
  return (
    <div className="w-80 bg-white border-r border-neutral-200 flex flex-col shadow-sm">
      <ChatSidebarHeader
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'chats' ? (
          <ChatList
            chats={filteredChats}
            currentUser={currentUser}
            selectedChat={selectedChat}
            onlinePeople={onlinePeople}
            onChatSelect={onChatSelect}
          />
        ) : (
          <UserList users={filteredUsers} onUserSelect={onUserSelect} />
        )}
      </div>
    </div>
  );
};