"use client";

import { useEffect } from "react";
import { getStorageMode } from "@/lib/s3/config";
import { useOwnS3 } from "@/lib/hooks/use-own-s3";
import Card from "@/components/Card";
import FileUploader from "@/components/FileUploader";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const OwnS3Page = () => {
  const router = useRouter();
  const { files, totalSpace, user, loading, hasConfig, error, reload } = useOwnS3();

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
        reload();
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [router, reload]);

  useEffect(() => {
    // Redirect to setup if no config and user is loaded
    if (!loading && user && !hasConfig) {
      router.push('/own-s3/setup');
    }
  }, [hasConfig, loading, user, router]);

  useEffect(() => {
    // Redirect on S3 config error
    if (error?.includes('S3 configuration not found')) {
      router.push('/own-s3/setup');
    }
  }, [error, router]);

  // Show loading only while fetching user
  if (loading && !user) {
    return (
      <div className="page-container">
        <p className="body-2 text-light-100">Loading...</p>
      </div>
    );
  }

  // If no user after loading, show error
  if (!user && !loading) {
    return (
      <div className="page-container">
        <div className="mb-6 p-4 rounded-lg border border-red/30 bg-red/10 shadow-drop-1">
          <p className="body-2 text-red font-medium">Error: User not found. Please sign in.</p>
        </div>
      </div>
    );
  }

  // If redirecting to setup, show nothing
  if (!hasConfig && !loading) {
    return null;
  }

  // Show loading state while fetching files (but user is loaded)
  if (loading && user && hasConfig) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center py-12">
          <p className="body-2 text-light-200">Loading your files...</p>
        </div>
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
          {user && hasConfig && (
            <FileUploader ownerId={user.$id} accountId={user.accountId} />
          )}
        </div>

        {error && !error.includes('S3 configuration not found') && (
          <div className="mb-6 p-4 rounded-lg border border-red/30 bg-red/10 shadow-drop-1">
            <p className="body-2 text-red font-medium mb-2">Error: {error}</p>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => reload()}
                variant="outline"
                className="button border border-red/30 bg-red/10 text-red hover:bg-red/20 shadow-drop-1"
              >
                Retry
              </Button>
              <Button
                onClick={() => router.push('/own-s3/setup')}
                variant="outline"
                className="button border border-red/30 bg-red/10 text-red hover:bg-red/20 shadow-drop-1"
              >
                Go to Setup Page
              </Button>
            </div>
          </div>
        )}

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
            <li>• <strong className="text-blue font-semibold">Upload files</strong> - Click the Upload button above</li>
            <li>• <strong className="text-blue font-semibold">View files</strong> - Browse all your files below</li>
            <li>• <strong className="text-blue font-semibold">Open files</strong> - Click on any file to open it</li>
            <li>• <strong className="text-blue font-semibold">Delete files</strong> - Use the actions menu (three dots) on any file</li>
            <li>• <strong className="text-blue font-semibold">Rename files</strong> - Use the actions menu to rename</li>
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
            {files.documents.map((file) => (
              <Card key={file.$id} file={file} />
            ))}
          </section>
        )}
      </section>
    </div>
  );
};

export default OwnS3Page;

