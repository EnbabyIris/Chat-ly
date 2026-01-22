# Message Validation Utilities

This directory contains utility functions for message validation in the Chat-Turbo application.

## Files

### `message-validator.ts`
Core message validation logic that implements comprehensive validation rules including:
- Content length validation
- Profanity and spam filtering
- Attachment validation
- Encoding checks
- Mention validation

### `validation-helpers.ts`
Helper functions for common validation tasks:
- String sanitization
- Content type detection
- Pattern matching utilities
- Error formatting

## Usage

```typescript
import { validateMessage } from './message-validator';
import { sanitizeContent } from './validation-helpers';

const message = {
  content: "Hello world!",
  attachments: [],
  metadata: {}
};

const result = validateMessage(message);
if (result.isValid) {
  const sanitized = sanitizeContent(message.content);
  // Process validated message
} else {
  // Handle validation errors
  console.log(result.errors);
}
```

## Validation Rules

### Content Validation
- Minimum length: 1 character
- Maximum length: Configurable (default 2000)
- Allowed content types: text/plain, text/markdown, application/json

### Security Validation
- Profanity filtering using configurable word lists
- XSS prevention through content sanitization
- SQL injection prevention through input validation

### Attachment Validation
- Maximum number of attachments: Configurable
- Maximum file size: Configurable per attachment
- Allowed file types: Images, documents, archives

### Performance Validation
- Rate limiting checks
- Spam pattern detection
- Duplicate content prevention

## Configuration

Validation rules can be configured per user tier and channel type:

```typescript
import { getValidationRulesForUser } from '../config/validation';

const rules = getValidationRulesForUser('premium');
// Use rules for validation
```

## Error Handling

Validation errors are categorized by severity:
- **Errors**: Block message delivery
- **Warnings**: Allow delivery but log for monitoring

Error codes:
- `CONTENT_TOO_LONG`: Message exceeds maximum length
- `CONTENT_TOO_SHORT`: Message below minimum length
- `INVALID_CONTENT_TYPE`: Unsupported content type
- `PROFANITY_DETECTED`: Forbidden words detected
- `ATTACHMENT_TOO_LARGE`: Attachment exceeds size limit
- `TOO_MANY_ATTACHMENTS`: Too many attachments
- `INVALID_ENCODING`: Unsupported text encoding

## Testing

Run validation tests:
```bash
npm test -- message-validator.test.ts
```

## Performance

Validation is optimized for:
- Low latency (< 10ms per message)
- High throughput (1000+ messages/second)
- Memory efficiency
- Concurrent processing