"use client";

import React from "react";
import { s3ExplorerService } from "../services/s3-explorer.service";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useS3ConfigStatus } from "./use-s3-config-status";
import { s3ConfigService } from "../services/s3-config.service";
import { useQuery } from "@tanstack/react-query";

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
      if (!config) throw new Error("No S3 config");
      return s3ExplorerService.listItems({
        config,
        ownerId: user!.$id,
        accountId: user!.accountId,
        subPath,
        searchText,
        sort
      });
    },
    enabled: !!(user && hasConfig),
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
      if (!config) throw new Error("No S3 config");
      return s3ExplorerService.getBucketStats(config, `${user!.$id}/${user!.accountId}/`);
    },
    enabled: !!(user && hasConfig),
  });

  const reload = () => {
    refetchFiles();
    refetchStats();
  };

  const navigateToFolder = (path: string) => {
    const relativePath = path.replace(`${user?.$id}/${user?.accountId}/`, '');
    setSubPath(relativePath);
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
        name,
        path: subPath
      });
      reload();
    }
  };
};
