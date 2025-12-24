import { NextRequest, NextResponse } from 'next/server';
import { deleteFile, updateFile } from '@/lib/database/queries';
import { getCurrentUser } from '@/lib/auth/utils';

// DELETE - Delete file
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

    // Delete file using Drizzle
    const deletedFile = await deleteFile(id, user.id);

    if (!deletedFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
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

