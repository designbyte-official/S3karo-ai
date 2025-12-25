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

  return (
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
