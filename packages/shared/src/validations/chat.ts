import { z } from 'zod';

// ================================
// GROUP CHAT CREATION & MANAGEMENT
// ================================

export const createGroupChatSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Group name is required')
      .max(255, 'Group name must be less than 255 characters')
      .trim(),
    description: z.string()
      .max(1000, 'Description must be less than 1000 characters')
      .trim()
      .optional()
      .nullable(),
    avatar: z.string()
      .url('Avatar must be a valid URL')
      .optional()
      .nullable(),
    participantIds: z.array(z.string().uuid('Invalid participant ID'))
      .min(1, 'At least one participant is required') // Creator + participants
      .max(99, 'Maximum 99 additional participants allowed'), // Total 100 including creator
  }),
});

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

// ================================
// PARTICIPANT MANAGEMENT
// ================================

export const addParticipantsSchema = z.object({
  params: z.object({
    chatId: z.string().uuid('Invalid chat ID format'),
  }),
  body: z.object({
    participantIds: z.array(z.string().uuid('Invalid participant ID'))
      .min(1, 'At least one participant is required')
      .max(50, 'Cannot add more than 50 participants at once'),
  }),
});

export const removeParticipantSchema = z.object({
  params: z.object({
    chatId: z.string().uuid('Invalid chat ID format'),
    participantId: z.string().uuid('Invalid participant ID format'),
  }),
});

export const transferAdminSchema = z.object({
  params: z.object({
    chatId: z.string().uuid('Invalid chat ID format'),
  }),
  body: z.object({
    newAdminId: z.string().uuid('Invalid user ID format'),
  }),
});

// ================================
// CHAT ARCHIVING & DELETION
// ================================

export const archiveChatSchema = z.object({
  params: z.object({
    chatId: z.string().uuid('Invalid chat ID format'),
  }),
  body: z.object({
    reason: z.string()
      .max(500, 'Reason must be less than 500 characters')
      .trim()
      .optional(),
  }),
});

export const deleteChatSchema = z.object({
  params: z.object({
    chatId: z.string().uuid('Invalid chat ID format'),
  }),
  body: z.object({
    reason: z.string()
      .max(500, 'Reason must be less than 500 characters')
      .trim()
      .optional(),
    hardDelete: z.boolean()
      .optional()
      .default(false),
  }),
});

// ================================
// EXISTING SCHEMAS (ENHANCED)
// ================================

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

// ================================
// TYPE EXPORTS
// ================================

export type CreateGroupChatInput = z.infer<typeof createGroupChatSchema>['body'];
export type CreateChatInput = z.infer<typeof createChatSchema>['body'];
export type UpdateChatInput = z.infer<typeof updateChatSchema>['body'];
export type AddParticipantsInput = z.infer<typeof addParticipantsSchema>;
export type RemoveParticipantInput = z.infer<typeof removeParticipantSchema>;
export type TransferAdminInput = z.infer<typeof transferAdminSchema>;
export type ArchiveChatInput = z.infer<typeof archiveChatSchema>;
export type DeleteChatInput = z.infer<typeof deleteChatSchema>;
export type ChatIdParam = z.infer<typeof chatIdParamSchema>['params'];
export type GetChatMessagesInput = z.infer<typeof getChatMessagesSchema>;