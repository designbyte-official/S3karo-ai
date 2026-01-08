"use client";

import React from "react";

import Image from "next/image";

import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { cn } from "@/features/shared/utils";
import { useFileUploader } from "@/hooks/use-file-uploader";

interface Props {
  ownerId: string;
  accountId: string;
  className?: string;
  mode?: "managed" | "private";
  path?: string;
}

const FileUploader = ({
  ownerId,
  accountId,
  className,
  mode = "managed",
  path: uploadPath = "",
}: Props) => {
  const { isUploading, onDrop } = useFileUploader(ownerId, accountId, mode, uploadPath);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB limit
  });

  return (
    <div {...getRootProps()} className={cn("cursor-pointer", className)}>
      <input {...getInputProps()} />
      <Button
        type="button"
        disabled={isUploading}
        className={cn("uploader-button", className, isUploading && "opacity-50 cursor-not-allowed")}
      >
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
