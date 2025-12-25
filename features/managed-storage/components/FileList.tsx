"use client";

import React from "react";
import { S3File as File } from "@/types/file";
import Card from "@/features/shared/components/Card";

interface Props {
    files?: File[];
    initialFiles?: { documents: File[]; total: number };
    currentUser?: any;
    types?: string[];
    searchText?: string;
    sort?: string;
}

const FileList = ({ files, initialFiles, currentUser, types, searchText, sort }: Props) => {
    const displayFiles = files || initialFiles?.documents || [];

    return (
        <ul className="file-list">
            {displayFiles.map((file) => (
                <Card key={file.$id} file={file} />
            ))}
        </ul>
    );
};

export default FileList;
