import Link from "next/link";
import Thumbnail from "./Thumbnail";
import { cn, getFileIcon, convertFileSize } from "@/features/shared/utils";
import FormattedDateTime from "./FormattedDateTime";
import ActionDropdown from "./ActionDropdown";
import { S3File } from "@/types/file";

const Card = ({
  file,
  onFolderClick,
  view = "grid",
  index = 0
}: {
  file: S3File;
  onFolderClick?: (path: string) => void;
  view?: "grid" | "list";
  index?: number;
}) => {
  const isFolder = file.type === 'folder' || file.isFolder;

  const handleClick = (e: React.MouseEvent) => {
    if (isFolder) {
      e.preventDefault();
      if (onFolderClick) {
        onFolderClick(file.key || file.$id);
      }
    }
  };

  // Stagger Animation Delay
  const animationDelay = `${index * 0.05}s`;

  if (view === "list") {
    return (
      <Link
        href={isFolder ? '#' : file.url}
        target={isFolder ? undefined : "_blank"}
        onClick={handleClick}
        className="group relative flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-all hover:bg-light-400/50 hover:shadow-md border border-transparent hover:border-light-300 animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{ animationDelay }}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Thumbnail
            type={file.type}
            extension={file.extension}
            url={file.url}
            className="!size-10 min-w-10"
            imageClassName="!size-6"
          />
          <div className="flex flex-col min-w-0">
            <p className="subtitle-2 truncate text-dark-100 group-hover:text-brand transition-colors">
              {file.name}
            </p>
            <p className="caption text-light-200 sm:hidden">
              {convertFileSize(file.size)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8 ml-4">
          {!isFolder && (
            <div className="hidden sm:flex items-center gap-2 min-w-[120px]">
              <p className="body-2 text-light-100">{convertFileSize(file.size)}</p>
            </div>
          )}

          {!isFolder && (
            <div className="hidden md:flex items-center gap-2 min-w-[150px]">
              <FormattedDateTime
                date={file.$createdAt}
                className="body-2 text-light-100"
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
      className="file-card group animate-in fade-in zoom-in-95 duration-300"
      style={{ animationDelay }}
    >
      <div className="flex justify-between relative z-10">
        <Thumbnail
          type={file.type}
          extension={file.extension}
          url={file.url}
          className="!size-20 group-hover:scale-110 transition-transform duration-300"
          imageClassName="!size-11"
        />

        <div className="flex flex-col items-end justify-between">
          {!isFolder && (
            <div className="scale-100 transition-all duration-200">
              <ActionDropdown file={file} />
            </div>
          )}
          <p className="body-1 text-light-100 font-medium">
            {isFolder ? 'Folder' : convertFileSize(file.size)}
          </p>
        </div>
      </div>

      <div className="file-card-details">
        <p className="subtitle-2 line-clamp-1 group-hover:text-brand transition-colors">{file.name}</p>
        {!isFolder && (
          <>
            <FormattedDateTime
              date={file.$createdAt}
              className="body-2 text-light-100"
            />
            <div className="flex items-center gap-1">
              <p className="caption line-clamp-1 text-light-200">
                {file.owner?.fullName || 'Unknown'}
              </p>
            </div>
          </>
        )}
      </div>
    </Link>
  );
};
export default Card;
