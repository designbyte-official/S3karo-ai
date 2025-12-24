"use client";

import { useEffect, useState } from "react";
import { getStorageMode } from "@/lib/s3/config";
import { getFiles as getFilesClient } from "@/lib/actions/file.actions.client";
import { getTotalSpaceUsed as getTotalSpaceUsedClient } from "@/lib/actions/file.actions.client";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { Models } from "node-appwrite";
import Card from "@/components/Card";
import FileUploader from "@/components/FileUploader";
import { useRouter } from "next/navigation";

const OwnS3Page = () => {
  const [files, setFiles] = useState<{ documents: Models.Document[]; total: number }>({ documents: [], total: 0 });
  const [totalSpace, setTotalSpace] = useState<any>(null);
  const [user, setUser] = useState<{ $id: string; accountId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkMode = () => {
      const mode = getStorageMode();
      if (mode !== 'own-s3') {
        router.push('/');
      }
    };
    
    checkMode();
    
    if (typeof window !== 'undefined') {
      const handleStorageChange = () => {
        checkMode();
        loadData();
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [router]);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [filesData, spaceData] = await Promise.all([
        getFilesClient({
          types: [],
          ownerId: user.$id,
          accountId: user.accountId,
        }),
        getTotalSpaceUsedClient(user.$id),
      ]);
      setFiles(filesData);
      setTotalSpace(spaceData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Listen for file changes
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const handleStorageChange = () => {
        loadData();
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="page-container">
        <p className="body-2 text-light-100">Loading...</p>
      </div>
    );
  }

  const convertFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="page-container">
      <section className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="h1 text-light-100">Your S3 Files</h1>
            <p className="body-2 text-light-200 mt-2">
              Direct S3 operations - Upload, view, open, and delete files
            </p>
          </div>
          {user && (
            <FileUploader ownerId={user.$id} accountId={user.accountId} />
          )}
        </div>

        {/* Storage Summary */}
        {totalSpace && (
          <div className="mb-8 p-6 rounded-[18px] bg-brand shadow-drop-2">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <p className="body-2 text-white mb-2">Storage Used</p>
                <p className="h2 text-white">
                  {convertFileSize(totalSpace.used || 0)} / {convertFileSize(totalSpace.total || 0)}
                </p>
                <div className="mt-4 w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all"
                    style={{ 
                      width: `${totalSpace.total > 0 ? (totalSpace.used / totalSpace.total) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Actions Info */}
        <div className="mb-6 p-4 rounded-lg border border-blue/30 bg-blue/10">
          <p className="body-2 text-blue font-medium mb-2">What you can do:</p>
          <ul className="caption text-blue/80 space-y-1">
            <li>• <strong className="text-blue">Upload files</strong> - Click the Upload button above</li>
            <li>• <strong className="text-blue">View files</strong> - Browse all your files below</li>
            <li>• <strong className="text-blue">Open files</strong> - Click on any file to open it</li>
            <li>• <strong className="text-blue">Delete files</strong> - Use the actions menu (three dots) on any file</li>
            <li>• <strong className="text-blue">Rename files</strong> - Use the actions menu to rename</li>
          </ul>
        </div>

        {/* File List */}
        {files.total === 0 ? (
          <div className="text-center py-12">
            <p className="body-2 text-light-200 mb-4">No files uploaded yet</p>
            <p className="caption text-light-200">Upload your first file using the button above</p>
          </div>
        ) : (
          <section className="file-list">
            {files.documents.map((file: Models.Document) => (
              <Card key={file.$id} file={file} />
            ))}
          </section>
        )}
      </section>
    </div>
  );
};

export default OwnS3Page;

