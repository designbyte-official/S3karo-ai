import Link from "next/link";
import Thumbnail from "./Thumbnail";
import { cn, convertFileSize } from "@/features/shared/utils";
import FormattedDateTime from "./FormattedDateTime";
import ActionDropdown from "./ActionDropdown";
import { S3File } from "@/types/file";

const Card = ({
  file,
  onFolderClick,
  view = "grid",
  index = 0,
  showThumbnails = false,
  hideOwner = false
}: {
  file: S3File;
  onFolderClick?: (path: string) => void;
  view?: "grid" | "list";
  index?: number;
  showThumbnails?: boolean;
  hideOwner?: boolean; // Hide owner info (useful for private S3 where all files are owned by user)
}) => {
  const isFolder = file.type === 'folder' || file.isFolder;
  const isImage = file.type === 'image' && file.extension !== 'svg';
  const shouldShowFullImage = showThumbnails && isImage && !isFolder;

  const handleClick = (e: React.MouseEvent) => {
    if (isFolder) {
      e.preventDefault();
      if (onFolderClick) {
        onFolderClick(file.key || file.$id);
      }
    }
  };

  const animationDelay = `${index * 0.05}s`;

  if (view === "list") {
    return (
      <Link
        href={isFolder ? '#' : file.url}
        target={isFolder ? undefined : "_blank"}
        onClick={handleClick}
        className="group relative flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md border border-slate-100 hover:border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ animationDelay }}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Thumbnail
            type={file.type}
            extension={file.extension}
            url={file.url}
            className="!w-10 !h-10 min-w-10 !bg-brand-50"
            imageClassName="!w-6 !h-6"
            showThumbnail={showThumbnails}
          />
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-[14px] font-semibold leading-tight truncate text-slate-800 group-hover:text-brand transition-colors">
              {file.name}
            </p>
            <p className="text-[12px] text-slate-500 sm:hidden">
              {convertFileSize(file.size)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-8 ml-4">
          {!isFolder && (
            <div className="hidden sm:flex items-center min-w-[80px] lg:min-w-[100px]">
              <p className="text-[14px] text-slate-500 font-medium">{convertFileSize(file.size)}</p>
            </div>
          )}

          {!isFolder && (
            <div className="hidden md:flex items-center min-w-[140px] lg:min-w-[160px]">
              <FormattedDateTime
                date={file.$createdAt}
                className="text-[14px] text-slate-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end w-8">
            {!isFolder && <ActionDropdown file={file} />}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={isFolder ? '#' : file.url}
      target={isFolder ? undefined : "_blank"}
      onClick={handleClick}
      className="group relative flex flex-col rounded-3xl bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 border border-slate-100 animate-in fade-in zoom-in-95 duration-300 overflow-hidden"
      style={{ animationDelay }}
    >
      {/* Full-width image thumbnail when enabled */}
      {shouldShowFullImage ? (
        <>
          <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
            <Thumbnail
              type={file.type}
              extension={file.extension}
              url={file.url}
              className="!w-full !h-full !rounded-none"
              imageClassName="!w-full !h-full object-cover"
              showThumbnail={showThumbnails}
            />
            {/* Overlay with actions on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="absolute top-3 right-3">
                <ActionDropdown file={file} />
              </div>
            </div>
          </div>
          {/* File info below image */}
          <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[16px] font-bold text-slate-800 truncate group-hover:text-brand transition-all duration-300 flex-1">
                {file.name}
              </p>
              <p className="text-[12px] text-slate-500 font-semibold bg-slate-50 px-2 py-1 rounded-lg shrink-0">
                {convertFileSize(file.size)}
              </p>
            </div>
            <div className="flex flex-col gap-0.5">
              <FormattedDateTime
                date={file.$createdAt}
                className="text-[12px] text-slate-400 font-medium"
              />
              {!hideOwner && (
                <p className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  {file.owner?.fullName || 'Unknown'}
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Original layout for non-image files or when thumbnails disabled */}
          <div className="flex flex-col gap-4 p-5">
            <div className="flex justify-between items-start w-full">
              <Thumbnail
                type={file.type}
                extension={file.extension}
                url={file.url}
                className="!w-16 !h-16 group-hover:scale-105 transition-transform duration-500 !bg-brand-50"
                imageClassName="!w-10 !h-10"
                showThumbnail={showThumbnails}
              />

              <div className="flex flex-col items-end gap-2">
                {!isFolder && (
                  <ActionDropdown file={file} />
                )}
                <p className="text-[14px] text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded-lg">
                  {isFolder ? 'Folder' : convertFileSize(file.size)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full mt-2">
              <p className="text-[16px] font-bold text-slate-800 truncate group-hover:text-brand transition-all duration-300">
                {file.name}
              </p>
              {!isFolder && (
                <div className="flex flex-col gap-0.5">
                  <FormattedDateTime
                    date={file.$createdAt}
                    className="text-[12px] text-slate-400 font-medium"
                  />
                  {!hideOwner && (
                    <p className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                      {file.owner?.fullName || 'Unknown'}
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
};

export default Card;
