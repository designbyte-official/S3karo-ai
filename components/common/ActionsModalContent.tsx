"use client";

import React from "react";
import Image from "next/image";
import { S3File as File } from "@/types/file";
import { convertFileSize, formatDateTime } from "@/features/shared/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex">
    <p className="file-details-label text-left">{label}</p>
    <p className="file-details-value text-left">{value}</p>
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
        <div className="w-full flex flex-col items-center gap-6">
          {/* Large image display - full width, no height restrictions */}
          <div className="relative w-full bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-center w-full p-4 sm:p-6">
              <Image
                src={cleanUrl}
                alt={file.name}
                width={2400}
                height={2400}
                className="w-full h-auto max-w-full object-contain rounded-lg"
                unoptimized
                priority
              />
            </div>
          </div>
          
          {/* File information */}
          <div className="w-full space-y-4 px-2 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <div className="share-wrapper">
        <p className="subtitle-2 text-light-100">Share with other users</p>
        <Input
          type="email"
          placeholder="Enter email address"
          onChange={(e) => onInputChange([e.target.value])}
          className="share-input"
        />
        <div className="pt-4">
          <div className="flex justify-between">
            <p className="subtitle-2 text-light-100">Shared with</p>
            <p className="subtitle-2 text-light-200">
              {file.users?.length || 0} users
            </p>
          </div>

          <ul className="pt-2">
            {file.users?.map((email: string) => (
              <li
                key={email}
                className="flex items-center justify-between gap-2"
              >
                <p className="subtitle-2">{email}</p>
                <Button
                  onClick={() => onRemove(email)}
                  className="share-remove-user"
                >
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
  ShareInput
};
