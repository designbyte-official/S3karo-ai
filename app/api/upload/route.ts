import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { isDatabaseConfigured } from '@/lib/database/db';
import { createPlatformS3Client, getPlatformS3Bucket } from '@/features/managed-storage/services/platform-s3.service';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { hasPlatformAccess } from '@/lib/database/queries-subscriptions';

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
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check Pro subscription for managed storage
    const hasAccess = await hasPlatformAccess(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Managed storage requires an active Pro subscription' },
        { status: 403 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Service unavailable', message: 'Database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { fileName, fileType, fileSize, path, route = DEFAULT_FILE_ROUTE } = body;

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: 'Bad request', message: 'fileName, fileType, and fileSize are required' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = route.maxFileSize || DEFAULT_FILE_ROUTE.maxFileSize!;
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File too large', message: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type (if specified)
    if (route.allowedFileTypes && !route.allowedFileTypes.includes('*')) {
      if (!route.allowedFileTypes.includes(fileType)) {
        return NextResponse.json(
          { error: 'File type not allowed', message: `File type ${fileType} is not allowed` },
          { status: 400 }
        );
      }
    }

    // Generate storage key
    const cleanPath = path ? (path.endsWith('/') ? path : `${path}/`) : '';
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `managed/${user.id}/${cleanPath}${timestamp}-${sanitizedFileName}`;

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

    return NextResponse.json({
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
    console.error('S3-Karo upload route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

