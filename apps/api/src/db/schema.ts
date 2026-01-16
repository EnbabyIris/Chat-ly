import { pgTable, uuid, varchar, text, timestamp, boolean, index, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  avatar: text('avatar'), // URL to profile picture
  bio: text('bio'), // User bio/status
  isOnline: boolean('is_online').default(false).notNull(),
  lastSeen: timestamp('last_seen'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Performance indexes
  emailIdx: index('users_email_idx').on(table.email),
  onlineIdx: index('users_online_idx').on(table.isOnline),
  nameIdx: index('users_name_idx').on(table.name),
}));


export const chats = pgTable('chats', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }), // null for 1:1 chats, required for group chats
  isGroupChat: boolean('is_group_chat').default(false).notNull(),
  groupAdmin: uuid('group_admin').references(() => users.id, { onDelete: 'set null' }), // only for group chats
  avatar: text('avatar'), // group chat avatar URL
  description: text('description'), // group chat description
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Performance indexes
  groupChatIdx: index('chats_group_chat_idx').on(table.isGroupChat),
  adminIdx: index('chats_admin_idx').on(table.groupAdmin),
  updatedAtIdx: index('chats_updated_at_idx').on(table.updatedAt),
}));

// ================================
// CHAT PARTICIPANTS (many-to-many relationship)
// ================================
export const chatParticipants = pgTable('chat_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(), // 'admin' | 'member'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'), // null if still in chat
  isActive: boolean('is_active').default(true).notNull(), // for soft delete
}, (table) => ({
  // Performance indexes
  chatUserIdx: index('chat_participants_chat_user_idx').on(table.chatId, table.userId),
  userChatsIdx: index('chat_participants_user_chats_idx').on(table.userId),
  activeIdx: index('chat_participants_active_idx').on(table.isActive),
  // Unique constraint for active participants
  uniqueActiveChatUser: index('chat_participants_unique_active_idx').on(table.chatId, table.userId, table.isActive),
}));

// ================================
// MESSAGES TABLE
// ================================
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'set null' }), // null for system messages
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 50 }).default('text').notNull(), // 'text' | 'image' | 'file' | 'system'
  attachmentUrl: text('attachment_url'), // for file/image messages
  attachmentName: varchar('attachment_name', { length: 255 }), // original file name
  attachmentSize: varchar('attachment_size', { length: 50 }), // file size in bytes
  // Location-specific fields for location messages
  latitude: decimal('latitude', { precision: 10, scale: 8 }), // GPS latitude (-90 to 90)
  longitude: decimal('longitude', { precision: 11, scale: 8 }), // GPS longitude (-180 to 180)
  locationAddress: text('location_address'), // Human-readable address for location messages
  isEdited: boolean('is_edited').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  editedAt: timestamp('edited_at'), // when message was last edited
  replyToId: uuid('reply_to_id'), // for message replies
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Performance indexes
  chatMessagesIdx: index('messages_chat_messages_idx').on(table.chatId, table.createdAt),
  senderIdx: index('messages_sender_idx').on(table.senderId),
  typeIdx: index('messages_type_idx').on(table.messageType),
  deletedIdx: index('messages_deleted_idx').on(table.isDeleted),
  replyIdx: index('messages_reply_idx').on(table.replyToId),
  // Location indexes for location-based queries
  locationIdx: index('messages_location_idx').on(table.latitude, table.longitude),
}));

// Add foreign key reference for replyToId after table definition
// This avoids circular reference issues during TypeScript compilation

// ================================
// MESSAGE READ RECEIPTS
// ================================
export const messageReadReceipts = pgTable('message_read_receipts', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').references(() => messages.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  readAt: timestamp('read_at').defaultNow().notNull(),
}, (table) => ({
  // Performance indexes
  messageUserIdx: index('message_read_receipts_message_user_idx').on(table.messageId, table.userId),
  userMessagesIdx: index('message_read_receipts_user_messages_idx').on(table.userId),
  readAtIdx: index('message_read_receipts_read_at_idx').on(table.readAt),
  // Unique constraint to prevent duplicate read receipts
  uniqueMessageUser: index('message_read_receipts_unique_idx').on(table.messageId, table.userId),
}));

// ================================
// REFRESH TOKENS (for JWT authentication)
// ================================
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  deviceInfo: text('device_info'), // optional device/browser info
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Performance indexes
  userTokensIdx: index('refresh_tokens_user_tokens_idx').on(table.userId),
  tokenIdx: index('refresh_tokens_token_idx').on(table.token),
  expiresAtIdx: index('refresh_tokens_expires_at_idx').on(table.expiresAt),
  revokedIdx: index('refresh_tokens_revoked_idx').on(table.isRevoked),
}));


// ================================
// RELATIONS DEFINITIONS
// ================================

// Users relations
export const usersRelations = relations(users, ({ many }) => ({
  chatParticipants: many(chatParticipants),
  sentMessages: many(messages),
  refreshTokens: many(refreshTokens),
  messageReadReceipts: many(messageReadReceipts),
  adminOfChats: many(chats, { relationName: 'chatAdmin' }),
}));

// Chats relations
export const chatsRelations = relations(chats, ({ many, one }) => ({
  participants: many(chatParticipants),
  messages: many(messages),
  admin: one(users, {
    fields: [chats.groupAdmin],
    references: [users.id],
    relationName: 'chatAdmin',
  }),
}));

// Chat participants relations
export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  chat: one(chats, {
    fields: [chatParticipants.chatId],
    references: [chats.id],
  }),
  user: one(users, {
    fields: [chatParticipants.userId],
    references: [users.id],
  }),
}));

// Messages relations
export const messagesRelations = relations(messages, ({ one, many }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  readReceipts: many(messageReadReceipts),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
    relationName: 'messageReplies',
  }),
  replies: many(messages, { relationName: 'messageReplies' }),
}));

// Message read receipts relations
export const messageReadReceiptsRelations = relations(messageReadReceipts, ({ one }) => ({
  message: one(messages, {
    fields: [messageReadReceipts.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [messageReadReceipts.userId],
    references: [users.id],
  }),
}));

// Refresh tokens relations
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));
