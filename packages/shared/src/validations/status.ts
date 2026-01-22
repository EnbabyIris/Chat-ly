import { z } from 'zod';

export const createStatusSchema = z.object({
  body: z.object({
    content: z.string()
      .max(500, 'Status text must be less than 500 characters')
      .trim()
      .optional(),
    imageUrl: z.string()
      .url('Image URL must be a valid URL')
      .optional(),
  })
  .refine((data) => data.content || data.imageUrl, {
    message: 'Status must have either text content or an image',
    path: ['content'], // Point to content field for the error
  }),
});

export const statusIdParamSchema = z.object({
  params: z.object({
    statusId: z.string()
      .uuid('Invalid status ID format'),
  }),
});

export type CreateStatusInput = z.infer<typeof createStatusSchema>['body'];
export type StatusIdParam = z.infer<typeof statusIdParamSchema>['params'];