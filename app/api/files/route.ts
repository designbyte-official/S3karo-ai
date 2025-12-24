import { NextRequest, NextResponse } from 'next/server';
import { getFilesForUser, createFile } from '@/lib/database/queries';
import { getCurrentUser } from '@/lib/auth/utils';

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

    // Get files using Drizzle
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

// POST - Upload file (metadata only, actual upload handled client-side)
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
    const { name, type, extension, size, url, storageType, storageKey, bucketName } = body;

    if (!name || !type || !extension || !size || !url || !storageKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create file using Drizzle
    const file = await createFile({
      userId: user.id,
      name,
      type,
      extension,
      size,
      url,
      storageType: storageType || 's3',
      storageKey,
      bucketName,
    });

    // Transform to match existing format
    const transformedFile = {
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

