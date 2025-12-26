import { NextRequest } from 'next/server';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from "@aws-sdk/client-s3";

import { getCurrentUser } from '@/lib/auth/utils';
import { isDatabaseConfigured } from '@/lib/database/db';
import { hasPlatformAccess } from '@/lib/database/queries-subscriptions';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

import { createPlatformS3Client, getPlatformS3Bucket } from '@/features/managed-storage/services/platform-s3.service';
import { generateStorageKey } from '@/features/managed-storage/utils/storage-key';
import { validateFileName, validateFileSize } from '@/features/private-s3/utils/validation';

/**
 * S3-Karo File Upload API
 * 
 * Architecture (inspired by industry best practices):
 * 1. Client requests presigned URL from server
 * 2. Client uploads directly to S3 using presigned URL
 * 3. Client calls callback endpoint to save metadata
 * 
 * This reduces server load and improves performance.
 */

// File route configuration
export interface FileRouteConfig {
  maxFileSize?: number; // in bytes
  allowedFileTypes?: string[]; // MIME types
  maxFileCount?: number;
}

const DEFAULT_FILE_ROUTE: FileRouteConfig = {
  maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
  allowedFileTypes: ['*'], // Allow all types
  maxFileCount: 10,
};

/**
 * POST /api/upload
 * Request presigned URL for direct S3 upload
 * 
 * Body: {
 *   fileName: string,
 *   fileType: string,
 *   fileSize: number,
 *   path?: string,
 *   route?: FileRouteConfig
 * }
 * 
 * Response: {
 *   url: string, // Presigned URL for upload
 *   key: string, // S3 key
 *   expiresIn: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiErrors.unauthorized('Authentication required');
    }

    // Check Pro subscription for managed storage
    const hasAccess = await hasPlatformAccess(user.id);
    if (!hasAccess) {
      return apiErrors.forbidden('Managed storage requires an active Pro subscription');
    }

    if (!isDatabaseConfigured()) {
      return apiErrors.serviceUnavailable('Database not configured');
    }

    const body = await request.json();
    const { fileName, fileType, fileSize, path: rawPath, route = DEFAULT_FILE_ROUTE } = body;

    // Normalize path - remove leading/trailing slashes
    const cleanPath = rawPath ? rawPath.trim().replace(/^\/+|\/+$/g, '') : undefined;

    if (!fileName || !fileType || !fileSize) {
      return apiErrors.badRequest('fileName, fileType, and fileSize are required');
    }

    // Validate file name
    try {
      validateFileName(fileName);
    } catch (error: any) {
      return apiErrors.badRequest(error.message);
    }

    // Validate file size
    try {
      validateFileSize(fileSize);
    } catch (error: any) {
      return apiErrors.badRequest(error.message);
    }

    // Check against route-specific max size
    const maxSize = route.maxFileSize || DEFAULT_FILE_ROUTE.maxFileSize!;
    if (fileSize > maxSize) {
      return apiErrors.badRequest(`File size exceeds maximum of ${maxSize / 1024 / 1024}MB`);
    }

    // Validate file type (if specified)
    if (route.allowedFileTypes && !route.allowedFileTypes.includes('*')) {
      if (!route.allowedFileTypes.includes(fileType)) {
        return apiErrors.badRequest(`File type ${fileType} is not allowed`);
      }
    }

    // Generate storage key using utility
    const storageKey = generateStorageKey(user.id, fileName, cleanPath);

    // Create presigned URL for direct S3 upload
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

    // Presigned URL expires in 1 hour
    const expiresIn = 3600;
    const presignedUrl = await getSignedUrl(client, command, { expiresIn });

    return createSuccessResponse({
      url: presignedUrl,
      key: storageKey,
      expiresIn: expiresIn,
      // Return metadata for client to use in callback
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

