"use server";

import { getCurrentUser } from "@/lib/actions/user.actions";
import { revalidatePath } from "next/cache";

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const getFiles = async ({
  types = [],
  searchText = "",
  sort = "$createdAt-desc",
  limit,
}: GetFilesProps) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User not found");

    const typesParam = types.length > 0 ? types.join(',') : '';
    const params = new URLSearchParams({
      types: typesParam,
      searchText,
      sort,
    });
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE}/api/files?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }

    return await response.json();
  } catch (error) {
    console.error('Get files error:', error);
    return { documents: [], total: 0 };
  }
};

export const getTotalSpaceUsed = async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("User is not authenticated.");

    const response = await fetch(`${API_BASE}/api/files/space`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch space usage');
    }

    return await response.json();
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
};

export const deleteFile = async ({
  fileId,
  bucketFileId,
  path,
}: DeleteFileProps) => {
  try {
    const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }

    revalidatePath(path);
    return { status: 'success' };
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
};

export const renameFile = async ({
  fileId,
  name,
  extension,
  path,
}: RenameFileProps) => {
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
      throw new Error('Failed to rename file');
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

