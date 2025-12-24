"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStorageMode } from "@/lib/s3/config";
import { getFiles as getFilesClient } from "@/lib/actions/file.actions.client";
import { getCurrentUser } from "@/lib/actions/user.actions";
import Card from "@/components/Card";
import { FileType } from "@/types/index.d";
import { File } from "@/types/file";
import { Button } from "@/components/ui/button";

interface FileListProps {
  types: FileType[];
  searchText?: string;
  sort?: string;
  initialFiles?: {
    documents: File[];
    total: number;
    continuationToken?: string;
  };
  currentUser?: {
    $id: string;
    accountId: string;
  };
}

const ITEMS_PER_PAGE = 20;

const FileList = ({ types, searchText = "", sort = "$createdAt-desc", initialFiles, currentUser }: FileListProps) => {
  const router = useRouter();
  const [files, setFiles] = useState(initialFiles || { documents: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(currentUser);
  const [currentPage, setCurrentPage] = useState(1);
  const [continuationToken, setContinuationToken] = useState<string | undefined>(initialFiles?.continuationToken);

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
      setCurrentPage(1); // Reset to first page on filter change
      const mode = getStorageMode();
      
      try {
        if (mode === 'own-s3' || mode === 'platform-s3') {
          const result = await getFilesClient({
            types,
            searchText,
            sort,
            ownerId: user.$id,
            accountId: user.accountId,
            limit: ITEMS_PER_PAGE,
          });
          setFiles(result);
          setContinuationToken(result.continuationToken);
          setCurrentPage(1);
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
  }, [types, searchText, sort, user, router]);

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
            limit: ITEMS_PER_PAGE,
          }).then((result) => {
            setFiles(result);
            setContinuationToken(result.continuationToken);
            setCurrentPage(1);
          }).catch((error) => {
            console.error('Error refreshing files:', error);
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [types, searchText, sort, user]);

  const loadMore = async () => {
    if (!user || !continuationToken || loading) return;
    
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
          limit: ITEMS_PER_PAGE,
          continuationToken,
        });
        setFiles(prev => ({
          documents: [...prev.documents, ...result.documents],
          total: result.total,
        }));
        setContinuationToken(result.continuationToken);
        setCurrentPage(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error loading more files:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && files.total === 0) {
    return <p className="empty-list">Loading files...</p>;
  }

  if (files.total === 0 && !loading) {
    return <p className="empty-list">No files uploaded</p>;
  }

  const hasMore = !!continuationToken;
  const displayedFiles = files.documents.slice(0, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <section className="file-list">
        {displayedFiles.map((file) => (
          <Card key={file.$id} file={file} />
        ))}
      </section>
      {hasMore && displayedFiles.length < files.total && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={loadMore}
            disabled={loading}
            className="primary-btn shadow-drop-2"
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </>
  );
};

export default FileList;

