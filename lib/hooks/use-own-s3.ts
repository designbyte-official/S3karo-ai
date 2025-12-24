import { useEffect, useState } from "react";
import { getStorageMode, getS3Config } from "@/lib/s3/config";
import { getFiles as getFilesClient } from "@/lib/actions/file.actions.client";
import { getTotalSpaceUsed as getTotalSpaceUsedClient } from "@/lib/actions/file.actions.client";
import { getCurrentUser } from "@/lib/actions/user.actions";

export interface File {
  $id: string;
  id?: string;
  name: string;
  type: string;
  extension: string;
  size: number;
  url: string;
  owner?: {
    $id: string;
    fullName?: string;
  };
  accountId?: string;
  users?: string[];
  bucketFileId?: string;
  key?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface User {
  $id: string;
  id?: string;
  accountId: string;
}

export interface TotalSpace {
  used: number;
  total: number;
}

export const useOwnS3 = () => {
  const [files, setFiles] = useState<{ documents: File[]; total: number }>({ documents: [], total: 0 });
  const [totalSpace, setTotalSpace] = useState<TotalSpace | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasConfig, setHasConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser({
            $id: currentUser.$id || currentUser.id || '',
            id: currentUser.id || currentUser.$id,
            accountId: currentUser.accountId || currentUser.$id || '',
          });
          
          // Check if S3 config exists
          const config = await getS3Config(currentUser.$id || currentUser.id);
          const configExists = !!(config && config.accessKeyId && config.secretAccessKey && config.bucket);
          setHasConfig(configExists);
        } else {
          setError('User not found');
        }
      } catch (error: any) {
        console.error('Error fetching user:', error);
        setError(error?.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please check your S3 connection')), 30000); // 30 second timeout
      });

      const dataPromise = Promise.all([
        getFilesClient({
          types: [],
          ownerId: user.$id,
          accountId: user.accountId,
        }),
        getTotalSpaceUsedClient(user.$id),
      ]);

      const [filesData, spaceData] = await Promise.race([dataPromise, timeoutPromise]) as [any, any];
      setFiles(filesData);
      setTotalSpace(spaceData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error?.message?.includes('S3 configuration not found')) {
        setError('S3 configuration not found');
        setHasConfig(false);
      } else if (error?.message?.includes('timeout')) {
        setError('Connection timeout - please check your S3 credentials and network');
      } else {
        setError(error?.message || 'Failed to load files');
      }
      // Set empty data on error so UI can still render
      setFiles({ documents: [], total: 0 });
      setTotalSpace(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && hasConfig) {
      loadData();
    } else if (user && !hasConfig) {
      // User exists but no config - set loading to false so page can redirect
      setLoading(false);
      setError('S3 configuration not found');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasConfig]);

  // Listen for file changes
  useEffect(() => {
    if (typeof window !== 'undefined' && user && hasConfig) {
      const handleStorageChange = () => {
        loadData();
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasConfig]);

  return {
    files,
    totalSpace,
    user,
    loading,
    hasConfig,
    error,
    reload: loadData,
  };
};

