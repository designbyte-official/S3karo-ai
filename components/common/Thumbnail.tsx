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

  return (
    <figure className={cn("thumbnail", className)} ref={imgRef}>
      {isFolder ? (
        <Image
          src="/assets/icons/folder.svg"
          alt="folder"
          width={100}
          height={100}
          className={cn("size-8 object-contain", imageClassName)}
        />
      ) : shouldShowThumbnail && !shouldLoadImage ? (
        // Show placeholder icon while image loads (only when thumbnails enabled)
        <Image
          src={getFileIcon(extension, type)}
          alt="thumbnail-placeholder"
          width={100}
          height={100}
          className={cn("size-8 object-contain", imageClassName)}
        />
      ) : (
        <Image
          src={shouldShowThumbnail && shouldLoadImage && !imageError ? url : getFileIcon(extension, type)}
          alt="thumbnail"
          width={100}
          height={100}
          loading={shouldShowThumbnail ? "lazy" : "eager"}
          onError={() => setImageError(true)}
          className={cn(
            "size-8 object-contain",
            imageClassName,
            shouldShowThumbnail && "thumbnail-image",
          )}
        />
      )}
    </figure>
  );
};
export default Thumbnail;
