'use client';

import { useState, useCallback } from 'react';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatArea } from '@/components/chat/chat-area';
import { FloatingHeader } from '@/components/layouts/floating-header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useChatData } from '@/hooks/use-chat-data';
import { useChatFilters } from '@/hooks/use-chat-filters';
import { useChatActions } from '@/hooks/use-chat-actions';
import { useRealTimeMessages } from '@/hooks/use-real-time-messages';
import { useRealTimeNotifications } from '@/hooks/use-real-time-notifications';
import { useAuth } from '@/contexts/auth-context';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getErrorMessage } from '@/lib/utils/error-messages';
import { useQueryClient } from '@tanstack/react-query';
import type { ChatListItem, ActiveTab } from '@repo/shared';

function ChatsPageContent() {
  const [selectedChat, setSelectedChat] = useState<ChatListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const { user } = useAuth();
  const { isOffline } = useNetworkStatus();
  const { onlineUsers } = useOnlineStatus();
  const queryClient = useQueryClient();

  // Debounce search query to avoid excessive filtering/API calls
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Get data from custom hooks
  const { users, chats, currentUser, onlinePeople, isLoading, error } = useChatData();
  
  // Create consistent current user (prefer auth context over API data)
  const activeCurrentUser = user ? {
    _id: user.id,
    name: user.name,
    pic: user.avatar || '',
    email: user.email,
    isOnline: true,
  } : currentUser || { _id: '', name: '', pic: '', email: '', isOnline: false };

  // Filter data based on debounced search query
  const { filteredUsers, filteredChats } = useChatFilters({
    users,
    chats,
    searchQuery: debouncedSearchQuery,
    currentUser: activeCurrentUser,
  });

  // Get action handlers
  const { handleSendMessage, handleSendFile, handleStartChat } = useChatActions({
    currentUser: activeCurrentUser,
    setSelectedChat,
    setActiveTab,
    chats,
  });

  // Setup real-time message handling
  useRealTimeMessages({
    selectedChatId: selectedChat?.id,
    currentUserId: activeCurrentUser._id,
  });

  // Setup real-time notification handling
  useRealTimeNotifications({
    currentUserId: activeCurrentUser._id,
  });

  // Notification navigation handler
  const handleNotificationChatSelect = useCallback((chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setSelectedChat(chat);
    }
  }, [chats]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    const errorMessage = getErrorMessage(error);
    
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to load chats</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button 
            onClick={() => {
              // Retry by invalidating queries
              queryClient.invalidateQueries();
            }} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-end p-4 px-20 justify-center bg-neutral-50 relative">
      {/* Network Status Indicator */}
      {isOffline && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">⚠️ You are offline. Some features may be limited.</p>
        </div>
      )}
      
      {/* Floating Header */}
      {activeCurrentUser._id && (
        <FloatingHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentUser={activeCurrentUser}
          onChatSelect={handleNotificationChatSelect}
          onTabChange={setActiveTab}
        />
      )}

      <div className="h-[90%] border-gray-200 rounded-xl overflow-hidden border w-full flex">
        <ChatSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filteredChats={filteredChats}
          filteredUsers={filteredUsers}
          currentUser={activeCurrentUser}
          selectedChat={selectedChat}
          onlinePeople={Array.from(onlineUsers)}
          onChatSelect={setSelectedChat}
          onUserSelect={handleStartChat}
        />

        <ChatArea
          selectedChat={selectedChat}
          currentUser={activeCurrentUser}
          onlinePeople={onlinePeople}
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
        />
      </div>
    </div>
  );
}

export default function ChatsPage() {
  return (
    <ProtectedRoute>
      <ChatsPageContent />
    </ProtectedRoute>
  );
}