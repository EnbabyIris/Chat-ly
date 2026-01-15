import { db, users } from '../db';
import { eq, ilike, or, ne, and } from 'drizzle-orm';
import { NotFoundError } from '../utils/errors';
import { ERROR_MESSAGES } from '@repo/shared/constants';
import type { UpdateProfileDTO, UserListItem } from '@repo/shared/types';

export class UserService {
  async getUserById(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        password: false,
      },
    });

    if (!user) {
      throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async searchUsers(query: string, currentUserId: string, limit = 20): Promise<UserListItem[]> {
    const results = await db.query.users.findMany({
      where: and(
        or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`)),
        ne(users.id, currentUserId),
      ),
      columns: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
      },
      limit,
    });

    return results;
  }

  async updateProfile(userId: string, data: UpdateProfileDTO) {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        bio: users.bio,
        isOnline: users.isOnline,
        lastSeen: users.lastSeen,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return updatedUser;
  }

  async updateUserStatus(userId: string, isOnline: boolean) {
    await db
      .update(users)
      .set({
        isOnline,
        lastSeen: isOnline ? null : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getAllUsers(excludeUserId?: string): Promise<UserListItem[]> {
    const results = await db.query.users.findMany({
      where: excludeUserId ? ne(users.id, excludeUserId) : undefined,
      columns: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    return results;
  }
}