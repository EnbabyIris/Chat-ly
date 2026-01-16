import type { Response } from 'express';
import { UserService } from '../services/user.service';
import { successResponse } from '../utils/response';
import type { AuthRequest } from '../middleware/auth';
import { HTTP_STATUS } from '@repo/shared/constants';
import type { UserIdParam } from '@repo/shared/validations';
import type { UpdateProfileDTO } from '@repo/shared/types';
import type { OnlineUser } from '../socket/types';

const userService = new UserService();

export class UserController {
  /**
   * Get user profile by ID
   * GET /api/users/:userId
   */
  async getUserById(
    req: AuthRequest & { params: UserIdParam },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { userId } = req.params;

    const user = await userService.getUserById(userId);

    return successResponse(res, { user }, 'User profile retrieved successfully');
  }

  /**
   * Search users
   * GET /api/users/search?q=query&limit=20
   */
  async searchUsers(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { query, limit } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return successResponse(res, null, 'Search query is required', HTTP_STATUS.BAD_REQUEST);
    }

    const users = await userService.searchUsers(
      query.trim(),
      req.user.userId,
      limit ? parseInt(limit as string, 10) : undefined,
    );

    return successResponse(res, { users }, 'Users search completed successfully');
  }

  /**
   * Update current user profile
   * PUT /api/users/profile
   */
  async updateProfile(
    req: AuthRequest & { body: UpdateProfileDTO },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const updateData = req.body;

    const user = await userService.updateProfile(req.user.userId, updateData);

    return successResponse(res, { user }, 'Profile updated successfully');
  }

  /**
   * Get all users (for admin or development purposes)
   * GET /api/users
   */
  async getAllUsers(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const users = await userService.getAllUsers(req.user.userId);

    return successResponse(res, {
      users,
      total: users.length,
      page: 1,
      limit: users.length
    }, 'Users retrieved successfully');
  }

  /**
   * Get currently online users
   * GET /api/users/online
   */
  async getOnlineUsers(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    // Get presence handler from socket server
    // Import server instance dynamically to avoid circular dependencies
    const server = require('../server').default;
    const socketServer = server.getSocketServer();
    const presenceHandler = socketServer.getPresenceHandler();

    const onlineUsers = presenceHandler.getOnlineUsers();

    // Fetch complete user data for online users
    const userPromises = onlineUsers.map(async (onlineUser: OnlineUser) => {
      try {
        const userDetails = await userService.getUserById(onlineUser.userId);
        return {
          id: userDetails.id,
          name: userDetails.name,
          email: userDetails.email,
          avatar: userDetails.avatar,
          isOnline: true,
          lastSeen: null, // Online users don't have lastSeen
        };
      } catch (error) {
        console.error(`Failed to fetch user ${onlineUser.userId}:`, error);
        return null;
      }
    });

    const users = (await Promise.all(userPromises)).filter(user => user !== null);

    return successResponse(res, {
      users,
      total: users.length
    }, 'Online users retrieved successfully');
  }
}