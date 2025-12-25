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

import { LayoutGrid, List as ListIcon, Plus, FolderPlus, Search as SearchIcon, ChevronRight } from "lucide-react";

// ... (OwnS3Client component definition)

const OwnS3Client = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchText = searchParams.get("query") || "";
  const sort = searchParams.get("sort") || "$createdAt-desc";
  const [view, setView] = React.useState<"grid" | "list">("grid");

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

  // LocalSearch manages filteredFiles - we just provide the setter
  const [filteredFiles, setFilteredFiles] = React.useState<any[]>([]);

  // Update filteredFiles when files change (only when length changes to avoid infinite loop)
  const prevFilesLength = React.useRef(files.length);
  React.useEffect(() => {
    if (files.length !== prevFilesLength.current) {
      setFilteredFiles(files);
      prevFilesLength.current = files.length;
    }
  }, [files.length]);

  // ... (auth checks are unchanged)

  if (loading && !files.length) {
    return (
      <div className="page-container !items-start">
        <p className="body-2 text-light-100">Loading explorer...</p>
      </div>
    );
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
        onUploadComplete={reload}
      />
      <header className="flex flex-col gap-6 mb-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="h1 capitalize truncate">Own S3 Explorer</h1>
            <p className="body-2 text-light-200 mt-1">
              Manage your private AWS S3 storage securely.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NewFolderDialog onCreate={createFolder} />
            <FileUploader ownerId={user.$id} accountId={user.accountId} mode="private" path={subPath} />
          </div>
        </div>

        <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white p-5 rounded-[20px] shadow-drop-1 border border-light-300 w-full">
          {/* Breadcrumbs / Navigation */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0 max-w-full xl:max-w-[50%]">
            <Button
              variant="ghost"
              className="h-10 px-4 text-light-100 hover:bg-light-300 rounded-xl flex items-center gap-2 shrink-0"
              onClick={() => setSubPath("")}
            >
              <span className={!subPath ? "font-bold text-brand" : "font-medium"}>Root</span>
            </Button>
            {subPath.split('/').filter(Boolean).map((part, i, arr) => (
              <React.Fragment key={i}>
                <ChevronRight size={16} className="text-light-200 shrink-0 opacity-50" />
                <Button
                  variant="ghost"
                  className="h-10 px-4 text-light-100 hover:bg-light-300 rounded-xl shrink-0"
                  onClick={() => setSubPath(arr.slice(0, i + 1).join('/'))}
                >
                  <span className={i === arr.length - 1 ? "font-bold text-brand" : "font-medium"}>{part}</span>
                </Button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full xl:w-auto justify-end">
            <LocalSearch files={files} onFilteredFilesChange={setFilteredFiles} />

            <div className="hidden sm:block">
              <Sort />
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-light-300 rounded-2xl p-1 shrink-0 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-xl transition-all duration-300 ${view === 'grid' ? 'bg-white text-brand shadow-sm scale-105' : 'text-light-200 hover:text-light-100'}`}
                onClick={() => setView('grid')}
              >
                <LayoutGrid size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-xl transition-all duration-300 ${view === 'list' ? 'bg-white text-brand shadow-sm scale-105' : 'text-light-200 hover:text-light-100'}`}
                onClick={() => setView('list')}
              >
                <ListIcon size={18} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <DashboardLayout
        files={filteredFiles}
        totalSpace={totalSpace}
        currentUser={user}
        variant="brand"
        isLoading={loading}
        title={searchText ? "Search Results" : subPath ? `Files in ${subPath}` : "All Files"}
        onFolderClick={navigateToFolder}
        view={view}
      />
    </div>
  );
};

// Simple New Folder Dialog Component
const NewFolderDialog = ({ onCreate }: { onCreate: (name: string) => Promise<void> }) => {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    try {
      await onCreate(name);
      setOpen(false);
      setName("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shad-button-primary h-[52px] gap-2 px-6 bg-dark-100 hover:bg-dark-200 text-white rounded-full transition-all shadow-drop-1">
          <FolderPlus size={20} />
          <span className="hidden sm:block font-medium">New Folder</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog button">
        <DialogHeader>
          <DialogTitle className="capitalize">Create New Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Folder Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shad-input"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="shad-submit-btn">
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default OwnS3Page;
