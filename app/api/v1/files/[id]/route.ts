import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey, deleteFile } from '@/lib/database/queries';
import { createPlatformS3Client, getPlatformS3Bucket } from '@/features/managed-storage/services/platform-s3.service';
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

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
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid API key' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    const authResult = await verifyApiKey(apiKey);
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired API key' },
        { status: 401 }
      );
    }

    const { userId } = authResult;

    // Get file and delete from database
    const deletedFile = await deleteFile(id, userId);

    if (!deletedFile) {
      return NextResponse.json(
        { error: 'Not found', message: 'File not found or access denied' },
        { status: 404 }
      );
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
      console.error('Failed to delete from S3:', s3Error);
      // Continue even if S3 delete fails - file is already removed from DB
    }

    return NextResponse.json({
      message: 'File deleted successfully',
      id: id,
    });

  } catch (error: any) {
    console.error('API delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

