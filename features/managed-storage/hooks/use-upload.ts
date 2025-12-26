import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface UploadFile {
  name: string;
  type: string;
  size: number;
  file: File;
}

export interface UploadOptions {
  path?: string;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onUploadProgress?: (progress: number) => void;
  onSuccess?: (file: any) => void;
  onError?: (error: Error) => void;
}

export interface UploadResponse {
  url: string;
  key: string;
  expiresIn: number;
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
    path: string;
  };
}

/**
 * S3-Karo React hook for file uploads
 * 
 * Usage:
 * const { upload, isUploading } = useUpload();
 * 
 * await upload(file, {
 *   path: 'documents/2024/',
 *   onUploadProgress: (progress) => console.log(progress),
 *   onSuccess: (file) => console.log('Uploaded:', file),
 * });
 */
export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<any> => {
    const {
      path = '',
      maxFileSize,
      allowedFileTypes,
      onUploadProgress,
      onSuccess,
      onError,
    } = options;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Request presigned URL from server
      const presignedResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          path: path,
          route: {
            maxFileSize,
            allowedFileTypes,
          },
        }),
      });

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json();
        throw new Error(error.message || 'Failed to get presigned URL');
      }

      const presignedData: UploadResponse = await presignedResponse.json();
      const { url: presignedUrl, key, metadata } = presignedData;

      // Step 2: Upload directly to S3 using presigned URL with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
            onUploadProgress?.(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            onUploadProgress?.(100);
            resolve();
          } else {
            reject(new Error('Failed to upload file to S3'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      // Step 3: Call callback endpoint to save metadata
      const callbackResponse = await fetch('/api/upload/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: key,
          fileName: metadata.fileName,
          fileType: metadata.fileType,
          fileSize: metadata.fileSize,
          path: metadata.path,
        }),
      });

      if (!callbackResponse.ok) {
        const error = await callbackResponse.json();
        throw new Error(error.message || 'Failed to save file metadata');
      }

      const fileData = await callbackResponse.json();

      // Success
      onSuccess?.(fileData);
      toast.success(`File "${file.name}" uploaded successfully`);

      return fileData;

    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Upload failed';
      toast.error(errorMessage);
      onError?.(error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const uploadMultiple = useCallback(async (
    files: File[],
    options: UploadOptions = {}
  ): Promise<any[]> => {
    const results = await Promise.allSettled(
      files.map(file => upload(file, options))
    );

    const successful = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .length;

    if (failed > 0) {
      toast.warning(`${failed} file(s) failed to upload`);
    }

    return successful;
  }, [upload]);

  return {
    upload,
    uploadMultiple,
    isUploading,
    uploadProgress,
  };
}

