export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'chat_created' | 'user_joined' | 'user_left';
  title: string;
  message: string;
  chatId?: string;
  messageId?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSummary {
  unreadCount: number;
  notifications: Notification[];
}

export interface CreateNotificationDTO {
  userId: string;
  type: 'message' | 'chat_created' | 'user_joined' | 'user_left';
  title: string;
  message: string;
  chatId?: string;
  messageId?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
}

export interface MarkNotificationReadDTO {
  notificationId: string;
}

export interface NotificationFilters {
  limit?: number;
  unreadOnly?: boolean;
  before?: string;
  after?: string;
}