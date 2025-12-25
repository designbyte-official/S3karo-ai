"use client";

import React, { useState } from "react";
import { S3File as File } from "@/types/file";
import Card from "@/components/common/Card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ActionsModalContent } from "@/components/common/ActionsModalContent";

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

const FileList = ({ files, initialFiles, currentUser, types, searchText, sort, onFolderClick, view = "grid", showThumbnails = false, hideOwner = false }: Props) => {
    const displayFiles = files || initialFiles?.documents || [];
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleImageClick = (file: File) => {
        setSelectedFile(file);
        setIsDetailsOpen(true);
    };

    return (
        <>
            <ul className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
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
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="shad-dialog button max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto">
                        <DialogHeader className="flex flex-col gap-3">
                            <DialogTitle className="text-center text-light-100">
                                Details
                            </DialogTitle>
                            <ActionsModalContent.FileDetails file={selectedFile} />
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

export default FileList;
