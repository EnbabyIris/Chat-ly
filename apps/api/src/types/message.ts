/**
 * Message validation types and interfaces
 */

export interface MessageValidationRules {
  maxLength: number;
  minLength: number;
  allowedContentTypes: string[];
  forbiddenWords: string[];
  requireTimestamps: boolean;
  allowAttachments: boolean;
  maxAttachments: number;
  maxAttachmentSize: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: any;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  value?: any;
}

export interface MessageContent {
  text: string;
  attachments?: Attachment[];
  metadata?: MessageMetadata;
}

export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface MessageMetadata {
  replyTo?: string;
  mentions?: string[];
  tags?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: Date;
}

export interface SanitizedMessage {
  content: MessageContent;
  validationResult: ValidationResult;
  sanitizedAt: Date;
  originalLength: number;
  sanitizedLength: number;
}

export type ValidationRuleName =
  | 'length'
  | 'content_type'
  | 'profanity'
  | 'spam'
  | 'attachments'
  | 'mentions'
  | 'encoding';

export interface ValidationConfig {
  rules: Partial<Record<ValidationRuleName, boolean>>;
  customRules?: ValidationRule[];
  severityLevels: Record<string, 'error' | 'warning'>;
}

export interface ValidationRule {
  name: string;
  pattern?: RegExp;
  validator: (content: MessageContent) => ValidationResult;
  severity: 'error' | 'warning';
}