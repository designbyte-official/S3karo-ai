import { useState } from "react";

import { useRouter, usePathname } from "next/navigation";

import { platformStorageService } from "@/features/managed-storage/services/managed-storage.service";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { s3ExplorerService } from "@/features/private-s3/services/s3-explorer.service";
import { useToast } from "@/hooks/use-toast";
import { S3File } from "@/types/file";

export const useFileActions = (file: S3File, user: any) => {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const path = usePathname();
    const { toast } = useToast();

    const isPrivateS3 = path.includes('/private/explorer');
    const storageMode = isPrivateS3 ? 'own-s3' : 'managed-storage';

    const handleRename = async (newName: string, onSuccess: () => void) => {
        if (!user) return;

        // Pro gating for managed storage destructive actions
        if (!isPrivateS3 && !user?.isPro) {
            toast({
                description: "Modifying files in Managed Storage is limited to Pro users. Please switch to Own S3 or upgrade.",
                variant: "destructive",
            });
            onSuccess(); // Close modal
            return;
        }

        setIsLoading(true);
        try {
            const nameParts = newName.split('.');
            const extension = nameParts.length > 1 ? nameParts.pop() || '' : file.extension || '';
            const nameWithoutExt = nameParts.join('.');

            if (storageMode === 'own-s3') {
                const config = await s3ConfigService.getConfig(user.$id);
                if (!config) {
                    toast({
                        description: "Please configure your S3 credentials first",
                        className: "error-toast",
                    });
                    return;
                }
                const pathParts = (file.bucketFileId || file.$id).split('/');
                pathParts[pathParts.length - 1] = `${nameWithoutExt}.${extension}`;
                const newKey = pathParts.join('/');

                const metadata = await s3ExplorerService.head(config, file.bucketFileId || file.$id);
                await s3ExplorerService.rename(config, file.bucketFileId || file.$id, newKey, metadata.metadata);
            } else {
                await platformStorageService.renameFile({
                    fileId: file.$id,
                    name: nameWithoutExt,
                    extension,
                    path,
                });
            }

            toast({
                title: "File Renamed",
                description: "The file has been successfully renamed.",
                className: "success-toast",
            });
            onSuccess();
            router.refresh();
        } catch (error) {
            console.error('Rename error:', error);
            toast({
                description: "Failed to rename file",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (onSuccess: () => void) => {
        if (!user) return;

        if (!isPrivateS3 && !user?.isPro) {
            toast({
                description: "Deleting files in Managed Storage is limited to Pro users.",
                variant: "destructive",
            });
            onSuccess();
            return;
        }

        setIsLoading(true);
        try {
            if (storageMode === 'own-s3') {
                const config = await s3ConfigService.getConfig(user.$id);
                if (!config) {
                    toast({
                        description: "Please configure your S3 credentials first",
                        className: "error-toast",
                    });
                    return;
                }
                await s3ExplorerService.delete(config, file.bucketFileId || file.$id);
            } else {
                await platformStorageService.deleteFile({ fileId: file.$id, path });
            }

            toast({
                title: "File Deleted",
                description: "The file has been permanently removed.",
                className: "success-toast",
            });
            onSuccess();
            router.refresh();
        } catch (error) {
            console.error('Delete error:', error);
            toast({
                description: "Failed to delete file",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!user) return;
        try {
            let url;
            if (isPrivateS3) {
                const config = await s3ConfigService.getConfig(user.$id);
                if (!config) {
                    toast({
                        description: "Please configure your S3 credentials first",
                        className: "error-toast",
                    });
                    return;
                }
                url = await s3ExplorerService.getSignedUrl(config, file.bucketFileId || file.$id);
            } else {
                url = await platformStorageService.getDownloadUrl(file.bucketFileId || file.$id || file.key || '');
            }
            if (url) window.open(url, '_blank');
        } catch (error) {
            console.error('Download error:', error);
            toast({
                description: "Failed to download file",
                variant: "destructive",
            });
        }
    };

    const handleShare = async (emails: string[], onSuccess: () => void) => {
        if (storageMode !== 'managed-storage') return;

        setIsLoading(true);
        try {
            await platformStorageService.shareFile({ fileId: file.$id, emails, path });
            toast({
                title: "File Shared",
                description: "Access has been updated.",
                className: "success-toast",
            });
            onSuccess();
        } catch (error) {
            console.error('Share error:', error);
            toast({
                description: "Failed to share file",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        isPrivateS3,
        handleRename,
        handleDelete,
        handleDownload,
        handleShare
    };
};
