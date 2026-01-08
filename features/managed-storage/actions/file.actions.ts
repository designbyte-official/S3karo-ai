"use server";

import { getCurrentUser } from "@/features/auth/actions/user.actions";
import { getFilesForUser } from "@/lib/database/queries";
import { S3File } from "@/types/file";

export const getFiles = async (params: {
  types?: string[];
  searchText?: string;
  sort?: string;
  limit?: number;
}): Promise<{ documents: S3File[]; total: number }> => {
  try {
    const user = await getCurrentUser();
    if (!user) return { documents: [], total: 0 };

    const files = await getFilesForUser(user.id, {
      types: params.types,
      searchText: params.searchText,
      sort: params.sort,
      limit: params.limit,
    });

    // Transform to match existing format
    const transformedFiles: S3File[] = files.map((file) => ({
      $id: file.id,
      id: file.id,
      name: file.name,
      type: file.type,
      extension: file.extension,
      size: Number(file.size),
      url: file.url,
      owner: {
        $id: user.id,
        fullName: user.fullName || "",
      },
      accountId: user.id,
      users: (file.sharedWith as string[]) || [],
      bucketFileId: file.storageKey,
      $createdAt: file.createdAt.toISOString(),
      $updatedAt: file.updatedAt.toISOString(),
    }));

    return {
      documents: transformedFiles,
      total: transformedFiles.length,
    };
  } catch (error) {
    console.error("Error fetching files:", error);
    return { documents: [], total: 0 };
  }
};
