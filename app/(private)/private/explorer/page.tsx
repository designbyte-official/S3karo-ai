"use client";

import { DashboardLayout } from "@/components/common/DashboardLayout";

import React, { useEffect } from "react";
import { useOwnS3 } from "@/features/private-s3/hooks/use-own-s3";
import Card from "@/components/common/Card";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { convertFileSize } from "@/features/shared/utils";
import ReactFragment = React.Fragment;

const OwnS3Page = () => {
  return <OwnS3Client />;
};

const OwnS3Client = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchText = searchParams.get("query") || "";
  const sort = searchParams.get("sort") || "$createdAt-desc";

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
    setSubPath
  } = useOwnS3(searchText, sort);

  useEffect(() => {
    if (!loading && user && !hasConfig) {
      router.push('/private/settings');
    }
  }, [hasConfig, loading, user, router]);

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

  if (!hasConfig) return null;

  const totalUsedFormatted = totalSpace ? convertFileSize(totalSpace.used) : "0 Bytes";

  return (
    <div className="page-container !items-start !max-w-full lg:px-10">
      <header className="flex flex-col gap-6 mb-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="h1 capitalize truncate">Own S3 Explorer</h1>
            <p className="body-2 text-light-200 mt-1">
              Manage your private AWS S3 storage securely.
            </p>
          </div>
        </div>

        {/* Breadcrumbs / Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar bg-white/5 px-4 rounded-xl border border-white/5">
          <Button
            variant="ghost"
            className="h-8 px-2 text-light-200 hover:text-white hover:bg-white/10"
            onClick={() => setSubPath("")}
          >
            Root
          </Button>
          {subPath.split('/').filter(Boolean).map((part, i, arr) => (
            <ReactFragment key={i}>
              <span className="text-light-200 opacity-50">/</span>
              <Button
                variant="ghost"
                className="h-8 px-2 text-light-200 hover:text-white hover:bg-white/10"
                onClick={() => setSubPath(arr.slice(0, i + 1).join('/'))}
              >
                {part}
              </Button>
            </ReactFragment>
          ))}
        </div>
      </header>

      <DashboardLayout
        files={files}
        totalSpace={totalSpace}
        currentUser={user}
        variant="blue"
        isLoading={loading}
        title={searchText ? "Search Results" : subPath ? `Files in ${subPath}` : "All Files"}
      />
    </div>
  );
};

export default OwnS3Page;
