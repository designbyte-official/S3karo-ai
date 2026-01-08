"use client";

import React from "react";

import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/features/auth/stores/auth-store";

import { s3ConfigService } from "../services/s3-config.service";
import { s3ExplorerService } from "../services/s3-explorer.service";

import { useS3ConfigStatus } from "./use-s3-config-status";



export const useOwnS3 = (searchText: string = "", sort: string = "$createdAt-desc") => {
  const authUser = useAuthStore((state: any) => state.user);
  const [hydrated, setHydrated] = React.useState(false);
  const [subPath, setSubPath] = React.useState("");

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const user = authUser ? {
    $id: authUser.$id || authUser.id || '',
    id: authUser.id || authUser.$id || '',
    accountId: authUser.accountId || authUser.$id || authUser.id || '',
  } : null;

  const authLoading = !hydrated;

  const { data: hasConfig = false, isLoading: loadingConfig } = useS3ConfigStatus(user?.$id);

  const {
    data: filesData,
    isLoading: loadingFiles,
    error: filesError,
    refetch: refetchFiles
  } = useQuery({
    queryKey: ["s3-files", user?.$id, subPath, searchText, sort],
    queryFn: async () => {
      const config = await s3ConfigService.getConfig(user!.$id);
      if (!config) {
        // Don't throw error - just return empty result to prevent infinite retries
        return { documents: [], total: 0 };
      }
      const result = await s3ExplorerService.listItems({
        config,
        ownerId: user!.$id,
        accountId: user!.accountId,
        subPath,
        searchText,
        sort
      });
      return result;
    },
    enabled: !!(user && hasConfig),
    staleTime: 0, // Always consider data stale to allow fresh fetches
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: false, // Don't retry on error to prevent infinite loops
    retryOnMount: false, // Don't retry on mount
  });

  const {
    data: statsData,
    isLoading: loadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ["s3-stats", user?.$id],
    queryFn: async () => {
      const config = await s3ConfigService.getConfig(user!.$id);
      if (!config) {
        // Don't throw error - just return empty stats to prevent infinite retries
        return { used: 0, fileCount: 0, all: undefined };
      }
      return s3ExplorerService.getBucketStats(config, ""); // Stats for entire bucket access
    },
    enabled: !!(user && hasConfig),
    retry: false, // Don't retry on error to prevent infinite loops
    retryOnMount: false, // Don't retry on mount
  });

  const reload = () => {
    refetchFiles();
    refetchStats();
  };

  const navigateToFolder = (path: string) => {
    setSubPath(path);
  };

  const navigateBack = () => {
    const parts = subPath.split('/').filter(Boolean);
    parts.pop();
    setSubPath(parts.join('/'));
  };

  return {
    files: filesData?.documents || [],
    totalFiles: filesData?.documents?.length || 0,
    totalSpace: statsData || { used: 0, all: undefined },
    user,
    subPath,
    loading: authLoading || loadingFiles || loadingStats || loadingConfig,
    hasConfig,
    error: (filesError as Error)?.message || (statsError as Error)?.message,
    reload,
    navigateToFolder,
    navigateBack,
    setSubPath,
    createFolder: async (name: string) => {
      const config = await s3ConfigService.getConfig(user!.$id);
      if (!config) throw new Error("No config");
      await s3ExplorerService.createFolder({
        config,
        ownerId: user!.$id,
        accountId: user!.accountId,
        name,
        path: subPath
      });
      reload();
    }
  };
};
