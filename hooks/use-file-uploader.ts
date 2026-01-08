import { useCallback, useState } from "react";

import { useRouter } from "next/navigation";

import { FileRejection } from "react-dropzone";

import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useUpload } from "@/features/managed-storage/hooks/use-upload";
import { s3ConfigService } from "@/features/private-s3/services/s3-config.service";
import { s3ExplorerService } from "@/features/private-s3/services/s3-explorer.service";
import { useToast } from "@/hooks/use-toast";

export const useFileUploader = (
  ownerId: string,
  accountId: string,
  mode: "managed" | "private" = "managed",
  uploadPath: string = ""
) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const isPro = useAuthStore((state) => state.isPro);
  const { upload: uploadManagedFile } = useUpload();

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
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
        if (mode === "managed" && !isPro) {
          toast({
            description:
              "Uploads in Managed Storage are limited to Pro users. Please switch to Own S3 or upgrade.",
            variant: "destructive",
          });
          return;
        }

        try {
          if (mode === "private") {
            const config = await s3ConfigService.getConfig(ownerId);
            if (!config) {
              throw new Error("S3 not configured. Please configure your bucket first.");
            }

            await s3ExplorerService.uploadFile({
              config,
              file,
              ownerId,
              accountId,
              path: uploadPath,
            });
          } else {
            await uploadManagedFile(file, {
              path: uploadPath,
              onError: (error) => {
                throw error;
              },
            });
          }

          toast({
            description: `${file.name} uploaded successfully`,
            className: "success-toast",
          });
        } catch (error: unknown) {
          console.error("Upload error:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : typeof error === "object" && error !== null && "message" in error
                ? String((error as { message: string }).message)
                : "Unknown error occurred";
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${file.name}: ${errorMessage}`,
            variant: "destructive",
          });
        }
      });

      await Promise.all(uploadPromises);
      setIsUploading(false);

      // Auto-refresh after a short delay
      setTimeout(() => {
        router.refresh();
        if (mode === "private") {
          window.location.reload();
        }
      }, 500);
    },
    [ownerId, accountId, router, toast, mode, isPro, uploadPath, uploadManagedFile]
  );

  return {
    isUploading,
    onDrop,
  };
};
