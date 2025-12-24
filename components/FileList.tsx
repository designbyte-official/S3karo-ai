"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStorageMode } from "@/lib/s3/config";
import { getFiles as getFilesClient } from "@/lib/actions/file.actions.client";
import { getCurrentUser } from "@/lib/actions/user.actions";
import Card from "@/components/Card";
import { FileType } from "@/types/index.d";
import { File } from "@/types/file";

interface FileListProps {
  types: FileType[];
  searchText?: string;
  sort?: string;
  initialFiles?: {
    documents: File[];
    total: number;
  };
  currentUser?: {
    $id: string;
    accountId: string;
  };
}

const FileList = ({ types, searchText = "", sort = "$createdAt-desc", initialFiles, currentUser }: FileListProps) => {
  const router = useRouter();
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
        if (mode === 'own-s3' || mode === 'platform-s3') {
          const result = await getFilesClient({
            types,
            searchText,
            sort,
            ownerId: user.$id,
            accountId: user.accountId,
          });
          setFiles(result);
        } else {
          // No Appwrite - return empty
          setFiles({ documents: [], total: 0 });
        }
      } catch (error: any) {
        console.error('Error loading files:', error);
        // If own-s3 mode and config not found, redirect to setup
        if (mode === 'own-s3' && error?.message?.includes('S3 configuration not found')) {
          router.push('/own-s3/setup');
          return;
        }
        // Show error message
        setFiles({ documents: [], total: 0 });
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
        if (mode === 'own-s3' || mode === 'platform-s3') {
          getFilesClient({
            types,
            searchText,
            sort,
            ownerId: user.$id,
            accountId: user.accountId,
          }).then(setFiles).catch((error) => {
            console.error('Error refreshing files:', error);
          });
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
      {files.documents.map((file) => (
        <Card key={file.$id} file={file} />
      ))}
    </section>
  );
};

export default FileList;

