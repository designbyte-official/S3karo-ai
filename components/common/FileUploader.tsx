"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/features/shared/utils";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { platformStorageService } from "@/features/managed-storage/services/managed-storage.service";
import { s3ExplorerService } from "@/features/private-s3/services/s3-explorer.service";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { useAuthStore } from "@/features/auth/stores/auth-store";

interface Props {
    ownerId: string;
    accountId: string;
    className?: string;
    mode?: "managed" | "private";
}

const FileUploader = ({ ownerId, accountId, className, mode = "managed" }: Props) => {
    const [files, setFiles] = useState<File[]>([]);
    const { toast } = useToast();
    const path = usePathname();
    const router = useRouter();
    const user = useAuthStore((state: any) => state.user);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setFiles(acceptedFiles);

        const uploadPromises = acceptedFiles.map(async (file) => {
            // Pro gating for managed storage
            if (mode === 'managed' && !user?.isPro) {
                return toast({
                    description: "Uploads in Managed Storage are limited to Pro users. Please switch to Own S3 or upgrade.",
                    variant: "destructive",
                });
            }

            try {
                if (mode === 'private') {
                    const config = await s3ConfigService.getConfig(ownerId);
                    if (!config) throw new Error("S3 not configured");

                    await s3ExplorerService.uploadFile({
                        config,
                        file,
                        ownerId,
                        accountId,
                        path: "", // Root for now
                    });
                } else {
                    // Need to implement uploadFile in platformStorageService or use an action
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("ownerId", ownerId);
                    formData.append("accountId", accountId);
                    formData.append("path", path);

                    const res = await fetch("/api/files", {
                        method: "POST",
                        body: formData,
                    });
                    if (!res.ok) throw new Error("Upload failed");
                }

                toast({
                    description: `${file.name} uploaded successfully`,
                    className: "success-toast",
                });
            } catch (error) {
                console.error("Upload error:", error);
                toast({
                    description: `Failed to upload ${file.name}`,
                    variant: "destructive",
                });
            }
        });

        await Promise.all(uploadPromises);
        router.refresh();
    }, [ownerId, accountId, path, router, toast, mode, user]);

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    return (
        <div {...getRootProps()} className={cn("cursor-pointer", className)}>
            <input {...getInputProps()} />
            <Button type="button" className={cn("uploader-button", className)}>
                <Image
                    src="/assets/icons/upload.svg"
                    alt="upload"
                    width={24}
                    height={24}
                />
                <p className="hidden md:block">Upload</p>
            </Button>
        </div>
    );
};

export default FileUploader;
