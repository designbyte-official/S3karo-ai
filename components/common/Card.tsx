import React from "react";

import Link from "next/link";

import { convertFileSize } from "@/features/shared/utils";
import { S3File } from "@/types/file";

import ActionDropdown from "./ActionDropdown";
import FormattedDateTime from "./FormattedDateTime";
import Thumbnail from "./Thumbnail";

const Card = React.memo(
  ({
    file,
    onFolderClick,
    view = "grid",
    index = 0,
    showThumbnails = false,
    hideOwner = false,
    onImageClick,
  }: {
    file: S3File;
    onFolderClick?: (path: string) => void;
    view?: "grid" | "list";
    index?: number;
    showThumbnails?: boolean;
    hideOwner?: boolean; // Hide owner info (useful for private S3 where all files are owned by user)
    onImageClick?: (file: S3File) => void; // Callback when image is clicked
  }) => {
    const isFolder = file.type === "folder" || file.isFolder;
    const isImage = file.type === "image" && file.extension !== "svg";
    const shouldShowFullImage = showThumbnails && isImage && !isFolder;

    const handleClick = (e: React.MouseEvent) => {
      if (isFolder) {
        e.preventDefault();
        if (onFolderClick) {
          onFolderClick(file.key || file.$id);
        }
      } else if (shouldShowFullImage && onImageClick) {
        // For images with thumbnails enabled, open details modal via callback
        e.preventDefault();
        onImageClick(file);
      }
    };

    const animationDelay = `${index * 0.05}s`;

    if (view === "list") {
      return (
        <Link
          href={isFolder ? "#" : file.url}
          target={isFolder ? undefined : "_blank"}
          onClick={handleClick}
          className="group relative flex w-full items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 hover:border-slate-200 hover:bg-slate-50 hover:shadow-md"
          style={{ animationDelay }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Thumbnail
              type={file.type}
              extension={file.extension}
              url={file.url}
              className="!h-10 !w-10 min-w-10 !bg-brand-50"
              imageClassName="!w-6 !h-6"
              showThumbnail={showThumbnails}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-[14px] font-semibold leading-tight text-slate-800 transition-colors group-hover:text-brand">
                {file.name}
              </p>
              <p className="text-[12px] text-slate-500 sm:hidden">{convertFileSize(file.size)}</p>
            </div>
          </div>

          <div className="ml-4 flex items-center gap-4 sm:gap-8">
            {!isFolder && (
              <div className="hidden min-w-[80px] items-center sm:flex lg:min-w-[100px]">
                <p className="text-[14px] font-medium text-slate-500">
                  {convertFileSize(file.size)}
                </p>
              </div>
            )}

            {!isFolder && (
              <div className="hidden min-w-[140px] items-center md:flex lg:min-w-[160px]">
                <FormattedDateTime date={file.$createdAt} className="text-[14px] text-slate-500" />
              </div>
            )}

            <div className="flex w-8 items-center justify-end">
              {!isFolder && <ActionDropdown file={file} />}
            </div>
          </div>
        </Link>
      );
    }

    return (
      <Link
        href={isFolder ? "#" : file.url}
        target={isFolder ? undefined : "_blank"}
        onClick={handleClick}
        className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 animate-in fade-in zoom-in-95 hover:-translate-y-1 hover:shadow-xl"
        style={{ animationDelay }}
      >
        {/* Full-width image thumbnail when enabled */}
        {shouldShowFullImage ? (
          <>
            <div className="relative w-full overflow-hidden bg-slate-100">
              <Thumbnail
                type={file.type}
                extension={file.extension}
                url={file.url}
                className="!h-full !w-full !rounded-none"
                imageClassName="!w-full !h-full object-cover"
                showThumbnail={showThumbnails}
              />
              {/* Overlay with actions on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100">
                <div className="absolute right-3 top-3">
                  <ActionDropdown file={file} />
                </div>
              </div>
            </div>
            {/* File info below image */}
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex-1 truncate text-[16px] font-bold text-slate-800 transition-all duration-300 group-hover:text-brand">
                  {file.name}
                </p>
                <p className="shrink-0 rounded-lg bg-slate-50 px-2 py-1 text-[12px] font-semibold text-slate-500">
                  {convertFileSize(file.size)}
                </p>
              </div>
              <div className="flex flex-col gap-0.5">
                <FormattedDateTime
                  date={file.$createdAt}
                  className="text-[12px] font-medium text-slate-400"
                />
                {!hideOwner && (
                  <p className="flex items-center gap-1 text-[11px] font-medium text-slate-300">
                    <span className="size-1 rounded-full bg-slate-200"></span>
                    {file.owner?.fullName || "Unknown"}
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Original layout for non-image files or when thumbnails disabled */}
            <div className="flex flex-col gap-4 p-5">
              <div className="flex w-full items-start justify-between">
                <Thumbnail
                  type={file.type}
                  extension={file.extension}
                  url={file.url}
                  className="!h-16 !w-16 !bg-brand-50 transition-transform duration-500 group-hover:scale-105"
                  imageClassName="!w-10 !h-10"
                  showThumbnail={showThumbnails}
                />

                <div className="flex flex-col items-end gap-2">
                  {!isFolder && <ActionDropdown file={file} />}
                  <p className="rounded-lg bg-slate-50 px-2 py-0.5 text-[14px] font-semibold text-slate-500">
                    {isFolder ? "Folder" : convertFileSize(file.size)}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex w-full flex-col gap-1">
                <p className="truncate text-[16px] font-bold text-slate-800 transition-all duration-300 group-hover:text-brand">
                  {file.name}
                </p>
                {!isFolder && (
                  <div className="flex flex-col gap-0.5">
                    <FormattedDateTime
                      date={file.$createdAt}
                      className="text-[12px] font-medium text-slate-400"
                    />
                    {!hideOwner && (
                      <p className="flex items-center gap-1 text-[11px] font-medium text-slate-300">
                        <span className="size-1 rounded-full bg-slate-200"></span>
                        {file.owner?.fullName || "Unknown"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Link>
    );
  }
);

Card.displayName = "Card";

export default Card;
