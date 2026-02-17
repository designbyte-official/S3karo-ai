import { useState, useCallback } from "react";

import { toast } from "sonner";

export interface UploadFile {
  name: string;
  type: string;
  size: number;
  file: File;
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

export interface UploadOptions {
  path?: string;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onUploadProgress?: (progress: number) => void;
  onSuccess?: (file: UploadResponse) => void;
  onError?: (error: Error) => void;
}

// Hook for direct S3 uploads
export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = useCallback(async (file: File, options: UploadOptions = {}): Promise<UploadResponse | undefined> => {
    const {
      path = "",
      maxFileSize,
      allowedFileTypes,
      onUploadProgress,
      onSuccess,
      onError,
    } = options;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const presignedResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
          path,
          route: {
            maxFileSize,
            allowedFileTypes,
          },
        }),
      });

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json();
        throw new Error(error.message || "Failed to get presigned URL");
      }

      const presignedData: UploadResponse = await presignedResponse.json();
      const { url: presignedUrl, key, metadata } = presignedData;

      // Step 2: Upload directly to S3 using presigned URL with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
            onUploadProgress?.(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            onUploadProgress?.(100);
            resolve();
          } else {
            reject(new Error("Failed to upload file to S3"));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload aborted"));
        });

        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.send(file);
      });

      const callbackResponse = await fetch("/api/upload/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key,
          fileName: metadata.fileName,
          fileType: metadata.fileType,
          fileSize: metadata.fileSize,
          path: metadata.path,
        }),
      });

      if (!callbackResponse.ok) {
        const error = await callbackResponse.json();
        throw new Error(error.message || "Failed to save file metadata");
      }

      const fileData = await callbackResponse.json();

      // Success
      onSuccess?.(fileData);
      toast.success(`File "${file.name}" uploaded successfully`);

      return fileData;
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      toast.error(errorMessage);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const uploadMultiple = useCallback(
    async (files: File[], options: UploadOptions = {}): Promise<(UploadResponse | undefined)[]> => {
      const results = await Promise.allSettled(files.map((file) => upload(file, options)));

      const successful = results
        .filter((r): r is PromiseFulfilledResult<UploadResponse | undefined> => r.status === "fulfilled")
        .map((r) => r.value);

      const failed = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected"
      ).length;

      if (failed > 0) {
        toast.warning(`${failed} file(s) failed to upload`);
      }

      return successful;
    },
    [upload]
  );

  return {
    upload,
    uploadMultiple,
    isUploading,
    uploadProgress,
  };
}
