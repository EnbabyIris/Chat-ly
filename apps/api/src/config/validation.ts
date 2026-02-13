/**
 * Message validation configuration
 */

import type {
  MessageValidationRules,
  ValidationConfig,
} from "../types/message";

export const DEFAULT_MESSAGE_VALIDATION_RULES: MessageValidationRules = {
  maxLength: 2000,
  minLength: 1,
  allowedContentTypes: ["text/plain", "text/markdown", "application/json"],
  forbiddenWords: [
    "spam",
    "advertisement",
    "scam",
    // Add more forbidden words as needed
  ],
  requireTimestamps: true,
  allowAttachments: true,
  maxAttachments: 5,
  maxAttachmentSize: 10 * 1024 * 1024, // 10MB
};

export const STRICT_MESSAGE_VALIDATION_RULES: MessageValidationRules = {
  ...DEFAULT_MESSAGE_VALIDATION_RULES,
  maxLength: 500,
  forbiddenWords: [
    ...DEFAULT_MESSAGE_VALIDATION_RULES.forbiddenWords,
    "inappropriate",
    "offensive",
    // Add more strict forbidden words
  ],
  maxAttachments: 2,
  maxAttachmentSize: 2 * 1024 * 1024, // 2MB
};

export const LOOSE_MESSAGE_VALIDATION_RULES: MessageValidationRules = {
  ...DEFAULT_MESSAGE_VALIDATION_RULES,
  maxLength: 5000,
  maxAttachments: 10,
  maxAttachmentSize: 50 * 1024 * 1024, // 50MB
};

export const VALIDATION_CONFIG: ValidationConfig = {
  rules: {
    length: true,
    content_type: true,
    profanity: true,
    spam: true,
    attachments: true,
    mentions: true,
    encoding: true,
  },
  severityLevels: {
    length: "error",
    content_type: "error",
    profanity: "error",
    spam: "warning",
    attachments: "error",
    mentions: "warning",
    encoding: "error",
  },
};

export function getValidationRulesForUser(
  userTier: string,
): MessageValidationRules {
  switch (userTier.toLowerCase()) {
    case "free":
      return STRICT_MESSAGE_VALIDATION_RULES;
    case "premium":
      return DEFAULT_MESSAGE_VALIDATION_RULES;
    case "enterprise":
      return LOOSE_MESSAGE_VALIDATION_RULES;
    default:
      return DEFAULT_MESSAGE_VALIDATION_RULES;
  }
}

export function getValidationRulesForChannel(
  channelType: string,
): MessageValidationRules {
  switch (channelType.toLowerCase()) {
    case "public":
      return STRICT_MESSAGE_VALIDATION_RULES;
    case "private":
      return DEFAULT_MESSAGE_VALIDATION_RULES;
    case "announcements":
      return LOOSE_MESSAGE_VALIDATION_RULES;
    default:
      return DEFAULT_MESSAGE_VALIDATION_RULES;
  }
}
