import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse } from '../utils/response';
import { HTTP_STATUS } from '@repo/shared/constants';
import type { RegisterDTO, LoginDTO } from '@repo/shared/types';
import type { AuthRequest } from '../middleware/auth';

const authService = new AuthService();

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request<{}, any, RegisterDTO>, res: Response): Promise<Response> {
    const userData = req.body;

    const result = await authService.register(userData);

    return successResponse(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      'User registered successfully',
      HTTP_STATUS.CREATED,
    );
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request<{}, any, LoginDTO>, res: Response): Promise<Response> {
    const credentials = req.body;

    const result = await authService.login(credentials);

    return successResponse(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      'Login successful',
    );
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refreshToken(req: Request, res: Response): Promise<Response> {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return successResponse(res, null, 'Refresh token is required', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await authService.refreshAccessToken(refreshToken);

    return successResponse(
      res,
      { accessToken: result.accessToken },
      'Token refreshed successfully',
    );
  }

  /**
   * Logout user (invalidate refresh token)
   * POST /api/auth/logout
   */
  async logout(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logout(req.user.userId, refreshToken);
    }

    return successResponse(res, null, 'Logout successful');
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getCurrentUser(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await authService.getCurrentUser(req.user.userId);

    return successResponse(res, { user }, 'User profile retrieved successfully');
  }
}