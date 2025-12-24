"use client";

"use client";

import { useEffect, useState } from "react";
import { getStorageMode } from "@/lib/s3/config";
import { getFiles as getFilesAppwrite } from "@/lib/actions/file.actions";
import { getFiles as getFilesClient } from "@/lib/actions/file.actions.client";
import { Models } from "node-appwrite";
import Card from "@/components/Card";
import { FileType } from "@/types/index.d";

interface FileListProps {
  types: FileType[];
  searchText?: string;
  sort?: string;
  initialFiles?: {
    documents: Models.Document[];
    total: number;
  };
  currentUser?: {
    $id: string;
    accountId: string;
  };
}

const FileList = ({ types, searchText = "", sort = "$createdAt-desc", initialFiles, currentUser }: FileListProps) => {
  const [files, setFiles] = useState(initialFiles || { documents: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(currentUser);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) {
        const fetchedUser = await getCurrentUser();
        setUser(fetchedUser);
      }
    };
    fetchUser();
  }, [user]);

  useEffect(() => {
    const loadFiles = async () => {
      if (!user) return;
      
      setLoading(true);
      const mode = getStorageMode();
      
      try {
        if (mode === 's3') {
          const result = await getFilesClient({
            types,
            searchText,
            sort,
            ownerId: user.$id,
            accountId: user.accountId,
          });
          setFiles(result);
        } else {
          const result = await getFilesAppwrite({
            types,
            searchText,
            sort,
          });
          setFiles(result);
        }
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [types, searchText, sort, user]);

  // Listen for storage changes (when files are uploaded/deleted)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = () => {
      if (user) {
        const mode = getStorageMode();
        if (mode === 's3') {
          getFilesClient({
            types,
            searchText,
            sort,
            ownerId: user.$id,
            accountId: user.accountId,
          }).then(setFiles);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [types, searchText, sort, user]);

  if (loading) {
    return <p className="empty-list">Loading files...</p>;
  }

  if (files.total === 0) {
    return <p className="empty-list">No files uploaded</p>;
  }

  return (
    <section className="file-list">
      {files.documents.map((file: Models.Document) => (
        <Card key={file.$id} file={file} />
      ))}
    </section>
  );
};

export default FileList;

