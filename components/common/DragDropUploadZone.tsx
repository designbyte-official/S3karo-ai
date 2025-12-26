"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/features/shared/utils";
import { Upload, X, File, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { s3ExplorerService } from "@/features/private-s3/services/s3-explorer.service";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { ScrollableDialog } from "@/components/ui/scrollable-dialog";
import { Button } from "@/components/ui/button";
import { convertFileSize } from "@/features/shared/utils";

interface Props {
    ownerId: string;
    accountId: string;
    subPath?: string;
    onUploadComplete?: () => void;
}

interface FileWithStatus {
    file: File;
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress?: number;
    error?: string;
}

const DragDropUploadZone = ({ ownerId, accountId, subPath = "", onUploadComplete }: Props) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [filesToUpload, setFilesToUpload] = useState<FileWithStatus[]>([]);
    const { toast } = useToast();

    // Helper function to create a unique key for a file
    const getFileKey = React.useCallback((file: File): string => {
        // Use name, size, and lastModified to create a unique identifier
        return `${file.name}-${file.size}-${file.lastModified}`;
    }, []);

    // Check if file already exists in the queue
    const isFileDuplicate = React.useCallback((file: File, existingFiles: FileWithStatus[]): boolean => {
        const fileKey = getFileKey(file);
        return existingFiles.some(f => getFileKey(f.file) === fileKey);
    }, [getFileKey]);

    // Use document-level event listeners for drag and drop
    React.useEffect(() => {
        const handleDragEnter = (e: DragEvent) => {
            if (e.dataTransfer?.types.includes('Files')) {
                e.preventDefault();
                console.log('DragDrop: Drag enter on document');
                setIsDragActive(true);
            }
        };

        const handleDragOver = (e: DragEvent) => {
            if (e.dataTransfer?.types.includes('Files')) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const handleDragLeave = (e: DragEvent) => {
            // Only hide if leaving the window
            if (!e.relatedTarget || (e.relatedTarget as HTMLElement) === document.body) {
                console.log('DragDrop: Drag leave from document');
                setIsDragActive(false);
            }
        };

        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('DragDrop: Drop on document');
            setIsDragActive(false);
            
            const files = Array.from(e.dataTransfer?.files || []);
            if (files.length > 0) {
                console.log('DragDrop: Files dropped', files.length);
                
                // Filter out duplicates
                setFilesToUpload(prev => {
                    const uniqueFiles: FileWithStatus[] = [];
                    const duplicateNames: string[] = [];

                    // Check for duplicates
                    files.forEach(file => {
                        const fileKey = getFileKey(file);
                        const isDuplicate = prev.some(f => getFileKey(f.file) === fileKey);

                        if (isDuplicate) {
                            duplicateNames.push(file.name);
                        } else {
                            uniqueFiles.push({
                                file,
                                status: 'pending' as const,
                            });
                        }
                    });

                    // Show toast for duplicates
                    if (duplicateNames.length > 0) {
                        toast({
                            description: `${duplicateNames.length} file${duplicateNames.length > 1 ? 's' : ''} already added: ${duplicateNames.slice(0, 3).join(', ')}${duplicateNames.length > 3 ? '...' : ''}`,
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

        document.addEventListener('dragenter', handleDragEnter);
        document.addEventListener('dragover', handleDragOver);
        document.addEventListener('dragleave', handleDragLeave);
        document.addEventListener('drop', handleDrop);

        return () => {
            document.removeEventListener('dragenter', handleDragEnter);
            document.removeEventListener('dragover', handleDragOver);
            document.removeEventListener('dragleave', handleDragLeave);
            document.removeEventListener('drop', handleDrop);
        };
    }, [getFileKey, toast]);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
        console.log('DragDrop: onDrop called', { acceptedFiles: acceptedFiles.length, rejections: fileRejections.length });
        
        if (fileRejections.length > 0) {
            fileRejections.forEach(({ file, errors }) => {
                toast({
                    description: `${file.name}: ${errors[0].message}`,
                    variant: "destructive",
                });
            });
        }

        if (acceptedFiles.length > 0) {
            console.log('DragDrop: Processing files', acceptedFiles.length);
            
            // Filter out duplicates
            setFilesToUpload(prev => {
                const uniqueFiles: FileWithStatus[] = [];
                const duplicateNames: string[] = [];

                acceptedFiles.forEach(file => {
                    if (isFileDuplicate(file, prev)) {
                        duplicateNames.push(file.name);
                    } else {
                        uniqueFiles.push({
                            file,
                            status: 'pending' as const,
                        });
                    }
                });

                // Show toast for duplicates
                if (duplicateNames.length > 0) {
                    toast({
                        description: `${duplicateNames.length} file${duplicateNames.length > 1 ? 's' : ''} already added: ${duplicateNames.slice(0, 3).join(', ')}${duplicateNames.length > 3 ? '...' : ''}`,
                        variant: "default",
                    });
                }

                // Only add unique files
                if (uniqueFiles.length > 0) {
                    console.log('DragDrop: Adding unique files to queue', uniqueFiles.length);
                    setIsDialogOpen(true);
                    setIsDragActive(false); // Hide drag overlay
                    return [...prev, ...uniqueFiles];
                }

                return prev;
            });
        }
    }, [toast, isFileDuplicate]);

    const handleUpload = useCallback(async () => {
        if (filesToUpload.length === 0) return;

        setIsUploading(true);
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

        // Update all files to uploading status
        setFilesToUpload(prev => prev.map(f => ({ ...f, status: 'uploading' as const, progress: 0 })));

        const uploadPromises = filesToUpload.map(async (fileWithStatus, index) => {
            try {
                console.log('DragDrop: Starting upload:', { fileName: fileWithStatus.file.name, size: fileWithStatus.file.size, path: subPath });

                const result = await s3ExplorerService.uploadFile({
                    config,
                    file: fileWithStatus.file,
                    ownerId,
                    accountId,
                    path: subPath,
                    onProgress: (progress) => {
                        setFilesToUpload(prev => {
                            const updated = [...prev];
                            updated[index] = { ...updated[index], progress };
                            return updated;
                        });
                    },
                });

                console.log('DragDrop: Upload successful:', result);

                // Update to success
                setFilesToUpload(prev => {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], status: 'success' as const, progress: 100 };
                    return updated;
                });

                toast({
                    description: `${fileWithStatus.file.name} uploaded successfully`,
                    className: "success-toast",
                });
            } catch (error) {
                console.error("DragDrop: Upload error:", error);
                
                let errorMessage = 'Unknown error occurred';
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === 'object' && error !== null && 'message' in error) {
                    errorMessage = String((error as any).message);
                }

                // Update to error
                setFilesToUpload(prev => {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], status: 'error' as const, error: errorMessage };
                    return updated;
                });
                
                toast({
                    title: "Upload Failed",
                    description: `Failed to upload ${fileWithStatus.file.name}: ${errorMessage}`,
                    variant: "destructive",
                });
            }
        });

        await Promise.all(uploadPromises);
        setIsUploading(false);
        
        // Call onUploadComplete callback to refresh the file list
        console.log('DragDrop: All uploads complete, calling onUploadComplete');
        onUploadComplete?.();
    }, [filesToUpload, ownerId, accountId, subPath, toast, onUploadComplete]);

    const handleRemoveFile = (index: number) => {
        setFilesToUpload(prev => prev.filter((_, i) => i !== index));
    };

    const handleCloseDialog = () => {
        if (!isUploading) {
            setIsDialogOpen(false);
            setFilesToUpload([]);
        }
    };

    const { getRootProps, getInputProps, isDragActive: dropzoneActive, open } = useDropzone({
        onDrop,
        maxSize: 50 * 1024 * 1024,
        noClick: true, // Don't open file dialog on click - we'll handle it manually
        onDragEnter: (e) => {
            console.log('DragDrop: Drag enter');
            setIsDragActive(true);
        },
        onDragOver: (e) => {
            e.preventDefault();
        },
        onDragLeave: (e) => {
            console.log('DragDrop: Drag leave');
            // Check if we're leaving the dropzone area
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (!relatedTarget) {
                setIsDragActive(false);
            }
        },
        multiple: true,
        accept: undefined, // Accept all file types
    });

    const pendingFiles = filesToUpload.filter(f => f.status === 'pending');
    const uploadingFiles = filesToUpload.filter(f => f.status === 'uploading');
    const successFiles = filesToUpload.filter(f => f.status === 'success');
    const errorFiles = filesToUpload.filter(f => f.status === 'error');
    const allComplete = filesToUpload.length > 0 && filesToUpload.every(f => f.status === 'success' || f.status === 'error');

    return (
        <>
            {/* Full-page drag overlay - shows when dragging */}
            {isDragActive && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-12 shadow-2xl border-4 border-dashed border-brand max-w-2xl mx-4 animate-pulse">
                        <div className="flex flex-col items-center gap-6 text-center">
                            <div className="p-6 bg-brand/10 rounded-full">
                                <Upload size={64} className="text-brand" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-dark-100 mb-2">Drop files here</h3>
                                <p className="text-lg text-light-100">
                                    Upload to: <span className="font-semibold text-brand">{subPath || "Root"}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Dialog */}
            <ScrollableDialog
                open={isDialogOpen}
                onOpenChange={handleCloseDialog}
                title={`Upload Files${filesToUpload.length > 0 ? ` (${filesToUpload.length})` : ''}`}
                fullScreen={true}
                footer={
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm text-slate-600">
                            {pendingFiles.length > 0 && <span className="text-blue-600">{pendingFiles.length} pending</span>}
                            {uploadingFiles.length > 0 && <span className="text-orange-600 ml-2">{uploadingFiles.length} uploading</span>}
                            {successFiles.length > 0 && <span className="text-green-600 ml-2">{successFiles.length} success</span>}
                            {errorFiles.length > 0 && <span className="text-red-600 ml-2">{errorFiles.length} failed</span>}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                onClick={handleCloseDialog}
                                disabled={isUploading}
                            >
                                {allComplete ? 'Close' : 'Cancel'}
                            </Button>
                            {pendingFiles.length > 0 && (
                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="bg-brand hover:bg-brand/90 text-white"
                                >
                                    {isUploading ? 'Uploading...' : `Upload ${pendingFiles.length} File${pendingFiles.length > 1 ? 's' : ''}`}
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
                        className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-brand/50 transition-colors cursor-pointer bg-slate-50"
                        onClick={(e) => {
                            // Allow clicking to open file picker
                            e.stopPropagation();
                        }}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-4 pointer-events-none">
                            <div className="p-4 bg-brand/10 rounded-full">
                                <Upload size={32} className="text-brand" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-slate-800">Drag & drop files here</p>
                                <p className="text-sm text-slate-500 mt-1">or click to browse</p>
                            </div>
                            <p className="text-xs text-slate-400">
                                Upload to: <span className="font-semibold text-brand">{subPath || "Root"}</span>
                            </p>
                        </div>
                    </div>

                    {/* Files list */}
                    {filesToUpload.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-slate-800">Files to Upload</h3>
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                {filesToUpload.map((fileWithStatus, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                                    >
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <File size={20} className="text-slate-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{fileWithStatus.file.name}</p>
                                            <p className="text-sm text-slate-500">{convertFileSize(fileWithStatus.file.size)}</p>
                                            {fileWithStatus.status === 'uploading' && fileWithStatus.progress !== undefined && (
                                                <div className="mt-2">
                                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                                        <div
                                                            className="bg-brand h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${fileWithStatus.progress}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">{fileWithStatus.progress}%</p>
                                                </div>
                                            )}
                                            {fileWithStatus.status === 'error' && fileWithStatus.error && (
                                                <p className="text-sm text-red-600 mt-1">{fileWithStatus.error}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {fileWithStatus.status === 'success' && (
                                                <CheckCircle2 size={20} className="text-green-600" />
                                            )}
                                            {fileWithStatus.status === 'error' && (
                                                <X size={20} className="text-red-600" />
                                            )}
                                            {fileWithStatus.status === 'pending' && !isUploading && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveFile(index)}
                                                    className="h-8 w-8"
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
            <div 
                className="fixed bottom-6 right-6 z-40 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-2 border-dashed border-brand/30 hover:border-brand/60 transition-all cursor-pointer group pointer-events-auto"
                title="Click to select files or drag and drop files anywhere on the page"
                onClick={(e) => {
                    e.stopPropagation();
                    open();
                }}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand/10 rounded-lg group-hover:bg-brand/20 transition-colors">
                        <Upload size={20} className="text-brand" />
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-semibold text-dark-100">Drag & Drop</p>
                        <p className="text-xs text-light-200">Files anywhere</p>
                    </div>
                </div>
            </div>

            {/* Hidden dropzone for file picker functionality (when clicking the button) */}
            <div {...getRootProps()} style={{ display: 'none' }}>
                <input {...getInputProps()} />
            </div>
        </>
    );
};

export default DragDropUploadZone;
