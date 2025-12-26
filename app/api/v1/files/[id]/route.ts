import { NextRequest } from 'next/server';

import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { verifyApiKey, deleteFile } from '@/lib/database/queries';
import { apiErrors, createSuccessResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';

import { createPlatformS3Client, getPlatformS3Bucket } from '@/features/managed-storage/services/platform-s3.service';

/**
 * DELETE /api/v1/files/:id
 * Delete a file by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate
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

    // Get file and delete from database
    const deletedFile = await deleteFile(id, userId);

    if (!deletedFile) {
      return apiErrors.notFound('File not found or access denied');
    }

    // Delete from S3
    try {
      const client = createPlatformS3Client();
      const bucket = getPlatformS3Bucket();
      
      await client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: deletedFile.storageKey,
      }));
    } catch (s3Error: any) {
      logger.error('Failed to delete from S3', s3Error);
      // Continue even if S3 delete fails - file is already removed from DB
    }

    return createSuccessResponse({
      message: 'File deleted successfully',
      id: id,
    });

  } catch (error: any) {
    logger.error('API delete error', error);
    return apiErrors.internalServerError('Internal server error', error.message);
  }
}

