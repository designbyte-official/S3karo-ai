"use client";

import { getStorageMode } from "@/lib/s3/config";
import {
  uploadFileToS3,
  listS3Files,
  deleteFileFromS3,
  renameFileInS3,
  getS3TotalSpaceUsed,
  getS3DownloadUrl,
  getS3ViewUrl,
  S3File,
} from "@/lib/s3/index";
// Removed Appwrite import - using only S3 now

// Unified file upload
export const uploadFile = async ({
  file,
  ownerId,
  accountId,
  path,
}: {
  file: File;
  ownerId: string;
  accountId: string;
  path: string;
}) => {
  const mode = getStorageMode();
  
  if (mode === 'own-s3' || mode === 'platform-s3') {
    try {
      const uploadedFile = await uploadFileToS3(file, ownerId, accountId);
      
      // For platform-s3: Save metadata to DB via API
      if (mode === 'platform-s3') {
        const API_BASE = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
        const response = await fetch(`${API_BASE}/api/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: uploadedFile.name,
            type: uploadedFile.type,
            extension: uploadedFile.extension,
            size: uploadedFile.size,
            url: uploadedFile.url,
            storageType: mode,
            storageKey: uploadedFile.key,
            bucketName: '',
          }),
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to save to database' }));
          throw new Error(error.error || 'Failed to save file metadata to database');
        }
      }
      // For own-s3: File is in S3, no DB operation needed
      
      // Trigger revalidation
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
      
      return uploadedFile;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  } else {
    throw new Error('Invalid storage mode');
  }
};

// Unified file listing
export const getFiles = async ({
  types = [],
  searchText = "",
  sort = "$createdAt-desc",
  limit,
  continuationToken,
  ownerId,
  accountId,
}: {
  types?: string[];
  searchText?: string;
  sort?: string;
  limit?: number;
  continuationToken?: string;
  ownerId: string;
  accountId: string;
}) => {
  const mode = getStorageMode();
  
  if (mode === 'own-s3' || mode === 'platform-s3') {
    try {
      // For own-s3, use client-side S3 operations
      if (mode === 'own-s3') {
        const result = await listS3Files(ownerId, accountId, {
          types,
          searchText,
          sort,
          limit,
          continuationToken,
        });
        
        return {
          documents: result.documents,
          total: result.total,
          continuationToken: result.continuationToken,
        };
      } else {
        // For platform-s3, this should go through API
        // But if called from client, return empty (API handles it)
        return { documents: [], total: 0 };
      }
    } catch (error: any) {
      console.error('S3 list error:', error);
      // Re-throw config errors so they can be handled by the UI
      if (error?.message?.includes('S3 configuration not found')) {
        throw error;
      }
      return { documents: [], total: 0 };
    }
  } else {
    // Fallback - return empty
    return { documents: [], total: 0 };
  }
};

// Unified file delete
export const deleteFile = async ({
  fileId,
  bucketFileId,
  path,
}: {
  fileId: string;
  bucketFileId: string;
  path: string;
}) => {
  const mode = getStorageMode();
  
  if (mode === 'own-s3' || mode === 'platform-s3') {
    try {
      await deleteFileFromS3(bucketFileId);
      
      // For platform-s3: Delete from database
      if (mode === 'platform-s3') {
        const API_BASE = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
        const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete file from database');
        }
      }
      // For own-s3: File deleted from S3, no DB operation needed
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
      
      return { status: 'success' };
    } catch (error) {
      console.error('S3 delete error:', error);
      throw error;
    }
  } else {
    throw new Error('Invalid storage mode');
  }
};

// Unified file rename
export const renameFile = async ({
  fileId,
  name,
  extension,
  path,
  ownerId,
  bucketFileId,
}: {
  fileId: string;
  name: string;
  extension: string;
  path: string;
  ownerId: string;
  bucketFileId: string;
}) => {
  const mode = getStorageMode();
  
  if (mode === 'own-s3' || mode === 'platform-s3') {
    try {
      const renamedFile = await renameFileInS3(bucketFileId, `${name}.${extension}`, ownerId);
      
      // For platform-s3: Update in database
      if (mode === 'platform-s3') {
        const API_BASE = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
        const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: `${name}.${extension}` }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update file in database');
        }
      }
      // For own-s3: File renamed in S3, no DB operation needed
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
      
      return renamedFile;
    } catch (error) {
      console.error('S3 rename error:', error);
      throw error;
    }
  } else {
    throw new Error('Invalid storage mode');
  }
};

// Unified get total space
export const getTotalSpaceUsed = async (ownerId: string) => {
  const mode = getStorageMode();
  
  if (mode === 'own-s3' || mode === 'platform-s3') {
    try {
      return await getS3TotalSpaceUsed(ownerId);
    } catch (error) {
      console.error('S3 space calculation error:', error);
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
  } else {
    // Fallback
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
};

// Get download URL
export const getDownloadUrl = async (bucketFileId: string): Promise<string> => {
  const mode = getStorageMode();
  
  if (mode === 'own-s3' || mode === 'platform-s3') {
    return await getS3DownloadUrl(bucketFileId);
  } else {
    throw new Error('Invalid storage mode');
  }
};

// Get view URL
export const getViewUrl = async (bucketFileId: string): Promise<string> => {
  const mode = getStorageMode();
  
  if (mode === 'own-s3' || mode === 'platform-s3') {
    return await getS3ViewUrl(bucketFileId);
  } else {
    throw new Error('Invalid storage mode');
  }
};

