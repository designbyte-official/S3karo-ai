"use client";

import React, { useCallback, useState } from "react";

import { Upload, X, File, CheckCircle2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useDropzone, FileRejection } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { ScrollableDialog } from "@/components/ui/scrollable-dialog";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useUpload } from "@/features/managed-storage/hooks/use-upload";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { s3ExplorerService } from "@/features/private-s3/services/s3-explorer.service";
import { maybeCompressImage } from "@/features/shared/compression";
import { convertFileSize } from "@/features/shared/utils";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  ownerId: string;
  accountId: string;
  subPath?: string;
  onUploadComplete?: () => void;
  mode?: "private" | "managed"; // Support both storage modes
}

interface FileWithStatus {
  file: File;
  status: "pending" | "uploading" | "success" | "error" | "paused";
  progress?: number;
  error?: string;
  canResume?: boolean;
  chunkInfo?: { current: number; total: number };
}

const DragDropUploadZone = ({
  ownerId,
  accountId,
  subPath = "",
  onUploadComplete,
  mode = "private",
}: Props) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<FileWithStatus[]>([]);
  const [compressImages, setCompressImages] = useState(false);
  const { toast } = useToast();
  const isPro = useAuthStore((state) => state.isPro);
  const { upload: uploadFile } = useUpload(); // For managed storage direct uploads

  // Helper function to create a unique key for a file
  const getFileKey = React.useCallback((file: File): string => {
    // Use name, size, and lastModified to create a unique identifier
    return `${file.name}-${file.size}-${file.lastModified}`;
  }, []);

  // Check if file already exists in the queue
  const isFileDuplicate = React.useCallback(
    (file: File, existingFiles: FileWithStatus[]): boolean => {
      const fileKey = getFileKey(file);
      return existingFiles.some((f) => getFileKey(f.file) === fileKey);
    },
    [getFileKey]
  );

  // Use document-level event listeners for drag and drop
  React.useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) {
        e.preventDefault();
        setIsDragActive(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      if (!e.relatedTarget || (e.relatedTarget as HTMLElement) === document.body) {
        setIsDragActive(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        // Filter out duplicates
        setFilesToUpload((prev) => {
          const uniqueFiles: FileWithStatus[] = [];
          const duplicateNames: string[] = [];

          // Check for duplicates
          files.forEach((file) => {
            const fileKey = getFileKey(file);
            const isDuplicate = prev.some((f) => getFileKey(f.file) === fileKey);

            if (isDuplicate) {
              duplicateNames.push(file.name);
            } else {
              uniqueFiles.push({
                file,
                status: "pending" as const,
              });
            }
          });

          // Show toast for duplicates
          if (duplicateNames.length > 0) {
            toast({
              description: `${duplicateNames.length} file${duplicateNames.length > 1 ? "s" : ""} already added: ${duplicateNames.slice(0, 3).join(", ")}${duplicateNames.length > 3 ? "..." : ""}`,
              variant: "default",
            });
          }

          // Only add unique files
          if (uniqueFiles.length > 0) {
            setIsDialogOpen(true);
            return [...prev, ...uniqueFiles];
          }

          return prev;
        });
      }
    };

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("drop", handleDrop);
    };
  }, [getFileKey, toast]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        fileRejections.forEach(({ file, errors }) => {
          toast({
            description: `${file.name}: ${errors[0].message}`,
            variant: "destructive",
          });
        });
      }

      if (acceptedFiles.length > 0) {
        // Filter out duplicates
        setFilesToUpload((prev) => {
          const uniqueFiles: FileWithStatus[] = [];
          const duplicateNames: string[] = [];

          acceptedFiles.forEach((file) => {
            if (isFileDuplicate(file, prev)) {
              duplicateNames.push(file.name);
            } else {
              uniqueFiles.push({
                file,
                status: "pending" as const,
              });
            }
          });

          // Show toast for duplicates
          if (duplicateNames.length > 0) {
            toast({
              description: `${duplicateNames.length} file${duplicateNames.length > 1 ? "s" : ""} already added: ${duplicateNames.slice(0, 3).join(", ")}${duplicateNames.length > 3 ? "..." : ""}`,
              variant: "default",
            });
          }

          if (uniqueFiles.length > 0) {
            setIsDialogOpen(true);
            setIsDragActive(false); // Hide drag overlay
            return [...prev, ...uniqueFiles];
          }

          return prev;
        });
      }
    },
    [toast, isFileDuplicate]
  );

  const handleUpload = useCallback(async () => {
    // Get current state snapshot to avoid stale closures
    let currentFilesState: FileWithStatus[] = [];
    setFilesToUpload((prev) => {
      currentFilesState = prev;
      return prev;
    });

    if (currentFilesState.length === 0) return;

    setIsUploading(true);

    // For private S3, check configuration (no Pro required)
    if (mode === "private") {
      const config = await s3ConfigService.getConfig(ownerId);
      if (!config) {
        toast({
          title: "Configuration Error",
          description: "S3 not configured. Please configure your bucket first.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }
    }

    // Check Pro subscription ONLY for managed storage
    if (mode === "managed" && !isPro) {
      toast({
        title: "Pro Subscription Required",
        description:
          "Uploads in Managed Storage require a Pro subscription. Please upgrade or switch to Private S3.",
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }

    // Update all pending files to uploading status
    setFilesToUpload((prev) =>
      prev.map((f) =>
        f.status === "pending" ? { ...f, status: "uploading" as const, progress: 0 } : f
      )
    );

    // Upload files sequentially to avoid overwhelming the network
    // Process files that are pending or paused
    const filesToProcess = currentFilesState
      .map((f, idx) => ({ file: f, index: idx }))
      .filter(({ file }) => file.status === "pending" || file.status === "paused");

    for (const { file: fileWithStatus, index } of filesToProcess) {
      try {
        const fileToUpload = await maybeCompressImage(fileWithStatus.file, {
          compress: compressImages,
        });
        let result;

        if (mode === "private") {
          const config = await s3ConfigService.getConfig(ownerId);
          if (!config) {
            throw new Error("S3 not configured. Please configure your bucket first.");
          }

          result = await s3ExplorerService.uploadFile({
            config,
            file: fileToUpload,
            ownerId,
            accountId,
            path: subPath,
            resume: fileWithStatus.status === "paused", // Resume if paused
            onProgress: (progress) => {
              setFilesToUpload((prev) => {
                const updated = [...prev];
                updated[index] = { ...updated[index], progress };
                return updated;
              });
            },
            onChunkProgress: (chunkNumber, totalChunks) => {
              setFilesToUpload((prev) => {
                const updated = [...prev];
                updated[index] = {
                  ...updated[index],
                  chunkInfo: { current: chunkNumber, total: totalChunks },
                };
                return updated;
              });
            },
          });
        } else {
          // Managed storage upload - use direct S3 upload with presigned URLs
          result = await uploadFile(fileToUpload, {
            path: subPath,
            onUploadProgress: (progress) => {
              setFilesToUpload((prev) => {
                const updated = [...prev];
                updated[index] = { ...updated[index], progress };
                return updated;
              });
            },
            onSuccess: (_fileData) => { },
            onError: (error) => {
              throw error;
            },
          });
        }

        // Update to success
        setFilesToUpload((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            status: "success" as const,
            progress: 100,
            chunkInfo: undefined,
          };
          return updated;
        });

        toast({
          description: `${fileToUpload.name} uploaded successfully`,
          className: "success-toast",
        });
      } catch (error) {
        console.error("DragDrop: Upload error:", error);

        let errorMessage = "Unknown error occurred";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === "object" && error !== null && "message" in error) {
          errorMessage = String((error as { message: unknown }).message);
        }

        // Check if it's a network error (can be resumed)
        const isNetworkError =
          errorMessage.toLowerCase().includes("network") ||
          errorMessage.toLowerCase().includes("timeout") ||
          errorMessage.toLowerCase().includes("connection");

        // Update to error or paused (if resumable)
        setFilesToUpload((prev) => {
          const updated = [...prev];
          const fileSize = fileWithStatus.file.size;
          const isLargeFile = fileSize >= 100 * 1024 * 1024; // 100MB+

          updated[index] = {
            ...updated[index],
            status: isNetworkError && isLargeFile ? ("paused" as const) : ("error" as const),
            error: errorMessage,
            canResume: isNetworkError && isLargeFile,
          };
          return updated;
        });

        toast({
          title:
            isNetworkError && fileWithStatus.file.size >= 100 * 1024 * 1024
              ? "Upload Paused"
              : "Upload Failed",
          description: `${fileWithStatus.file.name}: ${errorMessage}${isNetworkError && fileWithStatus.file.size >= 100 * 1024 * 1024 ? " (You can resume this upload)" : ""}`,
          variant:
            isNetworkError && fileWithStatus.file.size >= 100 * 1024 * 1024
              ? "default"
              : "destructive",
        });
      }
    }

    setIsUploading(false);

    onUploadComplete?.();
  }, [filesToUpload, ownerId, accountId, subPath, toast, onUploadComplete, mode, isPro, compressImages]);

  const handleRemoveFile = (index: number) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResumeUpload = (index: number) => {
    setFilesToUpload((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: "pending" as const };
      return updated;
    });
    // Trigger upload
    handleUpload();
  };

  const handleCloseDialog = () => {
    if (!isUploading) {
      setIsDialogOpen(false);
      setFilesToUpload([]);
    }
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive: dropzoneActive,
    open,
  } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024,
    noClick: true, // Don't open file dialog on click - we'll handle it manually
    onDragEnter: (e) => {
      setIsDragActive(true);
    },
    onDragOver: (e) => {
      e.preventDefault();
    },
    onDragLeave: (e) => {
      // console.log('DragDrop: Drag leave');
      // Check if we're leaving the dropzone area
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (!relatedTarget) {
        setIsDragActive(false);
      }
    },
    multiple: true,
    accept: undefined, // Accept all file types
  });

  const pendingFiles = filesToUpload.filter((f) => f.status === "pending" || f.status === "paused");
  const uploadingFiles = filesToUpload.filter((f) => f.status === "uploading");
  const successFiles = filesToUpload.filter((f) => f.status === "success");
  const errorFiles = filesToUpload.filter((f) => f.status === "error");
  const pausedFiles = filesToUpload.filter((f) => f.status === "paused");
  const allComplete =
    filesToUpload.length > 0 &&
    filesToUpload.every((f) => f.status === "success" || f.status === "error");

  return (
    <>
      {/* Full-page drag overlay - shows when dragging */}
      {isDragActive &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="mx-4 max-w-2xl animate-pulse rounded-3xl border-4 border-dashed border-brand bg-white p-12 shadow-2xl">
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="rounded-full bg-brand/10 p-6">
                  <Upload size={64} className="text-brand" />
                </div>
                <div>
                  <h3 className="mb-2 text-3xl font-bold text-dark-100">Drop files here</h3>
                  <p className="text-lg text-light-100">
                    Upload to: <span className="font-semibold text-brand">{subPath || "Root"}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Upload Dialog */}
      <ScrollableDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        title={`Upload Files${filesToUpload.length > 0 ? ` (${filesToUpload.length})` : ""}`}
        fullScreen={false}
        className="!m-0 !h-[95vh] !max-h-[95vh] !w-[95%] !max-w-[700px]"
        footer={
          <div className="flex w-full items-center justify-between">
            <div className="text-sm text-slate-600">
              {pendingFiles.length > pausedFiles.length && (
                <span className="text-blue-600">
                  {pendingFiles.length - pausedFiles.length} pending
                </span>
              )}
              {pausedFiles.length > 0 && (
                <span className="ml-2 text-orange-600">{pausedFiles.length} paused</span>
              )}
              {uploadingFiles.length > 0 && (
                <span className="ml-2 text-orange-600">{uploadingFiles.length} uploading</span>
              )}
              {successFiles.length > 0 && (
                <span className="ml-2 text-green-600">{successFiles.length} success</span>
              )}
              {errorFiles.length > 0 && (
                <span className="ml-2 text-red-600">{errorFiles.length} failed</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleCloseDialog} disabled={isUploading}>
                {allComplete ? "Close" : "Cancel"}
              </Button>
              {pendingFiles.length > 0 && (
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-brand text-white hover:bg-brand/90"
                >
                  {isUploading
                    ? "Uploading..."
                    : `Upload ${pendingFiles.length} File${pendingFiles.length > 1 ? "s" : ""}`}
                </Button>
              )}
              {pausedFiles.length > 0 && !isUploading && (
                <Button
                  onClick={handleUpload}
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  Resume {pausedFiles.length} Paused
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="w-full space-y-4">
          {/* Drop zone inside dialog */}
          <div
            {...getRootProps()}
            className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center transition-colors hover:border-brand/50"
            onClick={(e) => {
              // Allow clicking to open file picker
              e.stopPropagation();
            }}
          >
            <input {...getInputProps()} />
            <div className="pointer-events-none flex flex-col items-center gap-4">
              <div className="rounded-full bg-brand/10 p-4">
                <Upload size={32} className="text-brand" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-800">Drag & drop files here</p>
                <p className="mt-1 text-sm text-slate-500">or click to browse</p>
              </div>
              <p className="text-xs text-slate-400">
                Upload to: <span className="font-semibold text-brand">{subPath || "Root"}</span>
              </p>
            </div>
          </div>

          {/* Compression option - user can choose to compress images before upload */}
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300">
            <Checkbox
              checked={compressImages}
              onCheckedChange={(checked) => setCompressImages(checked === true)}
              className="border-slate-400"
            />
            <span className="text-sm text-slate-700">Compress images before upload</span>
          </label>

          {/* Files list */}
          {filesToUpload.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">Files to Upload</h3>
              <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-2">
                {filesToUpload.map((fileWithStatus, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
                  >
                    <div className="rounded-lg bg-slate-100 p-2">
                      <File size={20} className="text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">
                        {fileWithStatus.file.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {convertFileSize(fileWithStatus.file.size)}
                      </p>
                      {fileWithStatus.status === "uploading" &&
                        fileWithStatus.progress !== undefined && (
                          <div className="mt-2">
                            <div className="h-2 w-full rounded-full bg-slate-200">
                              <div
                                className="h-2 rounded-full bg-brand transition-all duration-300"
                                style={{ width: `${fileWithStatus.progress}%` }}
                              />
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              <p className="text-xs text-slate-500">{fileWithStatus.progress}%</p>
                              {fileWithStatus.chunkInfo && (
                                <p className="text-xs text-slate-400">
                                  Chunk {fileWithStatus.chunkInfo.current}/
                                  {fileWithStatus.chunkInfo.total}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      {(fileWithStatus.status === "error" || fileWithStatus.status === "paused") &&
                        fileWithStatus.error && (
                          <div className="mt-1">
                            <p
                              className={`text-sm ${fileWithStatus.status === "paused" ? "text-orange-600" : "text-red-600"}`}
                            >
                              {fileWithStatus.error}
                            </p>
                            {fileWithStatus.canResume && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResumeUpload(index)}
                                className="mt-2 text-xs"
                                disabled={isUploading}
                              >
                                Resume Upload
                              </Button>
                            )}
                          </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      {fileWithStatus.status === "success" && (
                        <CheckCircle2 size={20} className="text-green-600" />
                      )}
                      {fileWithStatus.status === "error" && (
                        <X size={20} className="text-red-600" />
                      )}
                      {fileWithStatus.status === "pending" && !isUploading && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFile(index)}
                          className="size-8"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollableDialog>

      {/* Visible dropzone hint in bottom-right corner - clickable to open file picker */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            className="group pointer-events-auto fixed bottom-6 right-6 z-[9998] cursor-pointer rounded-2xl border-2 border-dashed border-brand/30 bg-white/90 p-4 shadow-lg backdrop-blur-sm transition-all hover:border-brand/60"
            title="Click to select files or drag and drop files anywhere on the page"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-brand/10 p-2 transition-colors group-hover:bg-brand/20">
                <Upload size={20} className="text-brand" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-dark-100">Drag & Drop</p>
                <p className="text-xs text-light-200">Files anywhere</p>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Hidden dropzone for file picker functionality (when clicking the button) */}
      <div {...getRootProps()} style={{ display: "none" }}>
        <input {...getInputProps()} />
      </div>
    </>
  );
};

export default DragDropUploadZone;
