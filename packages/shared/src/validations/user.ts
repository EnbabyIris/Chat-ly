import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters')
      .trim()
      .optional(),
    bio: z.string()
      .max(500, 'Bio must be less than 500 characters')
      .trim()
      .nullable()
      .optional(),
    avatar: z.string()
      .url('Avatar must be a valid URL')
      .nullable()
      .optional(),
  }),
});

export const searchUsersSchema = z.object({
  query: z.object({
    query: z.string()
      .min(1, 'Search query is required')
      .max(100, 'Search query must be less than 100 characters')
      .trim(),
    limit: z.coerce.number()
      .int()
      .positive()
      .max(50, 'Limit cannot exceed 50')
      .optional()
      .default(20),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    userId: z.string()
      .uuid('Invalid user ID format'),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type SearchUsersInput = z.infer<typeof searchUsersSchema>['query'];
export type UserIdParam = z.infer<typeof userIdParamSchema>['params'];