"use client";

import React, { useEffect } from "react";

import { useRouter } from "next/navigation";

import { LayoutGrid, List as ListIcon, Image as ImageIcon, AlertCircle } from "lucide-react";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { DashboardLayout } from "@/components/common/DashboardLayout";
import DragDropUploadZone from "@/components/common/DragDropUploadZone";
import FileUploader from "@/components/common/FileUploader";
import LocalSearch from "@/components/common/LocalSearch";
import { ExplorerSkeleton } from "@/components/common/SkeletonLoader";
import Sort from "@/components/common/Sort";
import { Button } from "@/components/ui/button";
import { NewFolderDialog } from "@/features/private-s3/components/NewFolderDialog";
import { useOwnS3 } from "@/features/private-s3/hooks/use-own-s3";
import { useExplorerState } from "@/hooks/use-explorer-state";
import { useToast } from "@/hooks/use-toast";

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
        <div className="mb-6 w-full rounded-lg border border-red/30 bg-red/10 p-4 font-medium text-red shadow-drop-1">
          Please sign in to access your S3 files.
        </div>
      </div>
    );
  }

  if (!hasConfig) {
    return (
      <div className="page-container !max-w-full !items-start lg:px-10">
        <header className="mb-8 flex w-full flex-col gap-6">
          <h1 className="h1 capitalize">Own S3 Explorer</h1>
        </header>
        <div className="flex w-full flex-col items-center justify-center gap-4 rounded-[20px] border border-red/20 bg-red/5 p-6 text-center shadow-drop-1">
          <div className="rounded-full bg-red/10 p-3 text-3xl">⚠️</div>
          <h3 className="h3 text-red">Configuration Required</h3>
          <p className="body-1 max-w-md text-light-100">
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
    <div className="page-container !max-w-full !items-start lg:px-10">
      <DragDropUploadZone
        ownerId={user.$id}
        accountId={user.accountId}
        subPath={subPath}
        mode="private"
        onUploadComplete={reload}
      />

      <header className="mb-8 flex w-full flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <h1 className="h1 truncate capitalize">Own S3 Explorer</h1>
            <Breadcrumbs subPath={subPath} onNavigate={setSubPath} />
          </div>
          <div className="flex items-center gap-3">
            <NewFolderDialog onCreate={createFolder} />
            <FileUploader ownerId={user.$id} accountId={user.accountId} mode="private" path={subPath} />
          </div>
        </div>

        <div className="flex w-full flex-col items-stretch justify-between gap-4 rounded-[20px] border border-light-300 bg-white p-4 shadow-drop-1 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3">
            <LocalSearch files={files} onFilteredFilesChange={setFilteredFiles} />
            <div className="hidden sm:block">
              <Sort />
            </div>
          </div>

          {/* View Toggles */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center rounded-2xl bg-light-300 p-1 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                className={`size-9 rounded-xl transition-all duration-300 ${showThumbnails ? "scale-105 bg-white text-brand shadow-sm" : "text-light-200 hover:text-light-100"}`}
                onClick={() => setShowThumbnails(!showThumbnails)}
                title={showThumbnails ? "Hide thumbnails" : "Show thumbnails"}
              >
                <ImageIcon size={18} />
              </Button>
            </div>

            <div className="flex items-center rounded-2xl bg-light-300 p-1 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                className={`size-9 rounded-xl transition-all duration-300 ${view === "grid" ? "scale-105 bg-white text-brand shadow-sm" : "text-light-200 hover:text-light-100"}`}
                onClick={() => setView("grid")}
                title="Grid view"
              >
                <LayoutGrid size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`size-9 rounded-xl transition-all duration-300 ${view === "list" ? "scale-105 bg-white text-brand shadow-sm" : "text-light-200 hover:text-light-100"}`}
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
        <div className="mb-6 flex w-full items-start gap-3 rounded-lg border border-red/30 bg-red/10 p-4 shadow-drop-1">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-red" />
          <div className="flex-1">
            <p className="body-2 mb-1 font-medium text-red">Error Loading Files</p>
            <p className="text-sm text-red/80">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-red hover:bg-red/10 hover:text-red"
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
