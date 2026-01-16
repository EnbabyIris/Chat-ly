export interface Message {
  id: string;
  chatId: string;
  senderId: string | null;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'location' | 'system';
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentSize: string | null;
  // Location-specific fields
  latitude?: number | null;
  longitude?: number | null;
  locationAddress?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  editedAt: Date | null;
  replyToId: string | null;
  createdAt: Date;
  updatedAt: Date;
  sender?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  readReceipts?: MessageReadReceipt[];
}

export interface MessageReadReceipt {
  id: string;
  messageId: string;
  userId: string;
  readAt: Date;
  user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface SendMessageDTO {
  chatId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'location';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  // Location-specific fields for location messages
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  replyToId?: string;
}

export interface UpdateMessageDTO {
  content: string;
}

export interface LocationMessage {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface MessageWithContext extends Message {
  isOwn: boolean;
  isRead: boolean;
  deliveredTo: string[];
  readBy: string[];
}

export interface TypingIndicator {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  lastTypingAt: Date;
}