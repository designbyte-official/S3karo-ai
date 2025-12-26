"use client";

import React from "react";

export const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-[20px] shadow-drop-1 border border-light-300 p-4 space-y-3">
    <div className="h-32 bg-light-300 rounded-xl" />
    <div className="space-y-2">
      <div className="h-4 bg-light-300 rounded w-3/4" />
      <div className="h-3 bg-light-300 rounded w-1/2" />
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonList = ({ count = 6 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse bg-white rounded-[20px] shadow-drop-1 border border-light-300 p-4 flex items-center gap-4">
        <div className="h-12 w-12 bg-light-300 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-light-300 rounded w-2/3" />
          <div className="h-3 bg-light-300 rounded w-1/3" />
        </div>
        <div className="h-4 bg-light-300 rounded w-16" />
      </div>
    ))}
  </div>
);

export const SkeletonStorageChart = () => (
  <div className="animate-pulse bg-white rounded-[20px] shadow-drop-1 border border-light-300 p-6 space-y-4">
    <div className="h-6 bg-light-300 rounded w-1/2" />
    <div className="h-32 bg-light-300 rounded-xl" />
    <div className="space-y-2">
      <div className="h-4 bg-light-300 rounded w-full" />
      <div className="h-4 bg-light-300 rounded w-3/4" />
    </div>
  </div>
);

export const SkeletonSummaryCard = () => (
  <div className="animate-pulse bg-white rounded-[20px] shadow-drop-1 border border-light-300 p-6 space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-16 w-16 bg-light-300 rounded-full" />
      <div className="h-6 bg-light-300 rounded w-20" />
    </div>
    <div className="h-5 bg-light-300 rounded w-2/3" />
    <div className="h-px bg-light-300" />
    <div className="h-4 bg-light-300 rounded w-1/2 mx-auto" />
  </div>
);

export const ExplorerSkeleton = ({ view = "grid" }: { view?: "grid" | "list" }) => (
  <div className="page-container !items-start !max-w-full lg:px-10">
    <div className="w-full space-y-6">
      <header className="flex flex-col gap-6 mb-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-8 bg-light-300 rounded-xl w-48 animate-pulse" />
            <div className="h-6 bg-light-300 rounded-lg w-64 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-[52px] w-32 bg-light-300 rounded-full animate-pulse" />
            <div className="h-[52px] w-32 bg-light-300 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="h-16 bg-light-300 rounded-[20px] animate-pulse" />
      </header>
      
      <div className="dashboard-container">
        <section className="dashboard-left-sidebar space-y-6">
          <SkeletonStorageChart />
          <ul className="dashboard-summary-list">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i}>
                <SkeletonSummaryCard />
              </li>
            ))}
          </ul>
        </section>
        
        <section className="dashboard-recent-files dashboard-right-content">
          {view === "grid" ? <SkeletonGrid count={8} /> : <SkeletonList count={6} />}
        </section>
      </div>
    </div>
  </div>
);

// Profile Skeleton Component
export const ProfileSkeleton = () => (
  <div className="page-container">
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* User Info Skeleton */}
      <div className="animate-pulse p-6 bg-white rounded-[18px] shadow-sm border border-light-300">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-20 w-20 bg-light-300 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-light-300 rounded w-48" />
            <div className="h-4 bg-light-300 rounded w-64" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-light-300 rounded w-full" />
          <div className="h-4 bg-light-300 rounded w-3/4" />
        </div>
      </div>

      {/* API Keys Skeleton */}
      <div className="animate-pulse p-6 bg-white rounded-[18px] shadow-sm border border-light-300">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-8 bg-light-300 rounded w-32" />
            <div className="h-4 bg-light-300 rounded w-64" />
          </div>
          <div className="h-10 bg-light-300 rounded w-32" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-4 bg-light-300 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-white rounded w-40" />
                  <div className="space-y-2">
                    <div className="h-4 bg-white rounded w-full" />
                    <div className="h-4 bg-white rounded w-3/4" />
                  </div>
                </div>
                <div className="h-8 w-8 bg-white rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Skeleton */}
      <div className="animate-pulse p-6 bg-white rounded-[18px] shadow-sm border border-light-300">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-8 bg-light-300 rounded w-40" />
            <div className="h-4 bg-light-300 rounded w-56" />
          </div>
          <div className="h-10 bg-light-300 rounded w-32" />
        </div>
        <div className="space-y-4">
          <div className="h-6 bg-light-300 rounded w-24" />
          <div className="h-3 bg-light-300 rounded w-full" />
          <div className="h-3 bg-light-300 rounded w-2/3" />
        </div>
      </div>
    </div>
  </div>
);

