import { db, statuses } from '../db';
import { eq, and, desc, lt, gt } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '../utils/errors';
import type { CreateStatusDTO, StatusWithUser } from '@repo/shared/types';

export class StatusService {
  /**
   * Create a new status for a user
   */
  async createStatus(userId: string, data: CreateStatusDTO) {
    // Validate that at least one of content or imageUrl is provided
    if (!data.content && !data.imageUrl) {
      throw new ValidationError('Status must have either text content or an image');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    const [newStatus] = await db
      .insert(statuses)
      .values({
        userId,
        content: data.content || null,
        imageUrl: data.imageUrl || null,
        expiresAt,
      })
      .returning();

    return newStatus;
  }

  /**
   * Get all active statuses for a user (not expired)
   */
  async getUserStatuses(userId: string): Promise<StatusWithUser[]> {
    const now = new Date();

    const userStatuses = await db.query.statuses.findMany({
      where: and(
        eq(statuses.userId, userId),
        gt(statuses.expiresAt, now) // expiresAt > now (not expired)
      ),
      orderBy: [desc(statuses.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return userStatuses;
  }

  /**
   * Get all active statuses from all users (for status feed)
   */
  async getAllStatuses(): Promise<StatusWithUser[]> {
    const now = new Date();

    const allStatuses = await db.query.statuses.findMany({
      where: gt(statuses.expiresAt, now), // expiresAt > now (not expired)
      orderBy: [desc(statuses.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return allStatuses;
  }

  /**
   * Delete a specific status
   */
  async deleteStatus(userId: string, statusId: string) {
    const [deletedStatus] = await db
      .delete(statuses)
      .where(and(
        eq(statuses.id, statusId),
        eq(statuses.userId, userId) // Ensure user can only delete their own statuses
      ))
      .returning();

    if (!deletedStatus) {
      throw new NotFoundError('Status not found or you do not have permission to delete it');
    }

    return deletedStatus;
  }

  /**
   * Clean up expired statuses (for background job)
   */
  async cleanupExpiredStatuses(): Promise<void> {
    const now = new Date();

    await db
      .delete(statuses)
      .where(lt(statuses.expiresAt, now)); // expiresAt < now (expired)
  }

  /**
   * Get a specific status by ID
   */
  async getStatusById(statusId: string) {
    const status = await db.query.statuses.findFirst({
      where: eq(statuses.id, statusId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!status) {
      throw new NotFoundError('Status not found');
    }

    // Check if status is expired
    if (new Date() > status.expiresAt) {
      throw new NotFoundError('Status has expired');
    }

    return status;
  }
}