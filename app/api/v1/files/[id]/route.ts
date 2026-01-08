import { NextRequest } from 'next/server';

import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { createPlatformS3Client, getPlatformS3Bucket } from '@/features/managed-storage/services/platform-s3.service';
import { verifyApiKey, deleteFile } from '@/lib/database/queries';
import { decrementStorageUsage } from '@/lib/database/queries-subscriptions';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiErrors.unauthorized('Missing or invalid API key');
    }

    const apiKey = authHeader.substring(7);
    const authResult = await verifyApiKey(apiKey);
    
    if (!authResult) {
      return apiErrors.unauthorized('Invalid or expired API key');
    }

    const { userId } = authResult;

    const deletedFile = await deleteFile(id, userId);

    if (!deletedFile) {
      return apiErrors.notFound('File not found or access denied');
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

    await decrementStorageUsage(userId, Number(deletedFile.size));

    return createSuccessResponse({
      message: 'File deleted successfully',
      id,
    });

  } catch (error: any) {
    logger.error('API delete error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

