"use server";

// This file uses the custom backend API routes
import { getCurrentUser } from "@/lib/actions/user.actions";
import { revalidatePath } from "next/cache";

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Upload is now handled client-side for S3, or through API route
// This function is kept for compatibility but should not be used directly
export const uploadFile = async ({
  file,
  ownerId,
  accountId,
  path,
}: UploadFileProps) => {
  // This is a legacy function - file uploads are now handled client-side
  // For S3 mode, files are uploaded directly from the client
  // For custom backend, files are uploaded via client actions
  throw new Error("File upload should be handled client-side. Use file.actions.client.ts instead.");
};

export const getFiles = async ({
  types = [],
  searchText = "",
  sort = "$createdAt-desc",
  limit,
}: GetFilesProps): Promise<{
  documents: any[];
  total: number;
}> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('User not found');
      return { documents: [], total: 0 };
    }

    const typesParam = types.length > 0 ? types.join(',') : '';
    const params = new URLSearchParams({
      types: typesParam,
      searchText,
      sort,
    });
    if (limit) params.append('limit', limit.toString());

    // For server-side, use the database queries directly instead of API route
    // This avoids cookie issues with server-side fetch
    const { getFilesForUser } = await import('@/lib/database/queries');
    
    const files = await getFilesForUser(currentUser.id, {
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
        $id: currentUser.id,
        fullName: currentUser.fullName,
      },
      accountId: currentUser.id,
      users: (file.sharedWith as string[]) || [],
      bucketFileId: file.storageKey,
      $createdAt: file.createdAt.toISOString(),
      $updatedAt: file.updatedAt.toISOString(),
    }));

    return {
      documents: transformedFiles,
      total: transformedFiles.length,
    };

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch files:', response.status, errorText);
      return { documents: [], total: 0 };
    }

    const data = await response.json();
    return {
      documents: data.documents || [],
      total: data.total || 0,
    };
  } catch (error) {
    console.error('Get files error:', error);
    return { documents: [], total: 0 };
  }
};

export const renameFile = async ({
  fileId,
  name,
  extension,
  path,
}: RenameFileProps): Promise<any> => {
  try {
    const newName = `${name}.${extension}`;
    const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to rename file: ${errorText}`);
    }

    revalidatePath(path);
    return await response.json();
  } catch (error) {
    console.error('Rename file error:', error);
    throw error;
  }
};

export const updateFileUsers = async ({
  fileId,
  emails,
  path,
}: UpdateFileUsersProps) => {
  try {
    const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shared_with: emails }),
    });

    if (!response.ok) {
      throw new Error('Failed to update file users');
    }

    revalidatePath(path);
    return await response.json();
  } catch (error) {
    console.error('Update file users error:', error);
    throw error;
  }
};

export const deleteFile = async ({
  fileId,
  bucketFileId,
  path,
}: DeleteFileProps): Promise<{ status: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete file: ${errorText}`);
    }

    revalidatePath(path);
    return { status: 'success' };
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
};

// ============================== TOTAL FILE SPACE USED
export async function getTotalSpaceUsed(): Promise<{
  image: { size: number; latestDate: string };
  document: { size: number; latestDate: string };
  video: { size: number; latestDate: string };
  audio: { size: number; latestDate: string };
  other: { size: number; latestDate: string };
  used: number;
  all: number;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('User is not authenticated');
      return {
        image: { size: 0, latestDate: "" },
        document: { size: 0, latestDate: "" },
        video: { size: 0, latestDate: "" },
        audio: { size: 0, latestDate: "" },
        other: { size: 0, latestDate: "" },
        used: 0,
        all: 2 * 1024 * 1024 * 1024 * 1024,
      };
    }

    // Use database queries directly instead of API route
    const { getTotalSpaceUsed } = await import('@/lib/database/queries');
    
    return await getTotalSpaceUsed(currentUser.id);
  } catch (error) {
    console.error('Get total space error:', error);
    return {
      image: { size: 0, latestDate: "" },
      document: { size: 0, latestDate: "" },
      video: { size: 0, latestDate: "" },
      audio: { size: 0, latestDate: "" },
      other: { size: 0, latestDate: "" },
      used: 0,
      all: 2 * 1024 * 1024 * 1024 * 1024,
    };
  }
}
