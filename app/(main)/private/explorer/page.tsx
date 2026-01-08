"use client";

import { DashboardLayout } from "@/components/common/DashboardLayout";
import React, { useEffect } from "react";
import { useOwnS3 } from "@/features/private-s3/hooks/use-own-s3";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import FileUploader from "@/components/common/FileUploader";
import LocalSearch from "@/components/common/LocalSearch";
import DragDropUploadZone from "@/components/common/DragDropUploadZone";
import Sort from "@/components/common/Sort";
import { LayoutGrid, List as ListIcon, Image as ImageIcon, AlertCircle } from "lucide-react";
import { ExplorerSkeleton } from "@/components/common/SkeletonLoader";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { NewFolderDialog } from "@/features/private-s3/components/NewFolderDialog";
import { useExplorerState } from "@/hooks/use-explorer-state";

const OwnS3Page = () => {
  const router = useRouter();
  const { toast } = useToast();

  const {
    files,
    totalSpace,
    user,
    subPath,
    loading,
    hasConfig,
    error,
    reload,
    navigateToFolder,
    setSubPath,
    createFolder
  } = useOwnS3();

  const {
    view,
    setView,
    showThumbnails,
    setShowThumbnails,
    filteredFiles,
    setFilteredFiles,
    searchText
  } = useExplorerState(files);

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      toast({
        title: "Error Loading Files",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (loading) {
    return <ExplorerSkeleton view={view} />;
  }

  if (!user) {
    return (
      <div className="page-container !items-start">
        <div className="mb-6 p-4 rounded-lg border border-red/30 bg-red/10 shadow-drop-1 w-full text-red font-medium">
          Please sign in to access your S3 files.
        </div>
      </div>
    );
  }

  if (!hasConfig) {
    return (
      <div className="page-container !items-start !max-w-full lg:px-10">
        <header className="flex flex-col gap-6 mb-8 w-full">
          <h1 className="h1 capitalize">Own S3 Explorer</h1>
        </header>
        <div className="w-full p-6 rounded-[20px] bg-red/5 border border-red/20 flex flex-col items-center justify-center text-center gap-4 shadow-drop-1">
          <div className="p-3 bg-red/10 rounded-full text-3xl">⚠️</div>
          <h3 className="h3 text-red">Configuration Required</h3>
          <p className="body-1 text-light-100 max-w-md">
            To view and manage your files, you need to configure your S3 bucket credentials first.
          </p>
          <Button
            onClick={() => router.push("/private/settings")}
            className="shad-submit-btn px-8"
          >
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container !items-start !max-w-full lg:px-10">
      <DragDropUploadZone
        ownerId={user.$id}
        accountId={user.accountId}
        subPath={subPath}
        mode="private"
        onUploadComplete={reload}
      />

      <header className="flex flex-col gap-6 mb-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="h1 capitalize truncate">Own S3 Explorer</h1>
            <Breadcrumbs subPath={subPath} onNavigate={setSubPath} />
          </div>
          <div className="flex items-center gap-3">
            <NewFolderDialog onCreate={createFolder} />
            <FileUploader ownerId={user.$id} accountId={user.accountId} mode="private" path={subPath} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-[20px] shadow-drop-1 border border-light-300 w-full">
          <div className="flex items-center gap-3 flex-1">
            <LocalSearch files={files} onFilteredFilesChange={setFilteredFiles} />
            <div className="hidden sm:block">
              <Sort />
            </div>
          </div>

          {/* View Toggles */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-light-300 rounded-2xl p-1 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-xl transition-all duration-300 ${showThumbnails ? "bg-white text-brand shadow-sm scale-105" : "text-light-200 hover:text-light-100"}`}
                onClick={() => setShowThumbnails(!showThumbnails)}
                title={showThumbnails ? "Hide thumbnails" : "Show thumbnails"}
              >
                <ImageIcon size={18} />
              </Button>
            </div>

            <div className="flex items-center bg-light-300 rounded-2xl p-1 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-xl transition-all duration-300 ${view === "grid" ? "bg-white text-brand shadow-sm scale-105" : "text-light-200 hover:text-light-100"}`}
                onClick={() => setView("grid")}
                title="Grid view"
              >
                <LayoutGrid size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-xl transition-all duration-300 ${view === "list" ? "bg-white text-brand shadow-sm scale-105" : "text-light-200 hover:text-light-100"}`}
                onClick={() => setView("list")}
                title="List view"
              >
                <ListIcon size={18} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red/30 bg-red/10 shadow-drop-1 w-full flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="body-2 text-red font-medium mb-1">Error Loading Files</p>
            <p className="text-sm text-red/80">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-red hover:text-red hover:bg-red/10"
              onClick={reload}
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      <DashboardLayout
        files={filteredFiles}
        totalSpace={totalSpace}
        currentUser={user}
        variant="brand"
        isLoading={loading}
        title={searchText ? "Search Results" : subPath ? `Files in ${subPath}` : "All Files"}
        onFolderClick={navigateToFolder}
        view={view}
        showThumbnails={showThumbnails}
        hideOwner={true}
        emptyMessage={
          searchText
            ? `No files found matching "${searchText}"`
            : subPath
              ? "This folder is empty. Upload files or create subfolders to get started."
              : "No files yet. Upload your first file to get started!"
        }
      />
    </div>
  );
};

export default OwnS3Page;
