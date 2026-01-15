import { useCallback } from 'react';
import type { UserListItem, ChatListItem, ChatUser, ActiveTab } from '@repo/shared';

interface UseChatActionsParams {
  currentUser: ChatUser;
  setSelectedChat: (chat: ChatListItem | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

interface UseChatActionsReturn {
  handleSendMessage: (message: string) => void;
  handleSendFile: (file: File) => void;
  handleStartChat: (user: UserListItem) => void;
}

export const useChatActions = ({
  currentUser,
  setSelectedChat,
  setActiveTab,
}: UseChatActionsParams): UseChatActionsReturn => {
  const handleSendMessage = useCallback((message: string) => {
    console.log('Sending message:', message);
    // TODO: In a real app, this would send the message to the backend
  }, []);

  const handleSendFile = useCallback((file: File) => {
    console.log('Sending file:', file.name);
    // TODO: In a real app, this would upload and send the file
  }, []);

  const handleStartChat = useCallback((user: User) => {
    // Create a new chat with the selected user
    const newChat: Chat = {
      _id: `chat-${user._id}`,
      isGroupChat: false,
      users: [
        {
          _id: user._id,
          name: user.name,
          pic: user.pic,
        },
        currentUser,
      ],
      latestMessage: {
        content: 'Chat started',
        sender: { name: 'System' },
      },
    };
    setSelectedChat(newChat);
    setActiveTab('chats');
  }, [currentUser, setSelectedChat, setActiveTab]);

  return {
    handleSendMessage,
    handleSendFile,
    handleStartChat,
  };
};