import { UserListItem } from './user';

// ================================
// BASE CHAT INTERFACE
// ================================

export interface Chat {
  id: string;
  name: string | null;
  isGroupChat: boolean;
  groupAdmin: string | null;
  avatar: string | null;
  description: string | null;
  participants: ChatParticipant[];
  latestMessage?: import('./message').Message;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ================================
// GROUP CHAT SPECIFIC TYPES
// ================================

export interface GroupChat extends Chat {
  isGroupChat: true;
  name: string; // Required for group chats
  groupAdmin: string; // Required for group chats
  description: string | null;
  avatar: string | null;
}

export interface DirectChat extends Chat {
  isGroupChat: false;
  name: null; // Not used for direct chats
  groupAdmin: null; // Not used for direct chats
  description: null; // Not used for direct chats
  avatar: null; // Not used for direct chats
}

// Re-export Chat as union type
export type ChatType = GroupChat | DirectChat;

// ================================
// PARTICIPANT MANAGEMENT
// ================================

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

export interface GroupParticipant extends ChatParticipant {
  role: 'admin' | 'member';
  canBeRemoved: boolean; // Admin cannot be removed if they're the only admin
  canTransferAdmin: boolean; // Can transfer admin role to this participant
}

// ================================
// GROUP CHAT OPERATIONS
// ================================

export interface CreateGroupChatDTO {
  name: string;
  description?: string;
  avatar?: string;
  participantIds: string[]; // Must include at least 2 participants besides creator
}

export interface AddParticipantsDTO {
  participantIds: string[];
}

export interface RemoveParticipantDTO {
  participantId: string;
}

export interface TransferAdminDTO {
  newAdminId: string;
}

export interface ArchiveChatDTO {
  reason?: string; // Optional reason for archiving
}

export interface DeleteChatDTO {
  reason?: string; // Optional reason for deletion
  hardDelete?: boolean; // Default false for soft delete
}

// ================================
// RESPONSE TYPES
// ================================

export interface GroupChatCreationResponse {
  chat: GroupChat;
  participants: GroupParticipant[];
  success: true;
}

export interface ParticipantOperationResponse {
  chatId: string;
  participantId: string;
  operation: 'added' | 'removed' | 'admin_transferred';
  newAdminId?: string; // Only for admin transfer
  success: true;
}

export interface ArchiveOperationResponse {
  chatId: string;
  operation: 'archived' | 'restored' | 'deleted';
  success: true;
}

// ================================
// EXISTING TYPES (ENHANCED)
// ================================

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
    messageType: 'text' | 'image' | 'file' | 'location' | 'system';
    createdAt: Date;
  };
  unreadCount: number;
  updatedAt: Date;
  // Group chat specific fields
  canAddParticipants?: boolean;
  canRemoveParticipants?: boolean;
  canTransferAdmin?: boolean;
  canArchive?: boolean;
  isArchived?: boolean;
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
  isArchived?: boolean;
}

// ================================
// UTILITY TYPES
// ================================

export type GroupChatRole = 'admin' | 'member';
export type ChatOperation = 'create' | 'update' | 'add_participants' | 'remove_participant' | 'transfer_admin' | 'archive' | 'delete';
export type ArchiveStatus = 'active' | 'archived' | 'deleted';

export interface GroupChatPermissions {
  canEdit: boolean;
  canAddParticipants: boolean;
  canRemoveParticipants: boolean;
  canTransferAdmin: boolean;
  canArchive: boolean;
  canDelete: boolean;
  isAdmin: boolean;
  isCreator: boolean;
}

export type ActiveTab = 'chats' | 'users';