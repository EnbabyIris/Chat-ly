import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.object({
    chatId: z.string()
      .uuid('Invalid chat ID format'),
    content: z.string()
      .min(1, 'Message cannot be empty')
      .max(5000, 'Message must be less than 5000 characters')
      .trim(),
    messageType: z.enum(['text', 'image', 'file', 'location', 'system'])
      .optional()
      .default('text'),
    attachmentUrl: z.string()
      .url('Attachment URL must be valid')
      .optional()
      .nullable(),
    attachmentName: z.string()
      .max(255, 'Attachment name must be less than 255 characters')
      .optional()
      .nullable(),
    attachmentSize: z.string()
      .max(50, 'Attachment size must be less than 50 characters')
      .optional()
      .nullable(),
    replyToId: z.string()
      .uuid('Invalid reply message ID format')
      .optional()
      .nullable(),
    latitude: z.number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90')
      .optional(),
    longitude: z.number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180')
      .optional(),
    locationAddress: z.string()
      .max(500, 'Location address must be less than 500 characters')
      .optional()
      .nullable(),
  }).refine((data) => {
    // If messageType is image or file, attachmentUrl is required
    if ((data.messageType === 'image' || data.messageType === 'file') && !data.attachmentUrl) {
      return false;
    }
    // If messageType is location, latitude and longitude are required
    if (data.messageType === 'location') {
      if (!data.latitude || !data.longitude) {
        return false;
      }
    }
    return true;
  }, {
    message: 'Attachment URL is required for image and file messages, latitude and longitude are required for location messages',
    path: ['attachmentUrl'],
  }),
});

export const updateMessageSchema = z.object({
  body: z.object({
    content: z.string()
      .min(1, 'Message cannot be empty')
      .max(5000, 'Message must be less than 5000 characters')
      .trim(),
  }),
});

export const messageIdParamSchema = z.object({
  params: z.object({
    messageId: z.string()
      .uuid('Invalid message ID format'),
  }),
});

export const markMessageReadSchema = z.object({
  params: z.object({
    messageId: z.string()
      .uuid('Invalid message ID format'),
  }),
});

export const typingIndicatorSchema = z.object({
  chatId: z.string()
    .uuid('Invalid chat ID format'),
  userId: z.string()
    .uuid('Invalid user ID format'),
  isTyping: z.boolean(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>['body'];
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>['body'];
export type MessageIdParam = z.infer<typeof messageIdParamSchema>['params'];
export type TypingIndicatorInput = z.infer<typeof typingIndicatorSchema>;