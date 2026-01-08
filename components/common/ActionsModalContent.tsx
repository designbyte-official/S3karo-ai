"use client";

import React from "react";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { convertFileSize, formatDateTime } from "@/features/shared/utils";
import { S3File as File } from "@/types/file";

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex border-b border-light-300/30 py-1.5 last:border-none">
    <p className="file-details-label text-left font-medium">{label}</p>
    <p className="file-details-value text-left text-light-100">{value}</p>
  </div>
);

const FileDetails = ({ file }: { file: File }) => {
  // Only fix: trim URL to prevent trailing space errors
  const cleanUrl = file.url?.trimEnd() || file.url;
  const isImage = file.type === "image" && file.extension !== "svg";

  return (
    <>
      {isImage ? (
        // Full-size image view for images
        <div className="flex w-full flex-col items-center gap-6">
          {/* Large image display - full width, no height restrictions */}
          <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900">
            <div className="flex w-full items-center justify-center p-4 sm:p-6">
              <Image
                src={cleanUrl}
                alt={file.name}
                width={2400}
                height={2400}
                className="h-auto w-full max-w-full rounded-lg object-contain"
                unoptimized
                priority
              />
            </div>
          </div>

          {/* File information */}
          <div className="w-full space-y-4 border-t border-slate-200 px-2 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Format:" value={file.extension.toUpperCase()} />
              <DetailRow label="Size:" value={convertFileSize(file.size)} />
              <DetailRow label="Owner:" value={file.owner?.fullName || "Unknown"} />
              <DetailRow label="Last edit:" value={formatDateTime(file.$createdAt)} />
            </div>
          </div>
        </div>
      ) : (
        // Original layout for non-images
        <>
          <Image
            src={cleanUrl}
            alt={file.name}
            width={100}
            height={100}
            className="file-details-thumbnail"
          />
          <div className="space-y-4 px-2 pt-2">
            <DetailRow label="Format:" value={file.extension} />
            <DetailRow label="Size:" value={convertFileSize(file.size)} />
            <DetailRow label="Owner:" value={file.owner?.fullName || "Unknown"} />
            <DetailRow label="Last edit:" value={formatDateTime(file.$createdAt)} />
          </div>
        </>
      )}
    </>
  );
};

const ShareInput = ({
  file,
  onInputChange,
  onRemove,
}: {
  file: File;
  onInputChange: (emails: string[]) => void;
  onRemove: (email: string) => void;
}) => {
  return (
    <>
      <div className="share-wrapper pt-4">
        <p className="subtitle-2 mb-2 text-light-100">Share with other users</p>
        <Input
          type="email"
          placeholder="Enter email address"
          onChange={(e) => onInputChange([e.target.value])}
          className="rename-input-field"
        />
        <div className="pt-4">
          <div className="flex justify-between">
            <p className="subtitle-2 text-light-100">Shared with</p>
            <p className="subtitle-2 text-light-200">{file.users?.length || 0} users</p>
          </div>

          <ul className="pt-2">
            {file.users?.map((email: string) => (
              <li key={email} className="flex items-center justify-between gap-2">
                <p className="subtitle-2">{email}</p>
                <Button onClick={() => onRemove(email)} className="share-remove-user">
                  <Image
                    src="/assets/icons/remove.svg"
                    alt="Remove"
                    width={24}
                    height={24}
                    className="remove-icon"
                  />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export const ActionsModalContent = {
  FileDetails,
  ShareInput,
};
