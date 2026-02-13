import { useState, useMemo } from "react";
import { ChatSidebarHeader } from "./chat-sidebar-header";
import { ChatList } from "./chat-list";
import { UserList } from "./user-list";
import { StatusBar } from "./status-bar";
import { StatusDialog } from "../features/status-dialog";
import { useAllStatuses } from "@/lib/api/queries";
import type {
  ChatListItem,
  UserListItem,
  ChatUser,
  ActiveTab,
} from "../../lib/shared";

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
  const [selectedStatusUserId, setSelectedStatusUserId] = useState<
    string | null
  >(null);

  // Fetch all statuses
  const { data: allStatusesData } = useAllStatuses();

  // Group statuses by user
  const statusesByUser = useMemo(() => {
    const statuses = allStatusesData?.statuses || [];
    const grouped: Record<
      string,
      { userName: string; avatar: string | null; statuses: typeof statuses }
    > = {};

    for (const status of statuses) {
      const userId = status.userId;
      if (!grouped[userId]) {
        grouped[userId] = {
          userName: status.user?.name || "Unknown",
          avatar: status.user?.avatar || null,
          statuses: [],
        };
      }
      grouped[userId].statuses.push(status);
    }

    return grouped;
  }, [allStatusesData]);

  const hasStatuses = Object.keys(statusesByUser).length > 0;

  // Get selected user's statuses for the dialog
  const selectedUserStatuses = selectedStatusUserId
    ? statusesByUser[selectedStatusUserId]
    : null;

  return (
    <div className="w-80 bg-white border-r border-neutral-200 flex flex-col shadow-sm relative z-0">
      <ChatSidebarHeader activeTab={activeTab} onTabChange={onTabChange} />

      {/* Status Bar - shows all users with active statuses */}
      {hasStatuses && (
        <StatusBar
          statusesByUser={statusesByUser}
          currentUserId={currentUser._id}
          onUserClick={(userId) => setSelectedStatusUserId(userId)}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4 scrollbar-none z-10 relative">
        {activeTab === "chats" ? (
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

      {/* Status Viewing Dialog */}
      {selectedUserStatuses && (
        <StatusDialog
          isOpen={!!selectedStatusUserId}
          onClose={() => setSelectedStatusUserId(null)}
          statuses={selectedUserStatuses.statuses}
          userName={selectedUserStatuses.userName}
        />
      )}
    </div>
  );
};
