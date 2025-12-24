"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFiles as getFilesClient, getTotalSpaceUsed as getTotalSpaceUsedClient } from "@/lib/actions/file.actions.client";
import { useStorageStore } from "@/lib/stores/storage-store";
import { useAuth } from "@/lib/hooks/use-auth";

// Get files query hook
export function useFiles(filters?: {
  types?: string[];
  searchText?: string;
  sort?: string;
  limit?: number;
}) {
  const { user } = useAuth();
  const { mode } = useStorageStore();

  return useQuery({
    queryKey: ["files", filters, mode],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      if (mode === "own-s3") {
        return await getFilesClient({
          types: filters?.types || [],
          searchText: filters?.searchText || "",
          sort: filters?.sort || "$createdAt-desc",
          limit: filters?.limit,
          ownerId: user.$id || user.id,
          accountId: user.accountId || user.id,
        });
      } else {
        // For platform-s3 or custom backend, fetch from API
        const params = new URLSearchParams();
        if (filters?.types && filters.types.length > 0) {
          params.append("types", filters.types.join(","));
        }
        if (filters?.searchText) params.append("searchText", filters.searchText);
        if (filters?.sort) params.append("sort", filters.sort);
        if (filters?.limit) params.append("limit", filters.limit.toString());

        const response = await fetch(`/api/files?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch files");
        return await response.json();
      }
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });
}

// Get total space used hook
export function useTotalSpace() {
  const { user } = useAuth();
  const { mode } = useStorageStore();

  return useQuery({
    queryKey: ["totalSpace", mode],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      if (mode === "own-s3") {
        return await getTotalSpaceUsedClient(user.$id || user.id);
      } else {
        const response = await fetch("/api/files/space");
        if (!response.ok) throw new Error("Failed to fetch space");
        return await response.json();
      }
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });
}

// Delete file mutation
export function useDeleteFile() {
  const queryClient = useQueryClient();
  const { mode } = useStorageStore();

  return useMutation({
    mutationFn: async ({ fileId, bucketFileId }: { fileId: string; bucketFileId: string }) => {
      if (mode === "own-s3") {
        const { deleteFile: deleteFileClient } = await import("@/lib/actions/file.actions.client");
        return await deleteFileClient({ fileId, bucketFileId, path: window.location.pathname });
      } else {
        const response = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete file");
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["totalSpace"] });
    },
  });
}

// Rename file mutation
export function useRenameFile() {
  const queryClient = useQueryClient();
  const { mode } = useStorageStore();

  return useMutation({
    mutationFn: async ({
      fileId,
      name,
      extension,
      bucketFileId,
      ownerId,
    }: {
      fileId: string;
      name: string;
      extension: string;
      bucketFileId: string;
      ownerId: string;
    }) => {
      if (mode === "own-s3") {
        const { renameFile: renameFileClient } = await import("@/lib/actions/file.actions.client");
        return await renameFileClient({ fileId, name, extension, path: window.location.pathname, ownerId, bucketFileId });
      } else {
        const response = await fetch(`/api/files/${fileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: `${name}.${extension}` }),
        });
        if (!response.ok) throw new Error("Failed to rename file");
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

