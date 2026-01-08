"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/stores/auth-store";
import { platformStorageService } from "@/features/managed-storage/services/managed-storage.service";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { s3ExplorerService } from "@/features/private-s3/services/s3-explorer.service";
import { useStorageStore } from "@/features/shared/stores/storage-store";

// Get files query hook
export function useFiles(filters?: {
  types?: string[];
  searchText?: string;
  sort?: string;
  limit?: number;
}) {
  const user = useAuthStore((state: any) => state.user);
  const { mode } = useStorageStore();

  return useQuery({
    queryKey: ["files", filters, mode, user?.$id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const uid = user.$id || user.id;
      const accountId = user.accountId || uid;

      if (mode === "own-s3") {
        const config = await s3ConfigService.getConfig(uid);
        if (!config) {
          throw new Error("S3 configuration not found");
        }
        const items = await s3ExplorerService.listItems({
          config,
          searchText: filters?.searchText || "",
          sort: filters?.sort || "$createdAt-desc",
          limit: filters?.limit,
          ownerId: uid,
          accountId,
        });

        // Filter by types if provided
        if (filters?.types && filters.types.length > 0) {
          items.documents = items.documents.filter((file) => filters.types!.includes(file.type));
        }

        return items;
      } else {
        return await platformStorageService.getFiles({
          types: filters?.types || [],
          searchText: filters?.searchText || "",
          sort: filters?.sort || "$createdAt-desc",
          limit: filters?.limit,
        });
      }
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

// Get total space used hook
export function useTotalSpace() {
  const user = useAuthStore((state: any) => state.user);
  const { mode } = useStorageStore();

  return useQuery({
    queryKey: ["totalSpace", mode, user?.$id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const uid = user.$id || user.id;

      if (mode === "own-s3") {
        const config = await s3ConfigService.getConfig(uid);
        if (!config) {
          throw new Error("S3 configuration not found");
        }
        return await s3ExplorerService.getBucketStats(config, `${uid}/${user.accountId || uid}/`);
      } else {
        return await platformStorageService.getStorageStats(uid);
      }
    },
    enabled: !!user,
    staleTime: 60000,
  });
}

// Delete file mutation
export function useDeleteFile() {
  const queryClient = useQueryClient();
  const { mode } = useStorageStore();

  return useMutation({
    mutationFn: async ({ fileId, bucketFileId }: { fileId: string; bucketFileId: string }) => {
      const path = typeof window !== "undefined" ? window.location.pathname : "/";

      if (mode === "own-s3") {
        // We need config - typically we'd get this from a store or re-fetch
        // For brevity in mutation, we assume config is available or fetch it
        // In a real app, user ID would be available via store
        const user = useAuthStore.getState().user;
        if (!user) throw new Error("User not found");
        const config = await s3ConfigService.getConfig(user.$id || user.id);
        if (!config) {
          throw new Error("S3 configuration not found");
        }
        return await s3ExplorerService.deleteItem({ config, key: bucketFileId });
      } else {
        return await platformStorageService.deleteFile({ fileId, path });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["totalSpace"] });
      queryClient.invalidateQueries({ queryKey: ["s3-files"] });
      queryClient.invalidateQueries({ queryKey: ["s3-stats"] });
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
      const path = typeof window !== "undefined" ? window.location.pathname : "/";

      if (mode === "own-s3") {
        const config = await s3ConfigService.getConfig(ownerId);
        if (!config) {
          throw new Error("S3 configuration not found");
        }

        const pathParts = bucketFileId.split("/");
        pathParts[pathParts.length - 1] = `${name}.${extension}`;
        const newKey = pathParts.join("/");

        return await s3ExplorerService.rename(config, bucketFileId, newKey);
      } else {
        return await platformStorageService.renameFile({
          fileId,
          name,
          extension,
          path,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["s3-files"] });
    },
  });
}
