import { useCallback } from 'react';
import { useCreateChat } from '@/lib/api/queries';
import { useSocket } from '@/contexts/socket-context';
import { SOCKET_EVENTS } from '@repo/shared/constants';
import type { UserListItem, ChatListItem, ChatUser, ActiveTab, Chat, ChatParticipant } from '@repo/shared';

interface UseChatActionsParams {
  currentUser: ChatUser;
  setSelectedChat: (chat: ChatListItem | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  chats: ChatListItem[];
}

interface UseChatActionsReturn {
  handleSendMessage: (message: string, chatId?: string) => void;
  handleSendFile: (file: File) => void;
  handleStartChat: (user: UserListItem) => void;
  isCreatingChat: boolean;
}

export const useChatActions = ({
  currentUser,
  setSelectedChat,
  setActiveTab,
  chats,
}: UseChatActionsParams): UseChatActionsReturn => {
  const createChatMutation = useCreateChat();
  const { socket, isConnected } = useSocket();

  const handleSendMessage = useCallback((message: string, chatId?: string) => {
    if (!message.trim()) return;

    const targetChatId = chatId;
    if (!targetChatId) {
      console.error('No chat ID provided for message sending');
      return;
    }

    // Send via Socket.IO only (saves to DB and broadcasts to all participants)
    if (socket && isConnected) {
      socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
        chatId: targetChatId,
        content: message.trim(),
        messageType: 'text',
      });
      console.log('📤 Message sent via Socket.IO');
    } else {
      console.error('❌ Socket not connected - cannot send message');
      // TODO: Show error notification to user
    }
  }, [socket, isConnected]);

  const handleSendFile = useCallback((file: File) => {
    // TODO: Implement file upload and sending
    console.log('Sending file:', file.name);
    // This would involve:
    // 1. Upload file to storage (Cloudinary, S3, etc.)
    // 2. Get file URL
    // 3. Send message with attachment URL
  }, []);

  const handleStartChat = useCallback((user: UserListItem) => {
    if (createChatMutation.isPending) {
      return;
    }
    
    // Check if 1:1 chat with this user already exists locally
    const existingChat = Array.isArray(chats) ? chats.find(chat => 
      !chat.isGroupChat && 
      chat.participants.length === 2 &&
      chat.participants.some(participant => participant.id === user.id) &&
      chat.participants.some(participant => participant.id === currentUser._id)
    ) : null;
    
    if (existingChat) {
      setSelectedChat(existingChat);
      setActiveTab('chats');
      return;
    }
    createChatMutation.mutate(
      {
        participantIds: [user.id],
        isGroupChat: false,
      },
      {
        onSuccess: (createdChat: Chat) => {
          // Add null checks for chat data
          if (!createdChat || !createdChat.id) {
            console.error('Invalid chat data - missing ID:', createdChat);
            alert('Error: Invalid chat data received from server');
            return;
          }

          if (!createdChat.participants || !Array.isArray(createdChat.participants)) {
            console.error('Invalid participants data:', createdChat.participants);
            alert('Error: Invalid chat data received from server');
            return;
          }

          // Convert API response (Chat) to ChatListItem format
          const chatListItem: ChatListItem = {
            id: createdChat.id,
            name: createdChat.name,
            isGroupChat: createdChat.isGroupChat,
            avatar: createdChat.avatar,
            participants: createdChat.participants
              .filter((participant: ChatParticipant) => participant.user)
              .map((participant: ChatParticipant) => ({
                id: participant.user!.id,
                name: participant.user!.name,
                email: participant.user!.email,
                avatar: participant.user!.avatar,
                isOnline: participant.user!.isOnline,
                lastSeen: participant.user!.lastSeen,
              })),
            latestMessage: createdChat.latestMessage ? {
              id: createdChat.latestMessage.id,
              content: createdChat.latestMessage.content,
              senderId: createdChat.latestMessage.senderId || '',
              senderName: createdChat.latestMessage.sender?.name || 'User',
              messageType: createdChat.latestMessage.messageType,
              createdAt: new Date(createdChat.latestMessage.createdAt),
            } : undefined,
            unreadCount: createdChat.unreadCount || 0,
            updatedAt: new Date(createdChat.updatedAt),
          };

          // Validate chatListItem before setting
          if (!chatListItem.id) {
            console.error('ChatListItem has invalid ID:', chatListItem);
            alert('Error: Failed to process chat data');
            return;
          }
          
          setSelectedChat(chatListItem);
          setActiveTab('chats');
        },
        onError: (error) => {
          // More detailed error handling
          let errorMessage = 'Unknown error occurred';
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = (error as any).message;
          }
          
          alert(`Failed to create chat: ${errorMessage}`);
        },
      }
    );
  }, [currentUser, setSelectedChat, setActiveTab, createChatMutation, chats]);

  return {
    handleSendMessage,
    handleSendFile,
    handleStartChat,
    isCreatingChat: createChatMutation.isPending,
  };
};