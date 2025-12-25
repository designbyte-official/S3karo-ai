"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { s3ExplorerService } from "@/lib/services/s3/s3-explorer.service";
import { platformStorageService } from "@/lib/services/platform/platform-storage.service";
import { s3ConfigService } from "@/lib/services/s3/s3-config.service";
import Card from "@/components/Card";
import { File as S3File } from "@/types/file";
import { Button } from "@/components/ui/button";
import { useAuthStore, User } from "@/lib/stores/auth-store";

interface FileListProps {
  types: FileType[];
  searchText?: string;
  sort?: string;
  initialFiles?: {
    documents: S3File[];
    total: number;
    continuationToken?: string;
  };
  currentUser?: User;
}

const ITEMS_PER_PAGE = 20;

const FileList = ({ types, searchText = "", sort = "$createdAt-desc", initialFiles, currentUser }: FileListProps) => {
  const router = useRouter();
  const [files, setFiles] = useState(initialFiles || { documents: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const [currentPage, setCurrentPage] = useState(1);
  const [continuationToken, setContinuationToken] = useState<string | undefined>(initialFiles?.continuationToken);

  useEffect(() => {
    const loadFiles = async () => {
      if (!user) return;

      setLoading(true);
      const mode = s3ConfigService.getMode();

      try {
        if (mode === 'own-s3') {
          const config = await s3ConfigService.getConfig(user.$id);
          if (!config) {
            router.push('/own-s3/setup');
            return;
          }
          const result = await s3ExplorerService.listItems({
            config,
            types,
            searchText,
            sort,
            ownerId: user.$id,
            accountId: user.accountId,
            limit: ITEMS_PER_PAGE,
          });
          setFiles(result);
          setContinuationToken(result.continuationToken);
        } else if (mode === 'managed-storage' || mode === 'platform-s3') {
          const result = await platformStorageService.getFiles({
            userId: user.$id,
            types,
            searchText,
            sort,
            limit: ITEMS_PER_PAGE,
          });
          setFiles(result);
          // Managed Storage doesn't currently return a continuation token from the API
          setContinuationToken(undefined);
        } else {
          setFiles({ documents: [], total: 0 });
        }
        setCurrentPage(1);
      } catch (error: any) {
        console.error('Error loading files:', error);
        if (mode === 'own-s3' && error?.message?.includes('S3 configuration not found')) {
          router.push('/own-s3/setup');
          return;
        }
        setFiles({ documents: [], total: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [types, searchText, sort, user, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = () => {
      if (user) {
        const mode = s3ConfigService.getMode();
        if (mode === 'own-s3') {
          s3ConfigService.getConfig(user.$id).then(config => {
            if (!config) return;
            return s3ExplorerService.listItems({
              config,
              types,
              searchText,
              sort,
              ownerId: user.$id,
              accountId: user.accountId,
              limit: ITEMS_PER_PAGE,
            });
          }
          ).then(result => {
            if (result) {
              setFiles(result);
              setContinuationToken(result.continuationToken);
              setCurrentPage(1);
            }
          }).catch(console.error);
        } else if (mode === 'managed-storage' || mode === 'platform-s3') {
          platformStorageService.getFiles({
            userId: user.$id,
            types,
            searchText,
            sort,
            limit: ITEMS_PER_PAGE,
          }).then(result => {
            setFiles(result);
            setContinuationToken(undefined);
            setCurrentPage(1);
          }).catch(console.error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [types, searchText, sort, user]);

  const loadMore = async () => {
    if (!user || loading) return;

    setLoading(true);
    const mode = s3ConfigService.getMode();

    try {
      if (mode === 'own-s3') {
        const config = await s3ConfigService.getConfig(user.$id);
        if (!config) return;
        const result = await s3ExplorerService.listItems({
          config,
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
      } else if (mode === 'managed-storage' || mode === 'platform-s3') {
        const result = await platformStorageService.getFiles({
          userId: user.$id,
          types,
          searchText,
          sort,
          limit: ITEMS_PER_PAGE,
        });
        setFiles(prev => ({
          documents: [...prev.documents, ...result.documents],
          total: result.total,
        }));
        setContinuationToken(undefined);
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
  const displayedFiles = files.documents;

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
