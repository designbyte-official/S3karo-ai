"use client";

import React from "react";

export const SkeletonCard = () => (
  <div className="animate-pulse space-y-3 rounded-[20px] border border-light-300 bg-white p-4 shadow-drop-1">
    <div className="h-32 rounded-xl bg-light-300" />
    <div className="space-y-2">
      <div className="h-4 w-3/4 rounded bg-light-300" />
      <div className="h-3 w-1/2 rounded bg-light-300" />
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonList = ({ count = 6 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex animate-pulse items-center gap-4 rounded-[20px] border border-light-300 bg-white p-4 shadow-drop-1"
      >
        <div className="size-12 shrink-0 rounded-lg bg-light-300" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-light-300" />
          <div className="h-3 w-1/3 rounded bg-light-300" />
        </div>
        <div className="h-4 w-16 rounded bg-light-300" />
      </div>
    ))}
  </div>
);

export const SkeletonStorageChart = () => (
  <div className="animate-pulse space-y-4 rounded-[20px] border border-light-300 bg-white p-6 shadow-drop-1">
    <div className="h-6 w-1/2 rounded bg-light-300" />
    <div className="h-32 rounded-xl bg-light-300" />
    <div className="space-y-2">
      <div className="h-4 w-full rounded bg-light-300" />
      <div className="h-4 w-3/4 rounded bg-light-300" />
    </div>
  </div>
);

export const SkeletonSummaryCard = () => (
  <div className="animate-pulse space-y-4 rounded-[20px] border border-light-300 bg-white p-6 shadow-drop-1">
    <div className="flex items-center justify-between">
      <div className="size-16 rounded-full bg-light-300" />
      <div className="h-6 w-20 rounded bg-light-300" />
    </div>
    <div className="h-5 w-2/3 rounded bg-light-300" />
    <div className="h-px bg-light-300" />
    <div className="mx-auto h-4 w-1/2 rounded bg-light-300" />
  </div>
);

export const ExplorerSkeleton = ({ view = "grid" }: { view?: "grid" | "list" }) => (
  <div className="page-container !max-w-full !items-start lg:px-10">
    <div className="w-full space-y-6">
      <header className="mb-8 flex w-full flex-col gap-6">
        {/* Title and Action Buttons */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <div className="mb-2 h-10 w-48 animate-pulse rounded-xl bg-light-300" />
            {/* Breadcrumbs skeleton */}
            <div className="mt-2 flex items-center gap-2">
              <div className="h-8 w-16 animate-pulse rounded-xl bg-light-300" />
              <div className="size-4 animate-pulse rounded bg-light-300" />
              <div className="h-8 w-24 animate-pulse rounded-xl bg-light-300" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-[52px] w-32 animate-pulse rounded-full bg-light-300" />
            <div className="h-[52px] w-32 animate-pulse rounded-full bg-light-300" />
          </div>
        </div>

        {/* Search and Sort Bar */}
        <div className="flex w-full flex-col items-stretch justify-between gap-4 rounded-[20px] border border-light-300 bg-white p-4 shadow-drop-1 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3">
            <div className="h-9 flex-1 animate-pulse rounded-lg bg-light-300" />
            <div className="hidden h-9 w-32 animate-pulse rounded-lg bg-light-300 sm:block" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {/* Thumbnail toggle skeleton */}
            <div className="flex items-center rounded-2xl bg-light-300 p-1">
              <div className="size-9 rounded-xl bg-white" />
            </div>
            {/* View toggle skeleton */}
            <div className="flex items-center rounded-2xl bg-light-300 p-1">
              <div className="size-9 rounded-xl bg-white" />
              <div className="ml-1 size-9 rounded-xl bg-light-300" />
            </div>
          </div>
        </div>
      </header>

      {/* Files Grid/List Skeleton */}
      <div className="w-full">
        {view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-4 rounded-[20px] border border-light-300 bg-white p-4 shadow-drop-1"
              >
                <div className="size-12 shrink-0 rounded-lg bg-light-300" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-light-300" />
                  <div className="h-3 w-1/3 rounded bg-light-300" />
                </div>
                <div className="h-4 w-16 rounded bg-light-300" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

// Profile Skeleton Component
export const ProfileSkeleton = () => (
  <div className="page-container">
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* User Info Skeleton */}
      <div className="animate-pulse rounded-[18px] border border-light-300 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="size-20 rounded-full bg-light-300" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-48 rounded bg-light-300" />
            <div className="h-4 w-64 rounded bg-light-300" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-light-300" />
          <div className="h-4 w-3/4 rounded bg-light-300" />
        </div>
      </div>

      {/* API Keys Skeleton */}
      <div className="animate-pulse rounded-[18px] border border-light-300 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 rounded bg-light-300" />
            <div className="h-4 w-64 rounded bg-light-300" />
          </div>
          <div className="h-10 w-32 rounded bg-light-300" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-light-300 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-40 rounded bg-white" />
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-white" />
                    <div className="h-4 w-3/4 rounded bg-white" />
                  </div>
                </div>
                <div className="size-8 rounded bg-white" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Skeleton */}
      <div className="animate-pulse rounded-[18px] border border-light-300 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-40 rounded bg-light-300" />
            <div className="h-4 w-56 rounded bg-light-300" />
          </div>
          <div className="h-10 w-32 rounded bg-light-300" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-24 rounded bg-light-300" />
          <div className="h-3 w-full rounded bg-light-300" />
          <div className="h-3 w-2/3 rounded bg-light-300" />
        </div>
      </div>
    </div>
  </div>
);
