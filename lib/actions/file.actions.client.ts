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
import { uploadFile as uploadFileAppwrite } from "./file.actions";
import { revalidatePath } from "next/cache";

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
  
  if (mode === 's3') {
    try {
      const uploadedFile = await uploadFileToS3(file, ownerId, accountId);
      
      // Save file metadata to database via API
      const API_BASE = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      try {
        await fetch(`${API_BASE}/api/files`, {
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
            storageType: 's3',
            storageKey: uploadedFile.key,
            bucketName: '', // Will be set from S3 config
          }),
        });
      } catch (apiError) {
        console.error('Failed to save file metadata to database:', apiError);
        // Continue even if API call fails
      }
      
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
    // For custom backend, we still use S3 but save to our database
    // Appwrite mode is deprecated
    const uploadedFile = await uploadFileToS3(file, ownerId, accountId);
    
    // Save to our database
    const API_BASE = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    try {
      await fetch(`${API_BASE}/api/files`, {
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
          storageType: 's3',
          storageKey: uploadedFile.key,
          bucketName: '',
        }),
      });
    } catch (apiError) {
      console.error('Failed to save file metadata:', apiError);
    }
    
    return uploadedFile;
  }
};

// Unified file listing
export const getFiles = async ({
  types = [],
  searchText = "",
  sort = "$createdAt-desc",
  limit,
  ownerId,
  accountId,
}: {
  types?: string[];
  searchText?: string;
  sort?: string;
  limit?: number;
  ownerId: string;
  accountId: string;
}) => {
  const mode = getStorageMode();
  
  if (mode === 's3') {
    try {
      const result = await listS3Files(ownerId, accountId, {
        types,
        searchText,
        sort,
        limit,
      });
      
      return {
        documents: result.documents,
        total: result.total,
      };
    } catch (error) {
      console.error('S3 list error:', error);
      return { documents: [], total: 0 };
    }
  } else {
    // For Appwrite, we need to use server actions
    // This should be called from a server component or through an API route
    // For now, return empty - the server component will handle it
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
  
  if (mode === 's3') {
    try {
      await deleteFileFromS3(bucketFileId);
      
      // Remove from localStorage
      const files = JSON.parse(localStorage.getItem('s3-files') || '[]');
      const updatedFiles = files.filter((f: S3File) => f.$id !== fileId);
      localStorage.setItem('s3-files', JSON.stringify(updatedFiles));
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
      
      return { status: 'success' };
    } catch (error) {
      console.error('S3 delete error:', error);
      throw error;
    }
  } else {
    // Use Appwrite server action - import and call directly
    const { deleteFile: deleteFileAppwrite } = await import('./file.actions');
    return await deleteFileAppwrite({ fileId, bucketFileId, path });
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
  
  if (mode === 's3') {
    try {
      const renamedFile = await renameFileInS3(bucketFileId, `${name}.${extension}`, ownerId);
      
      // Update localStorage
      const files = JSON.parse(localStorage.getItem('s3-files') || '[]');
      const updatedFiles = files.map((f: S3File) => 
        f.$id === fileId ? renamedFile : f
      );
      localStorage.setItem('s3-files', JSON.stringify(updatedFiles));
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
      
      return renamedFile;
    } catch (error) {
      console.error('S3 rename error:', error);
      throw error;
    }
  } else {
    // Use Appwrite server action
    const { renameFile: renameFileAppwrite } = await import('./file.actions');
    return await renameFileAppwrite({ fileId, name, extension, path });
  }
};

// Unified get total space
export const getTotalSpaceUsed = async (ownerId: string) => {
  const mode = getStorageMode();
  
  if (mode === 's3') {
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
    // Use Appwrite server action
    const { getTotalSpaceUsed: getTotalSpaceUsedAppwrite } = await import('./file.actions');
    return await getTotalSpaceUsedAppwrite();
  }
};

// Get download URL
export const getDownloadUrl = async (bucketFileId: string): Promise<string> => {
  const mode = getStorageMode();
  
  if (mode === 's3') {
    return await getS3DownloadUrl(bucketFileId);
  } else {
    // Appwrite URL construction
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const bucket = process.env.NEXT_PUBLIC_APPWRITE_BUCKET;
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
    return `${endpoint}/storage/buckets/${bucket}/files/${bucketFileId}/download?project=${project}`;
  }
};

// Get view URL
export const getViewUrl = async (bucketFileId: string): Promise<string> => {
  const mode = getStorageMode();
  
  if (mode === 's3') {
    return await getS3ViewUrl(bucketFileId);
  } else {
    // Appwrite URL construction
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const bucket = process.env.NEXT_PUBLIC_APPWRITE_BUCKET;
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
    return `${endpoint}/storage/buckets/${bucket}/files/${bucketFileId}/view?project=${project}`;
  }
};

