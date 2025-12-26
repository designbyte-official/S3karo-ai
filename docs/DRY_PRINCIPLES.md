# DRY (Don't Repeat Yourself) Principles

This document outlines the DRY principles applied in S3-Karo to ensure code maintainability and consistency.

## Centralized Utilities

### Core Utilities (`lib/utils/`)
- **`index.ts`**: Core utilities like `cn()` for class merging
- **`errors.ts`**: Centralized error handling (`AppError`, `handleError`)
- **`api-response.ts`**: Standardized API responses (`createErrorResponse`, `createSuccessResponse`, `apiErrors`)
- **`logger.ts`**: Structured logging (`logger.info`, `logger.error`, `logger.warn`)
- **`url.ts`**: URL construction utilities (`normalizeBaseUrl`, `encodeFileKey`, `constructFileUrl`)

### Shared Utilities (`features/shared/utils/`)
- **`index.ts`**: Feature-specific utilities (file types, formatting, icons)
- Used by both frontend and backend

## API Response Standards

All API routes use standardized response utilities:

```typescript
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';

// Error responses
return apiErrors.unauthorized('Authentication required');
return apiErrors.badRequest('Invalid file name');
return apiErrors.internalServerError('Error message', errorDetails);

// Success responses
return createSuccessResponse(data, 200, 'Optional message');
```

## Logging Standards

Replace all `console.log/error/warn` with structured logging:

```typescript
import { logger } from '@/lib/utils/logger';

logger.info('Operation successful', { context });
logger.error('Operation failed', error, { context });
logger.warn('Warning message', { context });
```

## URL Construction

All URL construction uses centralized utilities:

```typescript
import { normalizeBaseUrl, encodeFileKey, constructFileUrl } from '@/lib/utils/url';

const baseUrl = normalizeBaseUrl(config.cdnUrl);
const encodedKey = encodeFileKey(fileKey);
const finalUrl = constructFileUrl(baseUrl, fileKey);
```

## Error Handling

All errors use centralized error classes:

```typescript
import { AppError } from '@/lib/utils/errors';

throw new AppError('Error message', 400, 'ERROR_CODE');
```

## File Type Detection

Use shared utility for consistent file type detection:

```typescript
import { getFileType } from '@/features/shared/utils';

const { type, extension } = getFileType(fileName);
```

## Validation

Use centralized validation utilities:

```typescript
import { validateFileName, validateFileSize } from '@/features/private-s3/utils/validation';

validateFileName(fileName);
validateFileSize(fileSize);
```

## Benefits

1. **Consistency**: All API responses follow the same format
2. **Maintainability**: Changes to error handling/logging happen in one place
3. **Type Safety**: Centralized utilities ensure type consistency
4. **Testing**: Easier to test and mock centralized utilities
5. **Documentation**: Clear patterns for new developers

