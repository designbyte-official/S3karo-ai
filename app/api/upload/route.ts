import { NextRequest } from 'next/server';

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { createPlatformS3Client, getPlatformS3Bucket } from '@/features/managed-storage/services/platform-s3.service';
import { generateStorageKey } from '@/features/managed-storage/utils/storage-key';
import { validateFileName, validateFileSize } from '@/features/private-s3/utils/validation';
import { getCurrentUser } from '@/lib/auth/utils';
import { isDatabaseConfigured } from '@/lib/database/db';
import { hasPlatformAccess } from '@/lib/database/queries-subscriptions';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';


export interface FileRouteConfig {
  maxFileSize?: number;
  allowedFileTypes?: string[];
  maxFileCount?: number;
}

const DEFAULT_FILE_ROUTE: FileRouteConfig = {
  maxFileSize: 5 * 1024 * 1024 * 1024,
  allowedFileTypes: ['*'],
  maxFileCount: 10,
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiErrors.unauthorized('Authentication required');
    }

    const hasAccess = await hasPlatformAccess(user.id);
    if (!hasAccess) {
      return apiErrors.forbidden('Managed storage requires an active Pro subscription');
    }

    if (!isDatabaseConfigured()) {
      return apiErrors.serviceUnavailable('Database not configured');
    }

    const body = await request.json();
    const { fileName, fileType, fileSize, path: rawPath, route = DEFAULT_FILE_ROUTE } = body;

    const cleanPath = rawPath ? rawPath.trim().replace(/^\/+|\/+$/g, '') : undefined;

    if (!fileName || !fileType || !fileSize) {
      return apiErrors.badRequest('fileName, fileType, and fileSize are required');
    }

    try {
      validateFileName(fileName);
      validateFileSize(fileSize);
    } catch (error: any) {
      return apiErrors.badRequest(error.message);
    }

    const maxSize = route.maxFileSize || DEFAULT_FILE_ROUTE.maxFileSize!;
    if (fileSize > maxSize) {
      return apiErrors.badRequest(`File size exceeds maximum of ${maxSize / 1024 / 1024}MB`);
    }

    if (route.allowedFileTypes && !route.allowedFileTypes.includes('*')) {
      if (!route.allowedFileTypes.includes(fileType)) {
        return apiErrors.badRequest(`File type ${fileType} is not allowed`);
      }
    }

    const storageKey = generateStorageKey(user.id, fileName, cleanPath);
    const client = createPlatformS3Client();
    const bucket = getPlatformS3Bucket();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: fileType,
      Metadata: {
        'uploaded-by': user.id,
        'original-name': fileName,
      },
    });

    const expiresIn = 3600;
    const presignedUrl = await getSignedUrl(client, command, { expiresIn });

    return createSuccessResponse({
      url: presignedUrl,
      key: storageKey,
      expiresIn,
      metadata: {
        fileName,
        fileType,
        fileSize,
        path: cleanPath,
      },
    });

  } catch (error: any) {
    logger.error('S3-Karo upload route error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

