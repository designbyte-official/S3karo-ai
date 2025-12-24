"use server";

// This file now uses the new custom backend API routes
// Appwrite code is kept for backward compatibility but not used by default
import { getCurrentUser } from "@/lib/actions/user.actions";
import { revalidatePath } from "next/cache";

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const handleError = (error: unknown, message: string) => {
  console.log(error, message);
  throw error;
};

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
  // For Appwrite mode, this would need to be updated to use API routes
  throw new Error("File upload should be handled client-side. Use file.actions.client.ts instead.");
};

const createQueries = (
  currentUser: Models.Document,
  types: string[],
  searchText: string,
  sort: string,
  limit?: number,
) => {
  const queries = [
    Query.or([
      Query.equal("owner", [currentUser.$id]),
      Query.contains("users", [currentUser.email]),
    ]),
  ];

  if (types.length > 0) queries.push(Query.equal("type", types));
  if (searchText) queries.push(Query.contains("name", searchText));
  if (limit) queries.push(Query.limit(limit));

  if (sort) {
    const [sortBy, orderBy] = sort.split("-");

    queries.push(
      orderBy === "asc" ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy),
    );
  }

  return queries;
};

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
  const { databases } = await createAdminClient();

  try {
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId,
      {
        users: emails,
      },
    );

    revalidatePath(path);
    return parseStringify(updatedFile);
  } catch (error) {
    handleError(error, "Failed to rename file");
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

// ============================== TOTAL FILE SPACE USED
export async function getTotalSpaceUsed() {
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
}
