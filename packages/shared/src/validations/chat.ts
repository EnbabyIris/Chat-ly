import { z } from 'zod';

export const createChatSchema = z.object({
  body: z.object({
    participantIds: z.array(z.string().uuid('Invalid participant ID'))
      .min(1, 'At least one participant is required')
      .max(100, 'Maximum 100 participants allowed'),
    isGroupChat: z.boolean()
      .optional()
      .default(false),
    name: z.string()
      .min(1, 'Chat name cannot be empty')
      .max(255, 'Chat name must be less than 255 characters')
      .trim()
      .optional(),
    avatar: z.string()
      .url('Avatar must be a valid URL')
      .optional()
      .nullable(),
    description: z.string()
      .max(1000, 'Description must be less than 1000 characters')
      .trim()
      .optional()
      .nullable(),
  }).refine((data) => {
    // Group chats must have a name
    if (data.isGroupChat && !data.name) {
      return false;
    }
    return true;
  }, {
    message: 'Group chats must have a name',
    path: ['name'],
  }),
});

export const updateChatSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Chat name cannot be empty')
      .max(255, 'Chat name must be less than 255 characters')
      .trim()
      .optional(),
    avatar: z.string()
      .url('Avatar must be a valid URL')
      .optional()
      .nullable(),
    description: z.string()
      .max(1000, 'Description must be less than 1000 characters')
      .trim()
      .optional()
      .nullable(),
  }),
});

export const chatIdParamSchema = z.object({
  params: z.object({
    chatId: z.string()
      .uuid('Invalid chat ID format'),
  }),
});

export const getChatMessagesSchema = z.object({
  params: z.object({
    chatId: z.string()
      .uuid('Invalid chat ID format'),
  }),
  query: z.object({
    limit: z.coerce.number()
      .int()
      .positive()
      .max(100, 'Limit cannot exceed 100')
      .optional()
      .default(50),
    before: z.string()
      .uuid('Invalid cursor format')
      .optional(), // cursor-based pagination
  }),
});

export type CreateChatInput = z.infer<typeof createChatSchema>['body'];
export type UpdateChatInput = z.infer<typeof updateChatSchema>['body'];
export type ChatIdParam = z.infer<typeof chatIdParamSchema>['params'];
export type GetChatMessagesInput = z.infer<typeof getChatMessagesSchema>;