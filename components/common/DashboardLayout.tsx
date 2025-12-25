"use client";

import React from "react";
import { S3File } from "@/types/file";
import { StorageChart } from "./StorageChart";
import { convertFileSize, getUsageSummary } from "@/features/shared/utils";
import FileList from "@/features/managed-storage/components/FileList";
import { S3Config } from "@/features/private-s3/services/s3-config.service";
import Image from "next/image";

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
}

export const DashboardLayout = ({
    files,
    totalSpace,
    currentUser,
    variant = "brand",
    title = "Recent files uploaded",
    isLoading = false,
    onFolderClick,
    view = "grid"
}: DashboardLayoutProps) => {
    const usageSummary = totalSpace.document ? getUsageSummary(totalSpace) : [];

    return (
        <div className={totalSpace?.all !== undefined ? "dashboard-container" : "page-container !items-start"}>
            {totalSpace?.all !== undefined && (
                <section>
                    <StorageChart used={totalSpace.used} total={totalSpace.all} variant={variant} />

                    {/* Summary */}
                    {usageSummary.length > 0 && (
                        <ul className="dashboard-summary-list">
                            {usageSummary.map((summary) => (
                                <li key={summary.title} className="dashboard-summary-card">
                                    <div className="space-y-4">
                                        <div className="flex justify-between gap-3">
                                            <Image
                                                src={summary.icon}
                                                width={100}
                                                height={100}
                                                alt="uploaded image"
                                                className="summary-type-icon"
                                            />
                                            <h4 className="summary-type-size">
                                                {convertFileSize(summary.size) || "0 Bytes"}
                                            </h4>
                                        </div>

                                        <h5 className="summary-type-title">{summary.title}</h5>
                                        <div className="separator" />
                                        <p className="caption text-center text-light-200">
                                            {summary.latestDate
                                                ? new Date(summary.latestDate).toLocaleString()
                                                : "No files"}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <section className={totalSpace?.all !== undefined ? "dashboard-recent-files" : "w-full"}>
                {isLoading ? (
                    <p className="body-1 mt-10 text-center text-light-200">Loading...</p>
                ) : files.length > 0 ? (
                    <FileList files={files} currentUser={currentUser} onFolderClick={onFolderClick} view={"list"} />
                ) : (
                    <p className="empty-list">No files uploaded yet</p>
                )}
            </section>
        </div>
    );
};
