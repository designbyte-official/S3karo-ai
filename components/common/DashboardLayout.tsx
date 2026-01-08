"use client";

import React from "react";

import Image from "next/image";

import FileList from "@/features/managed-storage/components/FileList";
import { convertFileSize, getUsageSummary } from "@/features/shared/utils";
import { S3File } from "@/types/file";

import { SkeletonGrid, SkeletonList, SkeletonStorageChart, SkeletonSummaryCard } from "./SkeletonLoader";
import { StorageChart } from "./StorageChart";
import { UsageSummaryCard } from "./UsageSummaryCard";
import { useDashboardUsage } from "@/hooks/use-dashboard-usage";


interface DashboardLayoutProps {
    files: S3File[];
    totalSpace: {
        used: number;
        all?: number;
        image?: { size: number; latestDate: string };
        video?: { size: number; latestDate: string };
        audio?: { size: number; latestDate: string };
        document?: { size: number; latestDate: string };
        other?: { size: number; latestDate: string };
    };
    currentUser?: any;
    variant?: "brand" | "blue";
    title?: string;
    isLoading?: boolean;
    onFolderClick?: (path: string) => void;
    view?: "grid" | "list";
    showThumbnails?: boolean;
    hideOwner?: boolean;
    emptyMessage?: string;
}

export const DashboardLayout = ({
    files,
    totalSpace,
    currentUser,
    variant = "brand",
    title = "Recent files uploaded",
    isLoading = false,
    onFolderClick,
    view = "grid",
    showThumbnails = false,
    hideOwner = false,
    emptyMessage = "No files uploaded yet"
}: DashboardLayoutProps) => {
    const { usageSummary } = useDashboardUsage(totalSpace);

    return (
        <div className={totalSpace?.all !== undefined ? "dashboard-container" : "w-full"}>
            {totalSpace?.all !== undefined && (
                <section className="dashboard-left-sidebar">
                    {isLoading ? (
                        <>
                            <SkeletonStorageChart />
                            <ul className="dashboard-summary-list">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <li key={i}>
                                        <SkeletonSummaryCard />
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <>
                            <StorageChart used={totalSpace.used} total={totalSpace.all} variant={variant} />
                            {usageSummary.length > 0 && (
                                <ul className="dashboard-summary-list">
                                    {usageSummary.map((summary) => (
                                        <UsageSummaryCard
                                            key={summary.title}
                                            {...summary}
                                        />
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </section>
            )}

            <section className={totalSpace?.all !== undefined ? "dashboard-recent-files dashboard-right-content" : "w-full"}>
                {isLoading ? (
                    view === "grid" ? <SkeletonGrid count={8} /> : <SkeletonList count={6} />
                ) : files.length > 0 ? (
                    <FileList files={files} currentUser={currentUser} onFolderClick={onFolderClick} view={view} showThumbnails={showThumbnails} hideOwner={hideOwner} />
                ) : (
                    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                        <div className="mb-4 rounded-full bg-light-300 p-4">
                            <svg className="size-12 text-light-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="body-1 mb-2 text-light-200">{emptyMessage}</p>
                        <p className="caption text-light-200/70">Drag and drop files here or use the upload button</p>
                    </div>
                )}
            </section>
        </div>
    );
};
