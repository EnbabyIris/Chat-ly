import type { Response } from 'express';
import { UserService } from '../services/user.service';
import { successResponse } from '../utils/response';
import type { AuthRequest } from '../middleware/auth';
import { HTTP_STATUS } from '@repo/shared/constants';
import type { UserIdParam } from '@repo/shared/validations';
import type { UpdateProfileDTO } from '@repo/shared/types';

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

    const users = await userService.getAllUsers();

    return successResponse(res, { users }, 'Users retrieved successfully');
  }
}