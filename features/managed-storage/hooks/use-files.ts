"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { s3ExplorerService } from "@/lib/services/s3/s3-explorer.service";
import { platformStorageService } from "@/lib/services/platform/platform-storage.service";
import { s3ConfigService } from "@/lib/services/s3/s3-config.service";
import { useStorageStore } from "@/lib/stores/storage-store";
import { useAuthStore } from "@/lib/stores/auth-store";

// Get files query hook
export function useFiles(filters?: {
  types?: string[];
  searchText?: string;
  sort?: string;
  limit?: number;
}) {
  const user = useAuthStore((state) => state.user);
  const { mode } = useStorageStore();

  return useQuery({
    queryKey: ["files", filters, mode, user?.$id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const uid = user.$id || user.id;
      const accountId = user.accountId || uid;

      if (mode === "own-s3") {
        const config = await s3ConfigService.getConfig(uid);
        return await s3ExplorerService.listItems({
          config,
          types: filters?.types || [],
          searchText: filters?.searchText || "",
          sort: filters?.sort || "$createdAt-desc",
          limit: filters?.limit,
          ownerId: uid,
          accountId,
        });
      } else {
        return await platformStorageService.getFiles({
          userId: uid,
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
  const user = useAuthStore((state) => state.user);
  const { mode } = useStorageStore();

  return useQuery({
    queryKey: ["totalSpace", mode, user?.$id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const uid = user.$id || user.id;

      if (mode === "own-s3") {
        const config = await s3ConfigService.getConfig(uid);
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
      const path = typeof window !== 'undefined' ? window.location.pathname : '/';

      if (mode === "own-s3") {
        // We need config - typically we'd get this from a store or re-fetch
        // For brevity in mutation, we assume config is available or fetch it
        // In a real app, user ID would be available via store
        const user = useAuthStore.getState().user;
        if (!user) throw new Error("User not found");
        const config = await s3ConfigService.getConfig(user.$id || user.id);

        const { s3CoreService } = await import("@/lib/services/s3/s3-core.service");
        return await s3CoreService.delete(config, bucketFileId);
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
      const path = typeof window !== 'undefined' ? window.location.pathname : '/';

      if (mode === "own-s3") {
        const config = await s3ConfigService.getConfig(ownerId);
        const { s3CoreService } = await import("@/lib/services/s3/s3-core.service");

        const pathParts = bucketFileId.split('/');
        pathParts[pathParts.length - 1] = `${name}.${extension}`;
        const newKey = pathParts.join('/');

        const metadata = await s3CoreService.head(config, bucketFileId);
        return await s3CoreService.rename(config, bucketFileId, newKey, metadata.metadata);
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
