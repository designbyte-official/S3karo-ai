"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/features/shared/utils";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { s3ExplorerService } from "@/features/private-s3/services/s3-explorer.service";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";

interface Props {
    ownerId: string;
    accountId: string;
    subPath?: string;
    onUploadComplete?: () => void;
}

const DragDropUploadZone = ({ ownerId, accountId, subPath = "", onUploadComplete }: Props) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const { toast } = useToast();

    const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
        if (fileRejections.length > 0) {
            fileRejections.forEach(({ file, errors }) => {
                toast({
                    description: `${file.name}: ${errors[0].message}`,
                    variant: "destructive",
                });
            });
            return;
        }

        setIsUploading(true);

        const uploadPromises = acceptedFiles.map(async (file) => {
            try {
                const config = await s3ConfigService.getConfig(ownerId);
                if (!config) throw new Error("S3 not configured");

                await s3ExplorerService.uploadFile({
                    config,
                    file,
                    ownerId,
                    accountId,
                    path: subPath,
                });

                toast({
                    description: `${file.name} uploaded successfully`,
                    className: "success-toast",
                });
            } catch (error) {
                console.error("Upload error:", error);
                toast({
                    description: `Failed to upload ${file.name}: ${(error as Error).message}`,
                    variant: "destructive",
                });
            }
        });

        await Promise.all(uploadPromises);
        setIsUploading(false);
        onUploadComplete?.();
    }, [ownerId, accountId, subPath, toast, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
        onDrop,
        maxSize: 50 * 1024 * 1024,
        noClick: true,
        onDragEnter: () => setIsDragActive(true),
        onDragLeave: () => setIsDragActive(false),
    });

    return (
        <>
            {/* Full-page drag overlay */}
            {isDragActive && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-12 shadow-2xl border-4 border-dashed border-brand max-w-2xl mx-4">
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

            {/* Invisible dropzone covering the entire page */}
            <div {...getRootProps()} className="fixed inset-0 pointer-events-none z-40">
                <input {...getInputProps()} />
            </div>
        </>
    );
};

export default DragDropUploadZone;
