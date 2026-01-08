"use client";

import React, { useState, useEffect, useRef } from "react";

import Image from "next/image";

import { cn, getFileIcon } from "@/features/shared/utils";

interface Props {
  type: string;
  extension: string;
  url?: string;
  imageClassName?: string;
  className?: string;
  showThumbnail?: boolean; // If false, always show icon instead of image thumbnail
}

export const Thumbnail = ({
  type,
  extension,
  url = "",
  imageClassName,
  className,
  showThumbnail = false, // Default: show icons only
}: Props) => {
  const isImage = type === "image" && extension !== "svg";
  const isFolder = type === "folder";
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Only load image thumbnails if showThumbnail is true AND it's an image
  const shouldShowThumbnail = showThumbnail && isImage;

  // Use Intersection Observer to lazy load images only when visible and enabled
  useEffect(() => {
    if (!shouldShowThumbnail || !url || shouldLoadImage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoadImage(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "50px" } // Start loading 50px before visible
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [shouldShowThumbnail, url, shouldLoadImage]);

  // Determine what to show
  const getImageSource = () => {
    // Always show folder icon for folders
    if (isFolder) {
      return "/assets/icons/folder.svg";
    }

    // If thumbnails are disabled, always show file type icon
    if (!showThumbnail) {
      return getFileIcon(extension, type);
    }

    // If thumbnails enabled and it's an image
    if (shouldShowThumbnail) {
      // Show actual image if loaded successfully, otherwise show icon
      if (shouldLoadImage && !imageError && url) {
        return url;
      }
      // Show icon while loading or if error
      return getFileIcon(extension, type);
    }

    // Default: show file type icon
    return getFileIcon(extension, type);
  };

  const imageSource = getImageSource();
  const isActualImage =
    shouldShowThumbnail && shouldLoadImage && !imageError && url && imageSource === url;

  // Check if this is a full-width thumbnail (when className includes full width styles)
  const isFullWidth = className?.includes("!w-full") || className?.includes("w-full");

  return (
    <figure className={cn("thumbnail", className)} ref={imgRef}>
      <Image
        src={imageSource}
        alt={isFolder ? "folder" : isActualImage ? "thumbnail" : "file-icon"}
        width={isFullWidth ? 800 : 100}
        height={isFullWidth ? 500 : 100}
        loading={isActualImage ? "lazy" : "eager"}
        onError={() => {
          if (shouldShowThumbnail) {
            setImageError(true);
          }
        }}
        className={cn(
          !isFullWidth && "size-8 object-contain",
          imageClassName,
          isActualImage && "thumbnail-image",
          isFullWidth && "w-full h-full"
        )}
      />
    </figure>
  );
};
export default Thumbnail;
