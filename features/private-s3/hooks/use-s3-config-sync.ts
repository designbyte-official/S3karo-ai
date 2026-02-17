import { useState, useEffect, useRef } from "react";

import { s3ConfigService, S3Config } from "../services/s3-config.service";

export const useS3ConfigSync = (userId: string, isInitialEditMode: boolean) => {
  const [currentConfig, setCurrentConfig] = useState<S3Config | null>(null);
  const [isEditMode, setIsEditMode] = useState(isInitialEditMode);
  const configSyncRef = useRef(false);

  useEffect(() => {
    const syncConfig = async () => {
      try {
        const latestConfig = await s3ConfigService.getConfig(userId);
        if (latestConfig) {
          // SECURITY: We only store basic info and existence flag in state
          setCurrentConfig({
            bucket: latestConfig.bucket ? "EXISTING" : "",
            cdnUrl: latestConfig.cdnUrl,
          } as S3Config);

          // If configured, switch to view mode (unless explicitly override)
          if (latestConfig.bucket && !configSyncRef.current) {
            setIsEditMode(false);
          }
        } else {
          setCurrentConfig(null);
          setIsEditMode(true);
        }
      } catch (error) {
        console.error("Failed to sync config flag:", error);
      }
    };

    if (!configSyncRef.current) {
      syncConfig();
      configSyncRef.current = true;
    }

    const handleStorageChange = () => syncConfig();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("s3-config-updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("s3-config-updated", handleStorageChange);
    };
  }, [userId]);

  return {
    currentConfig,
    setCurrentConfig,
    isEditMode,
    setIsEditMode,
  };
};
