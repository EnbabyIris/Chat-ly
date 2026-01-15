# Shared Package

This package contains shared TypeScript types, Zod validation schemas, and constants that are used across both the frontend (web) and backend (api) applications.

## Structure

- `types/` - Shared TypeScript interfaces and types
- `validations/` - Zod validation schemas
- `constants/` - Shared constants and enums

## Usage

```typescript
// In frontend or backend
import { User, CreateChatSchema } from '@shared/types'
```