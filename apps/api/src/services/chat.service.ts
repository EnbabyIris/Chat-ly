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
    return this.getChatById(newChat.id, userId);
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
      participants: uc.chat.participants.map((p) => p.user),
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
}