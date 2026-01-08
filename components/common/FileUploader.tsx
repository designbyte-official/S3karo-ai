"use client";

import React, { useCallback, useState } from "react";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useUpload } from "@/features/managed-storage/hooks/use-upload";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { s3ExplorerService } from "@/features/private-s3/services/s3-explorer.service";
import { cn } from "@/features/shared/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
    ownerId: string;
    accountId: string;
    className?: string;
    mode?: "managed" | "private";
    path?: string;
}

const FileUploader = ({ ownerId, accountId, className, mode = "managed", path: uploadPath = "" }: Props) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();
    const path = usePathname();
    const router = useRouter();
    const user = useAuthStore((state: any) => state.user);
    const isPro = useAuthStore((state: any) => state.isPro);
    const { upload: uploadFile } = useUpload(); // For managed storage direct uploads

    const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any[]) => {
        // Handle rejections (e.g. file too large)
        if (fileRejections.length > 0) {
            fileRejections.forEach(({ file, errors }) => {
                toast({
                    description: `${file.name}: ${errors[0].message}`,
                    variant: "destructive",
                });
            });
            return;
        }

        setFiles(acceptedFiles);
        setIsUploading(true);

        const uploadPromises = acceptedFiles.map(async (file) => {
            // Pro gating for managed storage
            if (mode === 'managed' && !isPro) {
                return toast({
                    description: "Uploads in Managed Storage are limited to Pro users. Please switch to Own S3 or upgrade.",
                    variant: "destructive",
                });
            }

            try {
                if (mode === 'private') {
                    const config = await s3ConfigService.getConfig(ownerId);
                    if (!config) {
                        throw new Error("S3 not configured. Please configure your bucket first.");
                    }

                    // console.log('Starting upload:', { fileName: file.name, size: file.size, path: uploadPath });

                    const result = await s3ExplorerService.uploadFile({
                        config,
                        file,
                        ownerId,
                        accountId,
                        path: uploadPath,
                        onProgress: (progress) => {
                            // console.log(`Upload progress for ${file.name}: ${progress}%`);
                        },
                    });

                    // console.log('Upload successful:', result);
                } else {
                    // Managed storage - use direct S3 upload with presigned URLs
                    await uploadFile(file, {
                        path: uploadPath,
                        onSuccess: (fileData) => {
                            // console.log('Managed storage upload success:', fileData);
                        },
                        onError: (error) => {
                            throw error;
                        },
                    });
                }

                toast({
                    description: `${file.name} uploaded successfully`,
                    className: "success-toast",
                });
            } catch (error) {
                console.error("Upload error:", error);

                // Extract user-friendly error message
                let errorMessage = 'Unknown error occurred';
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === 'object' && error !== null && 'message' in error) {
                    errorMessage = String((error as any).message);
                }

                toast({
                    title: "Upload Failed",
                    description: `Failed to upload ${file.name}: ${errorMessage}`,
                    variant: "destructive",
                });
            }
        });

        await Promise.all(uploadPromises);
        setIsUploading(false);
        setFiles([]);

        // Force refresh the page to show new files
        // Use setTimeout to ensure upload completes before refresh
        setTimeout(() => {
            router.refresh();
            // Also trigger a window reload if router.refresh doesn't work
            if (mode === 'private') {
                window.location.reload();
            }
        }, 500);
    }, [ownerId, accountId, path, router, toast, mode, user, isPro]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        maxSize: 50 * 1024 * 1024, // 50MB limit
    });

    return (
        <div {...getRootProps()} className={cn("cursor-pointer", className)}>
            <input {...getInputProps()} />
            <Button type="button" disabled={isUploading} className={cn("uploader-button", className, isUploading && "opacity-50 cursor-not-allowed")}>
                <Image
                    src="/assets/icons/upload.svg"
                    alt="upload"
                    width={24}
                    height={24}
                    className={isUploading ? "animate-pulse" : ""}
                />
                <p className="hidden md:block">{isUploading ? "Uploading..." : "Upload"}</p>
            </Button>
        </div>
    );
};

export default FileUploader;
