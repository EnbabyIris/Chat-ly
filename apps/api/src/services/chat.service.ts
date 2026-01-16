import { db, chats, chatParticipants, messages } from '../db';
import { eq, and, inArray, desc, isNull } from 'drizzle-orm';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { ERROR_MESSAGES } from '@repo/shared/constants';
import type { CreateChatDTO, UpdateChatDTO, ChatListItem } from '@repo/shared/types';

export class ChatService {
  async createChat(userId: string, data: CreateChatDTO) {
    // Validate: can't chat with yourself
    if (data.participantIds.includes(userId)) {
      throw new ValidationError(ERROR_MESSAGES.CANNOT_MESSAGE_YOURSELF);
    }

    // Check if 1:1 chat already exists
    if (!data.isGroupChat && data.participantIds.length === 1) {
      const existingChat = await this.findExistingOneToOneChat(userId, data.participantIds[0]);
      if (existingChat) {
        return existingChat;
      }
    }

    // Create chat
    const [newChat] = await db
      .insert(chats)
      .values({
        name: data.name,
        isGroupChat: data.isGroupChat || false,
        groupAdmin: data.isGroupChat ? userId : null,
        avatar: data.avatar,
      })
      .returning();

    // Add participants (including creator)
    const allParticipants = [userId, ...data.participantIds];
    await db.insert(chatParticipants).values(
      allParticipants.map((participantId, index) => ({
        chatId: newChat.id,
        userId: participantId,
        role: index === 0 && data.isGroupChat ? 'admin' : 'member',
      })),
    );

    // Fetch and return complete chat
    return await this.getChatById(newChat.id, userId);
  }

  async findExistingOneToOneChat(user1Id: string, user2Id: string) {
    const chat = await db.query.chats.findFirst({
      where: eq(chats.isGroupChat, false),
      with: {
        participants: {
          where: and(
            inArray(chatParticipants.userId, [user1Id, user2Id]),
            isNull(chatParticipants.leftAt),
          ),
        },
      },
    });

    if (chat && chat.participants.length === 2) {
      return this.getChatById(chat.id, user1Id);
    }

    return null;
  }

