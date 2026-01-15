export interface Message {
  id: string;
  chatId: string;
  senderId: string | null;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentSize: string | null;
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
  messageType?: 'text' | 'image' | 'file';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  replyToId?: string;
}

export interface UpdateMessageDTO {
  content: string;
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