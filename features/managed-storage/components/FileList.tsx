"use client";

import React, { useState, useMemo, useCallback } from "react";

import { ActionsModalContent } from "@/components/common/ActionsModalContent";
import Card from "@/components/common/Card";
import { ScrollableDialog } from "@/components/ui/scrollable-dialog";
import { S3File as File } from "@/types/file";

interface Props {
  files?: File[];
  initialFiles?: { documents: File[]; total: number };
  currentUser?: any;
  types?: string[];
  searchText?: string;
  sort?: string;
  onFolderClick?: (path: string) => void;
  view?: "grid" | "list";
  showThumbnails?: boolean;
  hideOwner?: boolean;
}

const FileList = ({
  files,
  initialFiles,
  currentUser,
  types,
  searchText,
  sort,
  onFolderClick,
  view = "grid",
  showThumbnails = false,
  hideOwner = false,
}: Props) => {
  // Memoize display files to prevent unnecessary recalculations
  const displayFiles = useMemo(() => files || initialFiles?.documents || [], [files, initialFiles]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Memoize callback to prevent Card re-renders
  const handleImageClick = useCallback((file: File) => {
    setSelectedFile(file);
    setIsDetailsOpen(true);
  }, []);

  // Memoize dialog close handler
  const handleDialogClose = useCallback((open: boolean) => {
    setIsDetailsOpen(open);
    if (!open) {
      setSelectedFile(null);
    }
  }, []);

  // Memoize the list container class to avoid recalculation
  const listClassName = useMemo(
    () =>
      view === "grid"
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        : "flex flex-col gap-4",
    [view]
  );

  return (
    <>
      <ul className={listClassName}>
        {displayFiles.map((file, index) => (
          <Card
            key={file.$id}
            file={file}
            onFolderClick={onFolderClick}
            view={view}
            index={index}
            showThumbnails={showThumbnails}
            hideOwner={hideOwner}
            onImageClick={handleImageClick}
          />
        ))}
      </ul>

      {/* Single Dialog instance for all image details - optimized */}
      {selectedFile && (
        <ScrollableDialog
          open={isDetailsOpen}
          onOpenChange={handleDialogClose}
          title={selectedFile.name}
          fullScreen={true}
        >
          <ActionsModalContent.FileDetails file={selectedFile} />
        </ScrollableDialog>
      )}
    </>
  );
};

export default React.memo(FileList);
