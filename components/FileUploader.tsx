"use client";

import React, { useCallback, useState } from "react";

import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn, convertFileToUrl, getFileType } from "@/lib/utils";
import Image from "next/image";
import Thumbnail from "@/components/Thumbnail";
import { MAX_FILE_SIZE } from "@/constants";
import { useToast } from "@/hooks/use-toast";
import { s3ExplorerService } from "@/lib/services/s3/s3-explorer.service";
import { platformStorageService } from "@/lib/services/platform/platform-storage.service";
import { s3ConfigService } from "@/lib/services/s3/s3-config.service";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

interface Props {
  ownerId: string;
  accountId: string;
  className?: string;
}

const FileUploader = ({ ownerId, accountId, className }: Props) => {
  const path = usePathname();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const storageMode = s3ConfigService.getMode();
  const user = useAuthStore((state) => state.user);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setFiles(acceptedFiles);

      const uploadPromises = acceptedFiles.map(async (file) => {
        if (file.size > MAX_FILE_SIZE) {
          setFiles((prevFiles) =>
            prevFiles.filter((f) => f.name !== file.name),
          );

          return toast({
            description: (
              <p className="body-2 text-white">
                <span className="font-semibold">{file.name}</span> is too large.
                Max file size is 50MB.
              </p>
            ),
            className: "error-toast",
          });
        }

        try {
          // PRO CHECK for Managed Storage
          if ((storageMode === 'managed-storage' || storageMode === 'platform-s3') && !user?.isPro) {
            return toast({
              description: (
                <p className="body-2 text-white">
                  Managed Storage uploads require a <span className="font-semibold">Pro subscription</span>.
                </p>
              ),
              className: "error-toast",
            });
          }

          // OWN S3 & PLATFORM S3: Both use client-side upload
          // OWN S3: 100% client-side (direct to S3, no server)
          // PLATFORM S3: Client-side S3 + API call for DB
          console.log(`📤 FileUploader: Uploading to ${storageMode} (client-side)`);

          let uploadedFile;
          if (storageMode === 'own-s3') {
            const config = await s3ConfigService.getConfig(ownerId);
            if (!config) {
              toast({
                description: "Please configure your S3 credentials first",
                className: "error-toast",
              });
              setFiles([]);
              return;
            }
            uploadedFile = await s3ExplorerService.uploadFile({ file, ownerId, accountId, config });
          } else {
            uploadedFile = await platformStorageService.uploadFile({ file, ownerId, accountId });
          }

          if (uploadedFile) {
            setFiles((prevFiles) =>
              prevFiles.filter((f) => f.name !== file.name),
            );
            toast({
              description: `${file.name} uploaded successfully`,
            });
          }
        } catch (error: any) {
          console.error('❌ Upload error:', error);
          toast({
            description: `Failed to upload ${file.name}: ${error?.message || 'Unknown error'}`,
            className: "error-toast",
          });
          setFiles((prevFiles) =>
            prevFiles.filter((f) => f.name !== file.name),
          );
        }
      });

      await Promise.all(uploadPromises);
    },
    [ownerId, accountId, path, toast, storageMode],
  );

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleRemoveFile = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>,
    fileName: string,
  ) => {
    e.stopPropagation();
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };

  return (
    <div {...getRootProps()} className="cursor-pointer">
      <input {...getInputProps()} />
      <Button type="button" className={cn("uploader-button", className)}>
        <Image
          src="/assets/icons/upload.svg"
          alt="upload"
          width={24}
          height={24}
        />{" "}
        <p>Upload</p>
      </Button>
      {files.length > 0 && (
        <ul className="uploader-preview-list">
          <h4 className="text-[18px] leading-[20px] font-medium text-light-100">Uploading</h4>

          {files.map((file, index) => {
            const { type, extension } = getFileType(file.name);

            return (
              <li
                key={`${file.name}-${index}`}
                className="uploader-preview-item"
              >
                <div className="flex items-center gap-3">
                  <Thumbnail
                    type={type}
                    extension={extension}
                    url={convertFileToUrl(file)}
                  />

                  <div className="preview-item-name">
                    {file.name}
                    <Image
                      src="/assets/icons/file-loader.gif"
                      width={80}
                      height={26}
                      alt="Loader"
                    />
                  </div>
                </div>

                <Image
                  src="/assets/icons/remove.svg"
                  width={24}
                  height={24}
                  alt="Remove"
                  onClick={(e) => handleRemoveFile(e, file.name)}
                  className="cursor-pointer hover:opacity-70 transition-opacity"
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FileUploader;
