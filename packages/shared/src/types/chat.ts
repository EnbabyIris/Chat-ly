import { UserListItem } from './user';
import { Message } from './message';

export interface Chat {
  id: string;
  name: string | null;
  isGroupChat: boolean;
  groupAdmin: string | null;
  avatar: string | null;
  description: string | null;
  participants: ChatParticipant[];
  latestMessage?: Message;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  leftAt: Date | null;
  isActive: boolean;
  user?: UserListItem;
}

export interface ChatListItem {
  id: string;
  name: string | null;
  isGroupChat: boolean;
  avatar: string | null;
  participants: UserListItem[];
  latestMessage?: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    messageType: 'text' | 'image' | 'file' | 'system';
    createdAt: Date;
  };
  unreadCount: number;
  updatedAt: Date;
}

export interface CreateChatDTO {
  participantIds: string[];
  isGroupChat?: boolean;
  name?: string;
  avatar?: string;
  description?: string;
}

export interface UpdateChatDTO {
  name?: string;
  avatar?: string;
  description?: string;
}

export interface ChatSummary {
  id: string;
  name: string | null;
  isGroupChat: boolean;
  avatar: string | null;
  participantCount: number;
  lastActivity: Date;
}

export type ActiveTab = 'chats' | 'users';