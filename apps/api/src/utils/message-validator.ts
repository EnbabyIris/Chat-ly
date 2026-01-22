/**
 * Message Validation Utility
 * Validates message content, metadata, and permissions
 */

export interface MessageValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateMessageContent = (content: string): MessageValidationResult => {
  const errors: string[] = [];
  
  if (!content || content.trim().length === 0) {
    errors.push('Message content cannot be empty');
  }
  
  if (content.length > 2000) {
    errors.push('Message content exceeds maximum length of 2000 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateMessageMetadata = (metadata: any): MessageValidationResult => {
  const errors: string[] = [];
  
  if (!metadata.senderId) {
    errors.push('Sender ID is required');
  }
  
  if (!metadata.chatId) {
    errors.push('Chat ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
