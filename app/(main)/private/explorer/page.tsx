"use client";

import { DashboardLayout } from "@/components/common/DashboardLayout";

import React, { useEffect } from "react";
import { useOwnS3 } from "@/features/private-s3/hooks/use-own-s3";
import Card from "@/components/common/Card";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { convertFileSize } from "@/features/shared/utils";
import ReactFragment = React.Fragment;
import FileUploader from "@/components/common/FileUploader";
import LocalSearch from "@/components/common/LocalSearch";
import DragDropUploadZone from "@/components/common/DragDropUploadZone";
import Sort from "@/components/common/Sort";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const OwnS3Page = () => {
  return <OwnS3Client />;
};

import { LayoutGrid, List as ListIcon, Plus, FolderPlus, Search as SearchIcon, ChevronRight, Image as ImageIcon, AlertCircle } from "lucide-react";
import { ExplorerSkeleton } from "@/components/common/SkeletonLoader";
import { useToast } from "@/hooks/use-toast";

// ... (OwnS3Client component definition)

const OwnS3Client = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchText = searchParams.get("query") || "";
  const sort = searchParams.get("sort") || "$createdAt-desc";
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [showThumbnails, setShowThumbnails] = React.useState(false); // Default: show icons only
  const { toast } = useToast();

  const {
    files,
    totalFiles,
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
  } = useOwnS3(searchText, sort);

  // Show error toast when error occurs
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error Loading Files",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // LocalSearch manages filteredFiles - we just provide the setter
  const [filteredFiles, setFilteredFiles] = React.useState<any[]>([]);

  // Update filteredFiles when files actually change (using file IDs for comparison)
  // Memoize the file IDs to prevent unnecessary updates
  const filesIdsRef = React.useRef<string>('');
  const memoizedFiles = React.useMemo(() => {
    const currentIds = files.map(f => f.$id || f.bucketFileId).join(',');
    if (currentIds !== filesIdsRef.current) {
      filesIdsRef.current = currentIds;
      return files;
    }
    return files;
  }, [files]);

  React.useEffect(() => {
    setFilteredFiles(memoizedFiles);
  }, [memoizedFiles]);

  if (loading) {
    return <ExplorerSkeleton view={view} />;
  }

  if (!user) {
    return (
      <div className="page-container !items-start">
        <div className="mb-6 p-4 rounded-lg border border-red/30 bg-red/10 shadow-drop-1 w-full">
          <p className="body-2 text-red font-medium">Please sign in to access your S3 files.</p>
        </div>
      </div>
    );
  }

  const totalUsedFormatted = totalSpace ? convertFileSize(totalSpace.used) : "0 Bytes";

  if (!hasConfig) {
    // (Kept unchanged for brevity in this replacement block, but assuming logic remains)
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
            onClick={() => router.push('/private/settings')}
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
        onUploadComplete={() => {
          reload();
        }}
      />
      <header className="flex flex-col gap-6 mb-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="h1 capitalize truncate">Own S3 Explorer</h1>
            {/* Breadcrumbs / Navigation - moved here */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-2">
              {/* Navigation Arrows */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg hover:bg-light-300 disabled:opacity-30"
                  onClick={() => {
                    const parts = subPath.split('/').filter(Boolean);
                    if (parts.length > 0) {
                      parts.pop();
                      setSubPath(parts.join('/'));
                    }
                  }}
                  disabled={!subPath}
                  title="Go back"
                  aria-label="Navigate to parent folder"
                >
                  <ChevronRight size={16} className="rotate-180" aria-hidden="true" />
                </Button>
                <div className="w-px h-5 bg-light-300" />
              </div>

              {/* Breadcrumbs */}
              <Button
                variant="ghost"
                className="h-8 px-3 text-light-100 hover:bg-light-300 rounded-xl flex items-center gap-2 shrink-0"
                onClick={() => setSubPath("")}
              >
                <span className={!subPath ? "font-bold text-brand text-sm" : "font-medium text-sm"}>Root</span>
              </Button>
              {subPath.split('/').filter(Boolean).map((part, i, arr) => (
                <React.Fragment key={i}>
                  <ChevronRight size={14} className="text-light-200 shrink-0 opacity-50" />
                  <Button
                    variant="ghost"
                    className="h-8 px-3 text-light-100 hover:bg-light-300 rounded-xl shrink-0"
                    onClick={() => setSubPath(arr.slice(0, i + 1).join('/'))}
                  >
                    <span className={i === arr.length - 1 ? "font-bold text-brand text-sm" : "font-medium text-sm"}>{part}</span>
                  </Button>
                </React.Fragment>
              ))}
            </div>
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

          {/* View Toggle and Thumbnail Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Thumbnail Toggle */}
            <div className="flex items-center bg-light-300 rounded-2xl p-1 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-xl transition-all duration-300 ${showThumbnails ? 'bg-white text-brand shadow-sm scale-105' : 'text-light-200 hover:text-light-100'}`}
                onClick={() => setShowThumbnails(!showThumbnails)}
                title={showThumbnails ? "Hide thumbnails" : "Show thumbnails"}
                aria-label={showThumbnails ? "Hide thumbnails" : "Show thumbnails"}
                aria-pressed={showThumbnails}
              >
                <ImageIcon size={18} aria-hidden="true" />
              </Button>
            </div>
            {/* View Toggle */}
            <div className="flex items-center bg-light-300 rounded-2xl p-1 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-xl transition-all duration-300 ${view === 'grid' ? 'bg-white text-brand shadow-sm scale-105' : 'text-light-200 hover:text-light-100'}`}
                onClick={() => setView('grid')}
                aria-label="Switch to grid view"
                aria-pressed={view === 'grid'}
                title="Grid view"
              >
                <LayoutGrid size={18} aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-xl transition-all duration-300 ${view === 'list' ? 'bg-white text-brand shadow-sm scale-105' : 'text-light-200 hover:text-light-100'}`}
                onClick={() => setView('list')}
                aria-label="Switch to list view"
                aria-pressed={view === 'list'}
                title="List view"
              >
                <ListIcon size={18} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
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
              onClick={() => reload()}
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
              ? `This folder is empty. Upload files or create subfolders to get started.`
              : "No files yet. Upload your first file to get started!"
        }
      />
    </div>
  );
};

// Simple New Folder Dialog Component
const NewFolderDialog = ({ onCreate }: { onCreate: (name: string) => Promise<void> }) => {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure dialog is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setName("");
      setLoading(false);
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Folder name is required");
      return;
    }

    // Validate folder name
    if (trimmedName.includes('/') || trimmedName.includes('\\')) {
      setError("Folder name cannot contain slashes");
      return;
    }

    if (trimmedName.length > 255) {
      setError("Folder name is too long (max 255 characters)");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await onCreate(trimmedName);
      toast({
        title: "Folder Created",
        description: `"${trimmedName}" has been created successfully.`,
        className: "success-toast",
      });
      setOpen(false);
      setName("");
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to create folder. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    setOpen(false);
    setName("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shad-button-primary h-[52px] gap-2 px-6 bg-dark-100 hover:bg-dark-200 text-white rounded-full transition-all shadow-drop-1">
          <FolderPlus size={20} />
          <span className="hidden sm:block font-medium">New Folder</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog max-w-[480px] p-10 rounded-[32px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-4">
          <DialogTitle className="h2 text-dark-100 text-center sm:text-left">Create New Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8 mt-4">
          <div className="space-y-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Folder Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleClose();
                }
              }}
              className={`shad-input w-full h-[64px] px-6 rounded-full bg-light-400/5 border-transparent focus:border-brand/20 transition-all ${error ? "border-red" : ""}`}
              autoFocus
              disabled={loading}
              aria-invalid={!!error}
              aria-describedby={error ? "folder-name-error" : undefined}
            />
            {error && (
              <p id="folder-name-error" className="text-sm text-red px-4 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
              className="h-12 px-8 rounded-full text-light-100 hover:bg-light-300 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="h-12 px-10 rounded-full bg-brand text-white hover:bg-brand/90 shadow-drop-2 font-bold flex-1"
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default OwnS3Page;
