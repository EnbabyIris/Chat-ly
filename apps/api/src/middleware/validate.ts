import type { Request, Response, NextFunction } from 'express';
import type { AnyZodObject } from 'zod';
import { ZodError } from 'zod';
import { errorResponse } from '../utils/response';
import { HTTP_STATUS } from '@repo/shared/constants';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        errorResponse(
          res,
          'Validation failed',
          HTTP_STATUS.BAD_REQUEST,
          JSON.stringify(errorMessages),
        );
      } else {
        next(error);
      }
    }
  };
};