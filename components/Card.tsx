import Link from "next/link";
import Thumbnail from "@/components/Thumbnail";
import { convertFileSize } from "@/lib/utils";
import FormattedDateTime from "@/components/FormattedDateTime";
import ActionDropdown from "@/components/ActionDropdown";
import { File } from "@/types/file";

const Card = ({ file }: { file: File }) => {
  const isFolder = file.type === 'folder' || file.isFolder;
  
  const handleClick = (e: React.MouseEvent) => {
    if (isFolder) {
      e.preventDefault();
      // TODO: Navigate to folder or update prefix
      console.log('Folder clicked:', file.key || file.$id);
    }
  };

  return (
    <Link 
      href={isFolder ? '#' : file.url} 
      target={isFolder ? undefined : "_blank"}
      onClick={handleClick}
      className="file-card"
    >
      <div className="flex justify-between">
        <Thumbnail
          type={file.type}
          extension={file.extension}
          url={file.url}
          className="!size-20"
          imageClassName="!size-11"
        />

        <div className="flex flex-col items-end justify-between">
          {!isFolder && <ActionDropdown file={file} />}
          <p className="body-1 text-light-100">
            {isFolder ? 'Folder' : convertFileSize(file.size)}
          </p>
        </div>
      </div>

      <div className="file-card-details">
        <p className="subtitle-2 line-clamp-1">{file.name}</p>
        {!isFolder && (
          <>
            <FormattedDateTime
              date={file.$createdAt}
              className="body-2 text-light-100"
            />
            <p className="caption line-clamp-1 text-light-200">
              By: {file.owner?.fullName || 'Unknown'}
            </p>
          </>
        )}
      </div>
    </Link>
  );
};
export default Card;