  async getChatById(chatId: string, userId: string) {
    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
      with: {
        participants: {
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
        messages: {
          orderBy: desc(messages.createdAt),
          limit: 1,
          with: {
            sender: {
              columns: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundError(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    // Check if user is participant
    const isParticipant = chat.participants.some((p) => p.userId === userId && p.leftAt === null);
    if (!isParticipant) {
      throw new ForbiddenError(ERROR_MESSAGES.NOT_CHAT_PARTICIPANT);
    }

    return chat;
  }

  async getUserChats(userId: string): Promise<ChatListItem[]> {
    const userChats = await db.query.chatParticipants.findMany({
      where: and(eq(chatParticipants.userId, userId), isNull(chatParticipants.leftAt)),
      with: {
        chat: {
          with: {
            participants: {
              where: isNull(chatParticipants.leftAt),
              with: {
                user: {
                  columns: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    isOnline: true,
                    lastSeen: true,
                  },
                },
              },
            },
            messages: {
              orderBy: desc(messages.createdAt),
              limit: 1,
              with: {
                sender: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: desc(chatParticipants.joinedAt),
    });

    return userChats.map((uc) => ({
      id: uc.chat.id,
      name: uc.chat.name,
      isGroupChat: uc.chat.isGroupChat,
      avatar: uc.chat.avatar,
      participants: uc.chat.participants
        .filter((p) => p.user && p.user.id && p.user.name)
        .map((p) => ({
          id: p.user.id,
          name: p.user.name,
          email: p.user.email,
          avatar: p.user.avatar,
          isOnline: p.user.isOnline,
          lastSeen: p.user.lastSeen,
        })),
      latestMessage: uc.chat.messages[0]
        ? {
            id: uc.chat.messages[0].id,
            content: uc.chat.messages[0].content,
            senderId: uc.chat.messages[0].senderId!,
            senderName: uc.chat.messages[0].sender!.name,
            messageType: uc.chat.messages[0].messageType as 'text' | 'image' | 'file' | 'system',
            createdAt: uc.chat.messages[0].createdAt,
          }
        : undefined,
      unreadCount: 0, // TODO: Implement unread count
      updatedAt: uc.chat.updatedAt,
    }));
  }

  async updateChat(chatId: string, userId: string, data: UpdateChatDTO) {
    // Verify user is admin
    const participant = await db.query.chatParticipants.findFirst({
      where: and(eq(chatParticipants.chatId, chatId), eq(chatParticipants.userId, userId)),
    });

    if (!participant || participant.role !== 'admin') {
      throw new ForbiddenError('Only admins can update chat settings');
    }

    const [updatedChat] = await db
      .update(chats)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, chatId))
      .returning();

    return updatedChat;
  }

  async deleteChat(chatId: string, userId: string) {
    // Verify user is admin
    const participant = await db.query.chatParticipants.findFirst({
      where: and(eq(chatParticipants.chatId, chatId), eq(chatParticipants.userId, userId)),
    });

    if (!participant || participant.role !== 'admin') {
      throw new ForbiddenError('Only admins can delete chat');
    }

    await db.delete(chats).where(eq(chats.id, chatId));
  }

  async isUserParticipant(chatId: string, userId: string): Promise<boolean> {
    const participant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId),
        isNull(chatParticipants.leftAt),
      ),
    });

    return !!participant;
  }

  // ================================
  // GROUP MANAGEMENT METHODS
  // ================================

  async addParticipants(chatId: string, userId: string, participantIds: string[]) {
    // Verify chat exists and is a group
    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
    });

    if (!chat) {
      throw new NotFoundError(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    if (!chat.isGroupChat) {
      throw new ValidationError('Cannot add participants to direct chat');
    }

    // Verify user is admin
    const userParticipant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId),
        isNull(chatParticipants.leftAt),
      ),
    });

    if (!userParticipant || userParticipant.role !== 'admin') {
      throw new ForbiddenError('Only admins can add participants');
    }

    // Check for existing participants and filter out duplicates
    const existingParticipants = await db.query.chatParticipants.findMany({
      where: and(
        eq(chatParticipants.chatId, chatId),
        inArray(chatParticipants.userId, participantIds),
        isNull(chatParticipants.leftAt),
      ),
    });

    const existingUserIds = existingParticipants.map(p => p.userId);
    const newParticipantIds = participantIds.filter(id => !existingUserIds.includes(id));

    if (newParticipantIds.length === 0) {
      throw new ValidationError('All participants are already in the group');
    }

    // Add new participants
    await db.insert(chatParticipants).values(
      newParticipantIds.map(participantId => ({
        chatId,
        userId: participantId,
        role: 'member' as const,
      })),
    );

    // Update chat updated_at timestamp
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, chatId));

    return { addedCount: newParticipantIds.length };
  }

  async removeParticipant(chatId: string, userId: string, participantId: string) {
    // Verify chat exists and is a group
    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
    });

    if (!chat) {
      throw new NotFoundError(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    if (!chat.isGroupChat) {
      throw new ValidationError('Cannot remove participants from direct chat');
    }

    // Verify user is admin or removing themselves
    const userParticipant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId),
        isNull(chatParticipants.leftAt),
      ),
    });

    if (!userParticipant) {
      throw new ForbiddenError(ERROR_MESSAGES.NOT_CHAT_PARTICIPANT);
    }

    // Check if target participant exists
    const targetParticipant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, participantId),
        isNull(chatParticipants.leftAt),
      ),
    });

    if (!targetParticipant) {
      throw new NotFoundError('Participant not found in group');
    }

    // Only admins can remove others, or users can remove themselves
    if (participantId !== userId && userParticipant.role !== 'admin') {
      throw new ForbiddenError('Only admins can remove other participants');
    }

    // Cannot remove the only admin unless they're removing themselves and there's another admin
    if (targetParticipant.role === 'admin') {
      const adminParticipants = await db.query.chatParticipants.findMany({
        where: and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.role, 'admin'),
          isNull(chatParticipants.leftAt),
        ),
      });

      if (adminParticipants.length <= 1) {
        throw new ValidationError('Cannot remove the only admin from the group');
      }
    }

    // Soft delete by setting leftAt timestamp
    await db
      .update(chatParticipants)
      .set({ leftAt: new Date() })
      .where(and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, participantId),
      ));

    // Update chat updated_at timestamp
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, chatId));

    return { removed: true };
  }

  async transferAdmin(chatId: string, userId: string, newAdminId: string) {
    // Verify chat exists and is a group
    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
    });

    if (!chat) {
      throw new NotFoundError(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    if (!chat.isGroupChat) {
      throw new ValidationError('Cannot transfer admin in direct chat');
    }

    // Verify user is current admin
    const userParticipant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId),
        isNull(chatParticipants.leftAt),
      ),
    });

    if (!userParticipant || userParticipant.role !== 'admin') {
      throw new ForbiddenError('Only current admin can transfer admin role');
    }

    // Verify new admin is a participant
    const newAdminParticipant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, newAdminId),
        isNull(chatParticipants.leftAt),
      ),
    });

    if (!newAdminParticipant) {
      throw new NotFoundError('New admin must be a participant in the group');
    }

    // Transfer admin role in transaction
    await db.transaction(async (tx) => {
      // Remove admin role from current admin
      await tx
        .update(chatParticipants)
        .set({ role: 'member' })
        .where(and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, userId),
        ));

      // Add admin role to new admin
      await tx
        .update(chatParticipants)
        .set({ role: 'admin' })
        .where(and(
          eq(chatParticipants.chatId, chatId),
          eq(chatParticipants.userId, newAdminId),
        ));

      // Update chat admin reference
      await tx
        .update(chats)
        .set({
          groupAdmin: newAdminId,
          updatedAt: new Date(),
        })
        .where(eq(chats.id, chatId));
    });

    return { transferred: true, newAdminId };
  }

  async archiveGroup(chatId: string, userId: string) {
    // Verify chat exists and is a group
    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
    });

    if (!chat) {
      throw new NotFoundError(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    if (!chat.isGroupChat) {
      throw new ValidationError('Cannot archive direct chat');
    }

    // Verify user is participant
    const participant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId),
        isNull(chatParticipants.leftAt),
      ),
    });

    if (!participant) {
      throw new ForbiddenError(ERROR_MESSAGES.NOT_CHAT_PARTICIPANT);
    }

    // Archive the chat for this user (soft delete their participation)
    await db
      .update(chatParticipants)
      .set({
        leftAt: new Date(),
        isActive: false,
      })
      .where(and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId),
      ));

    return { archived: true };
  }

  async deleteGroup(chatId: string, userId: string, hardDelete: boolean = false) {
    // Verify chat exists and is a group
    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
    });

    if (!chat) {
      throw new NotFoundError(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    if (!chat.isGroupChat) {
      throw new ValidationError('Cannot delete direct chat');
    }

    // Verify user is admin
    const participant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId),
        isNull(chatParticipants.leftAt),
      ),
    });

    if (!participant || participant.role !== 'admin') {
      throw new ForbiddenError('Only admins can delete the group');
    }

    if (hardDelete) {
      // Hard delete: remove chat and all related data
      await db.delete(chats).where(eq(chats.id, chatId));
      // Related data (participants, messages) will be cascade deleted due to foreign key constraints
    } else {
      // Soft delete: archive all participants
      await db
        .update(chatParticipants)
        .set({
          leftAt: new Date(),
          isActive: false,
        })
        .where(eq(chatParticipants.chatId, chatId));
    }

    return { deleted: true, hardDelete };
  }
}