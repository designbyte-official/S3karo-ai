import { NextRequest, NextResponse } from 'next/server';
import { getFilesForUser, createFile } from '@/lib/database/queries';
import { getCurrentUser } from '@/lib/auth/utils';
import { isDatabaseConfigured } from '@/lib/database/db';

import { createPlatformS3Client, getPlatformS3Bucket } from '@/features/managed-storage/services/platform-s3.service';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getFileType } from '@/features/shared/utils';

// GET - List files
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
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

    return NextResponse.json({
      documents: transformedFiles,
      total: transformedFiles.length,
    });
  } catch (error: any) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Upload file
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Platform S3 requires database
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured. Platform S3 requires database connection.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ownerId = formData.get('ownerId') as string;
    const accountId = formData.get('accountId') as string;
    const path = formData.get('path') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const client = createPlatformS3Client();
    const bucket = getPlatformS3Bucket();

    // Construct a safe key: managed/{userId}/{originalName} or managed/{userId}/{path}/{originalName}
    // For now simplistic strategy to avoid collisions could use a timestamp or uuid, but retaining name is nice.
    const cleanPath = path ? (path.endsWith('/') ? path : `${path}/`) : '';
    const storageKey = `managed/${user.id}/${cleanPath}${Date.now()}-${file.name}`;

    try {
      console.log(`Attempting S3 upload to bucket: ${bucket}, key: ${storageKey}`);
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: file.type,
      }));
      console.log("S3 upload successful");
    } catch (s3Error: any) {
      console.error("S3 Upload Error Detail:", {
        message: s3Error.message,
        code: s3Error.code,
        requestId: s3Error.$metadata?.requestId,
        bucket,
        region: process.env.AWS_REGION
      });
      return NextResponse.json(
        { error: 'Failed to upload to storage', details: s3Error.message, code: s3Error.name },
        { status: 500 }
      );
    }

    const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${storageKey}`;
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

    return NextResponse.json(transformedFile);
  } catch (error: any) {
    console.error('Upload file error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

