import { NextRequest, NextResponse } from 'next/server';

import { PutObjectCommand } from "@aws-sdk/client-s3";

import { getCurrentUser } from '@/lib/auth/utils';
import { isDatabaseConfigured } from '@/lib/database/db';
import { getFilesForUser, createFile } from '@/lib/database/queries';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

import { getFileType } from '@/features/shared/utils';
import { createPlatformS3Client, getPlatformS3Bucket, getFileUrl } from '@/features/managed-storage/services/platform-s3.service';
import { generateStorageKey } from '@/features/managed-storage/utils/storage-key';
import { validateFileName } from '@/features/private-s3/utils/validation';

// GET - List files
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const types = searchParams.get('types')?.split(',') || [];
    const searchText = searchParams.get('searchText') || '';
    const sort = searchParams.get('sort') || '$createdAt-desc';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Platform S3 requires database
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured. Platform S3 requires database connection.' },
        { status: 503 }
      );
    }

    // Get files using Drizzle (database is configured)
    const files = await getFilesForUser(user.id, {
      types: types.length > 0 ? types : undefined,
      searchText: searchText || undefined,
      sort: sort || undefined,
      limit: limit || undefined,
    });

    // Transform to match existing format
    const transformedFiles = files.map(file => ({
      $id: file.id,
      id: file.id,
      name: file.name,
      type: file.type,
      extension: file.extension,
      size: Number(file.size),
      url: file.url,
      owner: {
        $id: user.id,
        fullName: user.fullName,
      },
      accountId: user.id,
      users: (file.sharedWith as string[]) || [],
      bucketFileId: file.storageKey,
      $createdAt: file.createdAt.toISOString(),
      $updatedAt: file.updatedAt.toISOString(),
    }));

    return createSuccessResponse({
      documents: transformedFiles,
      total: transformedFiles.length,
    });
  } catch (error: any) {
    logger.error('Get files error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

// POST - Upload file
// NOTE: This endpoint buffers files through the server (inefficient)
// Use /api/upload + /api/upload/callback for direct S3 uploads instead
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return apiErrors.unauthorized();
    }

    // Platform S3 requires database
    if (!isDatabaseConfigured()) {
      return apiErrors.serviceUnavailable('Database not configured. Platform S3 requires database connection.');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ownerId = formData.get('ownerId') as string;
    const accountId = formData.get('accountId') as string;
    const path = formData.get('path') as string;

    if (!file) {
      return apiErrors.badRequest('No file provided');
    }

    // Validate file name
    try {
      validateFileName(file.name);
    } catch (error: any) {
      return apiErrors.badRequest(error.message);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const client = createPlatformS3Client();
    const bucket = getPlatformS3Bucket();

    // Generate storage key using utility
    const storageKey = generateStorageKey(user.id, file.name, path);

    try {
      logger.info('Attempting S3 upload', { bucket, key: storageKey });
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: file.type,
      }));
      logger.info('S3 upload successful', { bucket, key: storageKey });
    } catch (s3Error: any) {
      logger.error('S3 Upload Error', s3Error, {
        code: s3Error.code,
        requestId: s3Error.$metadata?.requestId,
        bucket,
        region: process.env.AWS_REGION
      });
      return apiErrors.internalServerError('Failed to upload to storage', s3Error.message);
    }

    const url = getFileUrl(storageKey);
    const { type, extension } = getFileType(file.name);

    // Create file record in database (Managed Storage only)
    // storageKey is REQUIRED - we need it to delete/access the file from S3
    // bucketName is NOT stored - always use getPlatformS3Bucket() from env
    const dbFile = await createFile({
      userId: user.id,
      name: file.name,
      type: type,
      extension: extension,
      size: file.size,
      url: url,
      storageKey: storageKey, // S3 key: needed for deletion, signed URLs, etc.
    });

    // Transform to match existing format
    const transformedFile = {
      $id: dbFile.id,
      id: dbFile.id,
      name: dbFile.name,
      type: dbFile.type,
      extension: dbFile.extension,
      size: Number(dbFile.size),
      url: dbFile.url,
      owner: {
        $id: user.id,
        fullName: user.fullName,
      },
      accountId: user.id,
      users: (dbFile.sharedWith as string[]) || [],
      bucketFileId: dbFile.storageKey,
      $createdAt: dbFile.createdAt.toISOString(),
      $updatedAt: dbFile.updatedAt.toISOString(),
    };

    return createSuccessResponse(transformedFile);
  } catch (error: any) {
    logger.error('Upload file error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

