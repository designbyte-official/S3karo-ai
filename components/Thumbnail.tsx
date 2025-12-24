import React from "react";
import Image from "next/image";
import { cn, getFileIcon } from "@/lib/utils";

interface Props {
  type: string;
  extension: string;
  url?: string;
  imageClassName?: string;
  className?: string;
}

export const Thumbnail = ({
  type,
  extension,
  url = "",
  imageClassName,
  className,
}: Props) => {
  const isImage = type === "image" && extension !== "svg";
  const isFolder = type === "folder";

  return (
    <figure className={cn("thumbnail", className)}>
      {isFolder ? (
        <Image
          src="/assets/icons/folder.svg"
          alt="folder"
          width={100}
          height={100}
          className={cn("size-8 object-contain", imageClassName)}
        />
      ) : (
        <Image
          src={isImage ? url : getFileIcon(extension, type)}
          alt="thumbnail"
          width={100}
          height={100}
          loading={isImage ? "lazy" : "eager"}
          className={cn(
            "size-8 object-contain",
            imageClassName,
            isImage && "thumbnail-image",
          )}
        />
      )}
    </figure>
  );
};
export default Thumbnail;
