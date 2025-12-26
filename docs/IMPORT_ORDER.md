# Import Order Standards

This document outlines the import ordering standards for S3-Karo to ensure consistency across the codebase.

## Import Order Rules

Imports should be ordered in the following groups, with blank lines between groups:

1. **External packages** (React, Next.js, AWS SDK, etc.)
2. **Internal utilities** (`@/lib/...`)
3. **Feature modules** (`@/features/...`)
4. **Components** (`@/components/...`)
5. **Types** (`@/types/...`)

Within each group, imports should be alphabetically sorted.

## Example

```typescript
import { NextRequest, NextResponse } from 'next/server';

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { getCurrentUser } from '@/lib/auth/utils';
import { isDatabaseConfigured } from '@/lib/database/db';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

import { createPlatformS3Client, getPlatformS3Bucket } from '@/features/managed-storage/services/platform-s3.service';
import { generateStorageKey } from '@/features/managed-storage/utils/storage-key';
import { validateFileName, validateFileSize } from '@/features/private-s3/utils/validation';
```

## ESLint Configuration

The project uses `eslint-plugin-import` to enforce import ordering automatically. Run:

```bash
pnpm lint --fix
```

This will automatically fix import order issues.

## Benefits

1. **Consistency**: All files follow the same import structure
2. **Readability**: Easy to find and understand dependencies
3. **Maintainability**: Clear separation between external and internal imports
4. **Automation**: ESLint can auto-fix import order issues

