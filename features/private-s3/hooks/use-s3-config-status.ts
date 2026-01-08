"use client";

import { useQuery } from "@tanstack/react-query";

import { s3ConfigService } from "../services/s3-config.service";

export const useS3ConfigStatus = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["own-s3-config-status", userId],
    queryFn: async () => {
      if (!userId) return false;
      return await s3ConfigService.hasConfig(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry to prevent infinite loops
    retryOnMount: false,
  });
};
