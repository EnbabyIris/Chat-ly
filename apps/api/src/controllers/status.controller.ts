import type { Response } from 'express';
import { StatusService } from '../services/status.service';
import { successResponse } from '../utils/response';
import type { AuthRequest } from '../middleware/auth';
import { HTTP_STATUS } from '@repo/shared/constants';
import type { CreateStatusInput, StatusIdParam } from '@repo/shared/validations';

const statusService = new StatusService();

export class StatusController {
  /**
   * Create a new status
   * POST /api/statuses
   */
  async createStatus(
    req: AuthRequest & { body: CreateStatusInput },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const statusData = req.body;
    const status = await statusService.createStatus(req.user.userId, statusData);

    return successResponse(res, { status }, 'Status created successfully', HTTP_STATUS.CREATED);
  }

  /**
   * Get current user's active statuses
   * GET /api/statuses/my
   */
  async getMyStatuses(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const statuses = await statusService.getUserStatuses(req.user.userId);

    return successResponse(res, {
      statuses,
      total: statuses.length
    }, 'User statuses retrieved successfully');
  }

  /**
   * Get all active statuses from all users (or specific user if userId provided)
   * GET /api/statuses
   */
  async getAllStatuses(req: AuthRequest, res: Response): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { userId } = req.query;

    let statuses;
    if (userId && typeof userId === 'string') {
      // Get statuses for specific user
      statuses = await statusService.getUserStatuses(userId);
    } else {
      // Get all statuses from all users
      statuses = await statusService.getAllStatuses();
    }

    return successResponse(res, {
      statuses,
      total: statuses.length
    }, 'Statuses retrieved successfully');
  }

  /**
   * Get a specific status by ID
   * GET /api/statuses/:statusId
   */
  async getStatusById(
    req: AuthRequest & { params: StatusIdParam },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { statusId } = req.params;
    const status = await statusService.getStatusById(statusId);

    return successResponse(res, { status }, 'Status retrieved successfully');
  }

  /**
   * Delete a status
   * DELETE /api/statuses/:statusId
   */
  async deleteStatus(
    req: AuthRequest & { params: StatusIdParam },
    res: Response,
  ): Promise<Response> {
    if (!req.user) {
      return successResponse(res, null, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const { statusId } = req.params;
    await statusService.deleteStatus(req.user.userId, statusId);

    return successResponse(res, null, 'Status deleted successfully');
  }
}