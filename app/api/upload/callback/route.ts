import { NextRequest } from 'next/server';

import { getCurrentUser } from '@/lib/auth/utils';
import { isDatabaseConfigured } from '@/lib/database/db';
import { createFile } from '@/lib/database/queries';
import { incrementStorageUsage, checkStorageLimit } from '@/lib/database/queries-subscriptions';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { deleteCache } from '@/lib/redis/cache';

import { getFileType } from '@/features/shared/utils';
import { getFileUrl } from '@/features/managed-storage/services/platform-s3.service';
import { validateStorageKeyOwnership } from '@/features/managed-storage/utils/storage-key';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiErrors.unauthorized('Authentication required');
    }

    if (!isDatabaseConfigured()) {
      return apiErrors.serviceUnavailable('Database not configured');
    }

    const body = await request.json();
    const { key, fileName, fileType, fileSize, path } = body;

    if (!key || !fileName || !fileType || !fileSize) {
      return apiErrors.badRequest('key, fileName, fileType, and fileSize are required');
    }

    if (!validateStorageKeyOwnership(key, user.id)) {
      return apiErrors.forbidden('Invalid storage key');
    }

    const storageCheck = await checkStorageLimit(user.id, fileSize);
    if (!storageCheck.allowed) {
      return apiErrors.badRequest(
        `Storage limit exceeded. Available: ${(storageCheck.remaining / 1024 / 1024).toFixed(2)}MB, Required: ${(fileSize / 1024 / 1024).toFixed(2)}MB`
      );
    }

    const url = getFileUrl(key);
    const { type, extension } = getFileType(fileName);

    const dbFile = await createFile({
      userId: user.id,
      name: fileName,
      type: type,
      extension: extension,
      size: fileSize,
      url: url,
      storageKey: key,
    });

    await incrementStorageUsage(user.id, fileSize);

    await deleteCache(`storage-stats:${user.id}`);

    return createSuccessResponse({
      id: dbFile.id,
      name: dbFile.name,
      url: dbFile.url,
      size: Number(dbFile.size),
      type: dbFile.type,
      extension: dbFile.extension,
      createdAt: dbFile.createdAt.toISOString(),
    }, 201);

  } catch (error: any) {
    logger.error('S3-Karo callback error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

