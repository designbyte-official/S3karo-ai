import { NextRequest } from 'next/server';

import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { getCurrentUser } from '@/lib/auth/utils';
import { deleteFile, updateFile } from '@/lib/database/queries';
import { decrementStorageUsage } from '@/lib/database/queries-subscriptions';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

import { createPlatformS3Client, getPlatformS3Bucket } from '@/features/managed-storage/services/platform-s3.service';

// DELETE - Delete file (Managed Storage only)
// NOTE: Private S3 files are NOT in the database - they're deleted client-side
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

    // Get file first to get storageKey (needed to delete from S3)
    const deletedFile = await deleteFile(id, user.id);

    if (!deletedFile) {
      return apiErrors.notFound('File not found');
    }

    // Delete from S3 using storageKey (REQUIRED - this is why we store it!)
    try {
      const client = createPlatformS3Client();
      const bucket = getPlatformS3Bucket();
      
      await client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: deletedFile.storageKey,
      }));
      logger.info('Deleted file from S3', { storageKey: deletedFile.storageKey });
    } catch (s3Error: any) {
      logger.error('Failed to delete from S3 (file already deleted from DB)', s3Error);
      // Continue even if S3 delete fails - file is already removed from DB
    }

    // Decrement storage usage
    await decrementStorageUsage(user.id, Number(deletedFile.size));

    return createSuccessResponse({ status: 'success' });
  } catch (error: any) {
    logger.error('Delete file error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

// PATCH - Update file (rename, share, etc.)
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

    // Update file using Drizzle
    const updatedFile = await updateFile(id, user.id, {
      name: body.name,
      sharedWith: body.shared_with,
    });

    if (!updatedFile) {
      return apiErrors.notFound('File not found');
    }

    // Transform to match existing format
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

    return createSuccessResponse(transformedFile);
  } catch (error: any) {
    logger.error('Update file error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

