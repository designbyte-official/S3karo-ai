import { NextRequest } from 'next/server';

import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { createPlatformS3Client, getPlatformS3Bucket } from '@/features/managed-storage/services/platform-s3.service';
import { getCurrentUser } from '@/lib/auth/utils';
import { deleteFile, updateFile } from '@/lib/database/queries';
import { decrementStorageUsage } from '@/lib/database/queries-subscriptions';
import { deleteCache } from '@/lib/redis/cache';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    
    if (!user) {
      return apiErrors.unauthorized();
    }

    const deletedFile = await deleteFile(id, user.id);

    if (!deletedFile) {
      return apiErrors.notFound('File not found');
    }

    try {
      const client = createPlatformS3Client();
      const bucket = getPlatformS3Bucket();
      
      await client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: deletedFile.storageKey,
      }));
    } catch (s3Error: any) {
      logger.error('Failed to delete from S3', s3Error);
    }

    await decrementStorageUsage(user.id, Number(deletedFile.size));

    await deleteCache(`storage-stats:${user.id}`);

    return createSuccessResponse({ status: 'success' });
  } catch (error: any) {
    logger.error('Delete file error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const body = await request.json();
    
    if (!user) {
      return apiErrors.unauthorized();
    }

    const updatedFile = await updateFile(id, user.id, {
      name: body.name,
      sharedWith: body.shared_with,
    });

    if (!updatedFile) {
      return apiErrors.notFound('File not found');
    }

    const transformedFile = {
      $id: updatedFile.id,
      id: updatedFile.id,
      name: updatedFile.name,
      type: updatedFile.type,
      extension: updatedFile.extension,
      size: Number(updatedFile.size),
      url: updatedFile.url,
      owner: {
        $id: user.id,
        fullName: user.fullName,
      },
      accountId: user.id,
      users: (updatedFile.sharedWith as string[]) || [],
      bucketFileId: updatedFile.storageKey,
      $createdAt: updatedFile.createdAt.toISOString(),
      $updatedAt: updatedFile.updatedAt.toISOString(),
    };

    await deleteCache(`storage-stats:${user.id}`);

    return createSuccessResponse(transformedFile);
  } catch (error: any) {
    logger.error('Update file error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

