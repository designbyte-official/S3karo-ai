import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { isDatabaseConfigured } from '@/lib/database/db';
import { createFile } from '@/lib/database/queries';
import { getPlatformS3Bucket } from '@/features/managed-storage/services/platform-s3.service';
import { getFileType } from '@/features/shared/utils';

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
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Service unavailable', message: 'Database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { key, fileName, fileType, fileSize, path } = body;

    if (!key || !fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: 'Bad request', message: 'key, fileName, fileType, and fileSize are required' },
        { status: 400 }
      );
    }

    // Verify the key belongs to this user
    if (!key.startsWith(`managed/${user.id}/`)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Invalid storage key' },
        { status: 403 }
      );
    }

    // Generate file URL
    const bucket = getPlatformS3Bucket();
    const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
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

    return NextResponse.json({
      id: dbFile.id,
      name: dbFile.name,
      url: dbFile.url,
      size: Number(dbFile.size),
      type: dbFile.type,
      extension: dbFile.extension,
      createdAt: dbFile.createdAt.toISOString(),
    }, { status: 201 });

  } catch (error: any) {
    console.error('S3-Karo callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

