import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { hasPlatformAccess } from '@/lib/database/queries-subscriptions';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createPlatformS3Client, getPlatformS3Bucket } from '@/lib/s3/client-server';

/**
 * Generate presigned URL for S3 operations
 * Supports both OWN S3 (user's credentials) and MANAGED STORAGE (requires subscription)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation, key, contentType, storageMode } = body;

    if (!operation || !key) {
      return NextResponse.json(
        { error: 'Missing required fields: operation, key' },
        { status: 400 }
      );
    }

    // Check if Managed Storage requires subscription
    if (storageMode === 'managed-storage' || storageMode === 'platform-s3') {
      const access = await hasPlatformAccess(user.id);
      if (!access) {
        return NextResponse.json(
          { error: 'Managed Storage requires an active subscription' },
          { status: 403 }
        );
      }
    }

    // For OWN S3, client handles presigned URLs directly
    // For MANAGED STORAGE, we generate presigned URLs server-side
    if (storageMode === 'managed-storage' || storageMode === 'platform-s3') {
      const client = createPlatformS3Client();
      const bucket = getPlatformS3Bucket();

      let command;
      if (operation === 'get' || operation === 'download') {
        command = new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        });
      } else if (operation === 'put' || operation === 'upload') {
        command = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: contentType,
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid operation. Use "get", "download", "put", or "upload"' },
          { status: 400 }
        );
      }

      const expiresIn = operation === 'get' || operation === 'download'
        ? 3600 * 24 * 7 // 7 days for viewing
        : 3600; // 1 hour for uploading

      const url = await getSignedUrl(client, command, { expiresIn });

      return NextResponse.json({ url, expiresIn });
    }

    // For OWN S3, return instructions to use client-side
    return NextResponse.json({
      message: 'Use client-side S3 operations for OWN S3 mode',
      note: 'Presigned URLs are generated client-side using your AWS credentials',
    });
  } catch (error: any) {
    console.error('Presigned URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

