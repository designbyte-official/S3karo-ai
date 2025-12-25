"use client";

import React from "react";
import { S3File as File } from "@/types/file";
import Card from "@/components/common/Card";

interface Props {
    files?: File[];
    initialFiles?: { documents: File[]; total: number };
    currentUser?: any;
    types?: string[];
    searchText?: string;
    sort?: string;
    onFolderClick?: (path: string) => void;
}

const FileList = ({ files, initialFiles, currentUser, types, searchText, sort, onFolderClick }: Props) => {
    const displayFiles = files || initialFiles?.documents || [];

    return (
        <ul className="file-list">
            {displayFiles.map((file) => (
                <Card key={file.$id} file={file} onFolderClick={onFolderClick} />
            ))}
        </ul>
    );
};

export default FileList;
