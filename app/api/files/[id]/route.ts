import { NextRequest, NextResponse } from 'next/server';
import { deleteFile, updateFile } from '@/lib/database/queries';
import { getCurrentUser } from '@/lib/auth/utils';
import { createPlatformS3Client, getPlatformS3Bucket } from '@/features/managed-storage/services/platform-s3.service';
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

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
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get file first to get storageKey (needed to delete from S3)
    const deletedFile = await deleteFile(id, user.id);

    if (!deletedFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete from S3 using storageKey (REQUIRED - this is why we store it!)
    try {
      const client = createPlatformS3Client();
      const bucket = getPlatformS3Bucket();
      
      await client.send(new DeleteObjectCommand({
        Bucket: bucket,
        Key: deletedFile.storageKey,
      }));
      console.log(`Deleted file from S3: ${deletedFile.storageKey}`);
    } catch (s3Error: any) {
      console.error('Failed to delete from S3 (file already deleted from DB):', s3Error);
      // Continue even if S3 delete fails - file is already removed from DB
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Update file using Drizzle
    const updatedFile = await updateFile(id, user.id, {
      name: body.name,
      sharedWith: body.shared_with,
    });

    if (!updatedFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
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

    return NextResponse.json(transformedFile);
  } catch (error: any) {
    console.error('Update file error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

