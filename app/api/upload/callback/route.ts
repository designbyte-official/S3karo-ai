import { NextRequest } from 'next/server';

import { getCurrentUser } from '@/lib/auth/utils';
import { isDatabaseConfigured } from '@/lib/database/db';
import { createFile } from '@/lib/database/queries';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

import { getFileType } from '@/features/shared/utils';
import { getFileUrl } from '@/features/managed-storage/services/platform-s3.service';
import { validateStorageKeyOwnership } from '@/features/managed-storage/utils/storage-key';

/**
 * POST /api/upload/callback
 * Callback endpoint called after successful S3 upload
 * Saves file metadata to database
 * 
 * Body: {
 *   key: string, // S3 key from presigned URL response
 *   fileName: string,
 *   fileType: string,
 *   fileSize: number,
 *   path?: string
 * }
 * 
 * Response: {
 *   id: string,
 *   name: string,
 *   url: string,
 *   size: number,
 *   type: string,
 *   createdAt: string
 * }
 */
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

    // Verify the key belongs to this user
    if (!validateStorageKeyOwnership(key, user.id)) {
      return apiErrors.forbidden('Invalid storage key');
    }

    // Generate file URL using CDN
    const url = getFileUrl(key);
    const { type, extension } = getFileType(fileName);

    // Save to database
    const dbFile = await createFile({
      userId: user.id,
      name: fileName,
      type: type,
      extension: extension,
      size: fileSize,
      url: url,
      storageKey: key,
    });

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

